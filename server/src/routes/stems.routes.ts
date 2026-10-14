import express, { Router } from 'express'
import {
  StemsBusyError,
  deleteJob,
  describeJob,
  getJob,
  isPythonReady,
  startJob,
  stemPath,
} from '../services/stems.services.js'

// POST   /api/stems?clip=30&device=auto   body: raw audio bytes, header X-Filename
// GET    /api/stems/:id                   job status (poll until status !== "running")
// GET    /api/stems/:id/:stem.wav         one stem (vocals, drums, bass, guitar, piano, other)
// DELETE /api/stems/:id                   cancel/remove the job and its files

const router = Router()
const DEVICES = new Set(['auto', 'cpu', 'cuda', 'mps'])

router.post('/', express.raw({ type: () => true, limit: '100mb' }), async (req, res) => {
  if (!isPythonReady()) {
    res.status(503).json({
      error: { type: 'NotInstalled', message: 'Stem separator not installed. See stems/README.md (create stems/.venv).' },
    })
    return
  }
  const fileName = decodeURIComponent(req.header('x-filename') ?? '')
  if (!fileName || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    res.status(400).json({ error: { type: 'BadRequest', message: 'Send the audio file as the body with an X-Filename header.' } })
    return
  }
  const clip = req.query.clip ? Number(req.query.clip) : null
  if (clip !== null && !(clip > 0)) {
    res.status(400).json({ error: { type: 'BadRequest', message: 'clip must be a positive number of seconds' } })
    return
  }
  const device = String(req.query.device ?? 'auto')
  if (!DEVICES.has(device)) {
    res.status(400).json({ error: { type: 'BadRequest', message: `device must be one of ${[...DEVICES].join(', ')}` } })
    return
  }

  try {
    const job = await startJob({ data: req.body, fileName, clipSeconds: clip, device })
    res.status(202).json(describeJob(job))
  } catch (err) {
    if (err instanceof StemsBusyError) {
      res.status(409).json({ error: { type: 'Busy', message: err.message } })
      return
    }
    throw err
  }
})

router.get('/:id', (req, res) => {
  const job = getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: { type: 'NotFound', message: 'Job not found (it may have expired).' } })
    return
  }
  res.json(describeJob(job))
})

router.get('/:id/:stem.wav', (req, res) => {
  const file = stemPath(req.params.id, req.params.stem)
  if (!file) {
    res.status(404).json({ error: { type: 'NotFound', message: 'Stem not found.' } })
    return
  }
  res.sendFile(file)
})

router.delete('/:id', async (req, res) => {
  res.status((await deleteJob(req.params.id)) ? 204 : 404).end()
})

export default router
