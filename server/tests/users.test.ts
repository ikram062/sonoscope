import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { AddressInfo } from 'node:net'
import type { User } from '@prisma/client'
import { createApp } from '../src/app.js'
import type { UserService } from '../src/services/user.services.js'

// Exercise the real HTTP routes with an isolated in-memory service.
// Database persistence and cascade behavior need a PostgreSQL integration check.
test('user CRUD HTTP contract', async (t) => {
  const records = new Map<string, User>()
  let nextId = 0
  const missing = () => Object.assign(new Error('Missing'), { code: 'P2025' })
  const duplicate = () => Object.assign(new Error('Duplicate'), { code: 'P2002' })
  const users: UserService = {
    async create(data) {
      if ([...records.values()].some(user => user.email === data.email)) throw duplicate()
      const user = { id: `user-${++nextId}`, email: data.email, name: data.name ?? null,
        genre: data.genre ?? null, createdAt: new Date() }
      records.set(user.id, user)
      return user
    },
    async list(limit, offset) { return [...records.values()].slice(offset, offset + limit) },
    async get(id) { return records.get(id) ?? null },
    async update(id, data) {
      const user = records.get(id)
      if (!user) throw missing()
      if ([...records.values()].some(other => other.id !== id && other.email === data.email)) throw duplicate()
      const updated = { ...user, ...data }
      records.set(id, updated)
      return updated
    },
    async delete(id) {
      const user = records.get(id)
      if (!user) throw missing()
      records.delete(id)
      return user
    },
  }
  const server = createApp(users).listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeAllConnections()
  }))
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const request = (path: string, method = 'GET', body?: unknown) => fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  assert.equal((await request('/health')).status, 200)
  for (const body of [{}, [], null, { email: 'bad' }, { email: 'a@b.com', role: 'admin' },
    { email: 'a@b.com', genre: 'INVALID' }, { email: 'a@b.com', name: '' }]) {
    assert.equal((await request('/api/users', 'POST', body)).status, 400)
  }
  const created = await request('/api/users', 'POST', { email: ' SAMI@example.com ', name: ' Sami ', genre: 'JAZZ' })
  assert.equal(created.status, 201)
  const user = await created.json()
  assert.equal(user.email, 'sami@example.com')
  assert.equal(user.name, 'Sami')
  assert.equal(created.headers.get('location'), `/api/users/${user.id}`)
  const path = `/api/users/${user.id}`
  assert.equal((await request(path)).status, 200)
  assert.equal((await (await request('/api/users?limit=1&offset=0')).json()).users.length, 1)
  for (const query of ['limit=0', 'limit=101', 'offset=-1', 'limit=1.5', 'limit=1&limit=2']) {
    assert.equal((await request(`/api/users?${query}`)).status, 400)
  }
  assert.equal((await request('/api/users', 'POST', { email: 'SAMI@example.com' })).status, 409)
  await request('/api/users', 'POST', { email: 'other@example.com' })
  assert.equal((await request(path, 'PATCH', { email: 'other@example.com' })).status, 409)
  assert.equal((await request(path, 'PATCH', {})).status, 400)
  const updated = await request(path, 'PATCH', { name: null, genre: 'ROCK' })
  assert.equal(updated.status, 200)
  assert.deepEqual(await updated.json(), { ...user, name: null, genre: 'ROCK' })
  assert.equal((await request(path, 'DELETE')).status, 204)
  assert.equal((await request(path)).status, 404)
  assert.equal((await request(path, 'PATCH', { name: 'Missing' })).status, 404)
  assert.equal((await request(path, 'DELETE')).status, 404)
  const malformed = await fetch(`${base}/api/users`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: '{' })
  assert.equal(malformed.status, 400)
  assert.equal((await request('/api/users', 'POST', { email: 'x'.repeat(17000) })).status, 413)
  assert.equal((await request('/unknown')).status, 404)
})
