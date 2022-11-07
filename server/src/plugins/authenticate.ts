import { FastifyRequest } from "fastify";

export async function authenticate(request: FastifyRequest) {
  await request.jwtVerify() // chamando com await consigo ter acesso ao request.user e descubro se o token é válido
}