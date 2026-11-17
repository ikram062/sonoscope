import type { PrismaClient } from '@prisma/client'
import type { UserInput } from '../schemas/user.schemas.js'

export function createUserService(db: PrismaClient) {
  return {
    create: async (data: UserInput) => db.user.create({ data }),
    list: async (limit: number, offset: number) => db.user.findMany({
      take: limit, skip: offset, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }),
    get: async (id: string) => db.user.findUnique({ where: { id } }),
    update: async (id: string, data: Partial<UserInput>) => db.user.update({ where: { id }, data }),
    delete: async (id: string) => db.user.delete({ where: { id } }),
  }
}

export type UserService = ReturnType<typeof createUserService>
