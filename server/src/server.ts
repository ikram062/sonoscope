import express from 'express'
import stemsRouter from './routes/stems.routes.js'
import { resetWorkDir } from './services/stems.services.js'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/stems', stemsRouter)

// Stems from a previous run are orphaned (jobs are in memory), so start clean.
await resetWorkDir()

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
