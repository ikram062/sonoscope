import { Router } from 'express'
import { createUserControllers } from '../controllers/user.controllers.js'
import type { UserService } from '../services/user.services.js'

export function createUserRouter(users: UserService) {
  const router = Router()
  const controllers = createUserControllers(users)
  router.post('/', controllers.create)
  router.get('/', controllers.list)
  router.get('/:id', controllers.get)
  router.patch('/:id', controllers.update)
  router.delete('/:id', controllers.delete)
  return router
}
