import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { createUserRouter } from './routes/user.routes.js'
import { HttpError } from './schemas/user.schemas.js'
import type { UserService } from './services/user.services.js'

export function createApp(users: UserService) {
  const app = express()
  app.use(express.json({ limit: '16kb' }))
  app.get('/health', (_req, res) => { res.json({ ok: true }) })
  app.use('/api/users', createUserRouter(users))
  app.use((_req, res) => { res.status(404).json({ error: 'Route not found.' }) })
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message })
    } else if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Email is already in use.' })
    } else if (error?.code === 'P2025') {
      res.status(404).json({ error: 'User not found.' })
    } else if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON body.' })
    } else if (error?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request body is too large.' })
    } else {
      console.error(error)
      res.status(500).json({ error: 'Internal server error.' })
    }
  }
  app.use(errorHandler)
  return app
}
