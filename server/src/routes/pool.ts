import { FastifyInstance } from "fastify"
import ShortUniqueId from "short-unique-id"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function PoolRoutes(fastify: FastifyInstance) {
  fastify.get('/pools/count', async () => {
    const count = await prisma.pool.count()

    return { count }
  })

  fastify.post('/pools', async (request, reply) => {
    const createPoolBody = z.object({
      title: z.string(),
    })

    const { title } = createPoolBody.parse(request.body)

    const generate = new ShortUniqueId({ length: 6 })
    const code = String(generate()).toUpperCase()

    try {
      await request.jwtVerify() // se chegar aqui, tenho um usuário autenticado

      await prisma.pool.create({
        data: {
          title,
          code,
          ownerId: request.user.sub, // sub = código de validação JWT

          participant: { // colocando o criador do bolão automaticamente dentro do próprio
            create: {
              userId: request.user.sub,
            }
          }
        }
      })
    } catch {
      await prisma.pool.create({
        data: {
          title,
          code,
        }
      })
    }

    return reply.status(201).send({ code })
  })

  fastify.post('/pools/join', {
    onRequest: [authenticate] // essa rota só é acessível se o usuário estiver autenticado
  }, async (request, reply) => {
    const joinPoolBody = z.object({
      code: z.string(),
    })

    const { code } = joinPoolBody.parse(request.body)

    const pool = await prisma.pool.findUnique({
      where: {
        code, // procura se o código do bolão é valido
      },
      include: { // vai trazer uma lista apenas em que o ID do participante seja igual a do usuário logado
        participant: {
          where: {
            userId: request.user.sub,
          }
        }
      }
    })

    if(!pool) {
      return reply.status(400).send({
        message: 'Bolão não encontrado.'
      })
    }

    if (pool.participant.length > 0) {
      return reply.status(400).send({
        message: 'Você já está participando desse bolão.'
      })
    }

    if (!pool.ownerId) { // vai colocar o primeiro usuário que entrar no bolão como dono
      await prisma.pool.update({
        where: {
          id: pool.id,
        },
        data: {
          ownerId: request.user.sub
        }
      })
    }

    await prisma.participant.create({
      data: {
        poolId: pool.id,
        userId: request.user.sub,
      }
    })

    return reply.status(201).send()
  })

  fastify.get('/pools', {
    onRequest: [authenticate]
  }, async (request) => {
    const pools = await prisma.pool.findMany({
      where: {
        participant: {
          some: { // procurando informações de boloões onde tem pelo menos 1 id do usuario logado
            userId: request.user.sub,
          }
        }
      },
      include: {
        _count: {
          select: {
            participant: true,
          }
        },
        participant: {
          select: {
            id: true,

            user: {
              select: {
                avatarUrl: true,
              }
            }
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return { pools }
  })

  // ':' antes do id para dizer que espera uma informação dinâmica
  fastify.get('/pools/:id', {
    onRequest: [authenticate],
  }, async (request) => {
    const getPoolParams = z.object({
      id: z.string(),
    })

    const { id } = getPoolParams.parse(request.params)

    const pool = await prisma.pool.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            participant: true,
          }
        },
        participant: {
          select: {
            id: true,

            user: {
              select: {
                avatarUrl: true,
              }
            }
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return { pool }
  })
}