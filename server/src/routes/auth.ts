import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/me',
    {
      onRequest: [authenticate] // quando /me for chamada, antes de executar o request, ele vai executar o authenticate, se não tiver verificado, o request nem vai executar
    }, async (request) => {
      return { user: request.user } // retorna informações do usuário, porem só se o await for executado antes dessa linha
    })

  fastify.post('/user', async (request) => {
    const createUserBody = z.object({
      access_token: z.string(),
    })

    const { access_token } = createUserBody.parse(request.body) // tornar o access_token em string

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    })

    const userData = await userResponse.json()

    const userInfoSchema = z.object({
      id: z.string(), // retornar o id do usuário dentro do google
      email: z.string().email(), // vai checar se o email ta formatado corretamente
      name: z.string(), // nome cadastrado no google
      picture: z.string().url(), // retorna o endereço de imagem do usuário
    })

    const userInfo = userInfoSchema.parse(userData) // fazendo validação se os dados do google batem com o Schema

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id, // vou tentar encontrar o usuário já cadastrado
      }
    })

    if(!user) { // se user não bater, usuário vai criar um cadastro
      user = await prisma.user.create({
        data: {
          googleId: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture,
        }
      })
    }

    const token = fastify.jwt.sign({
      name: user.name,
      avatarUrl: user.avatarUrl,
    }, {
      sub: user.id, // representa quem gerou o token, o id da aplicação
      expiresIn: '7 days', // em produção é recomendado um tempo menor
    })

    return { token }
  })
}