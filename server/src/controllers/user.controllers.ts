import type { Request, Response } from 'express'
import { HttpError, parsePagination, parseUser } from '../schemas/user.schemas.js'
import type { UserService } from '../services/user.services.js'

function userId(req: Request) {
  const id = req.params.id
  if (typeof id !== 'string' || !id.trim() || id.length > 128) {
    throw new HttpError(400, 'Invalid user ID.')
  }
  return id
}

export function createUserControllers(users: UserService) {
  return {
    create: async (req: Request, res: Response) => {
      const user = await users.create(parseUser(req.body, false))
      res.location(`/api/users/${user.id}`).status(201).json(user)
    },
    list: async (req: Request, res: Response) => {
      const { limit, offset } = parsePagination(req.query)
      res.json({ users: await users.list(limit, offset), limit, offset })
    },
    get: async (req: Request, res: Response) => {
      const user = await users.get(userId(req))
      if (!user) throw new HttpError(404, 'User not found.')
      res.json(user)
    },
    update: async (req: Request, res: Response) => {
      res.json(await users.update(userId(req), parseUser(req.body, true)))
    },
    delete: async (req: Request, res: Response) => {
      await users.delete(userId(req))
      res.status(204).end()
    },
  }
}
