import 'dotenv/config'
import { createApp } from './app.js'
import { prisma } from './lib/prisma.js'
import { createUserService } from './services/user.services.js'

const app = createApp(createUserService(prisma))
const port = process.env.PORT || 3000

// Keep development CRUD local until authentication/authorization is implemented.
app.listen(Number(port), process.env.HOST ?? '127.0.0.1', () => {
  console.log(`Server running on http://localhost:${port}`)
})
