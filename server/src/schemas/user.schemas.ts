import type { Genre } from '@prisma/client'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export type UserInput = { email: string; name?: string | null; genre?: Genre | null }
const genres = ['ROCK', 'HIP_HOP', 'RNB', 'LOFI', 'POP', 'JAZZ', 'ELECTRONIC', 'OTHER']

export function parseUser(body: unknown, partial: false): UserInput
export function parseUser(body: unknown, partial: true): Partial<UserInput>
export function parseUser(body: unknown, partial: boolean): Partial<UserInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Body must be a JSON object.')
  }
  const data = body as Record<string, unknown>
  const keys = Object.keys(data)
  if (!keys.length || keys.some(key => !['email', 'name', 'genre'].includes(key))) {
    throw new HttpError(400, 'Provide only email, name, and/or genre.')
  }
  const result: Partial<UserInput> = {}
  if (!partial || 'email' in data) {
    if (typeof data.email !== 'string' || data.email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      throw new HttpError(400, 'A valid email is required.')
    }
    result.email = data.email.trim().toLowerCase()
  }
  if ('name' in data) {
    if (data.name !== null && (typeof data.name !== 'string' ||
        !data.name.trim() || data.name.trim().length > 100)) {
      throw new HttpError(400, 'Name must be 1–100 characters or null.')
    }
    result.name = data.name === null ? null : (data.name as string).trim()
  }
  if ('genre' in data) {
    if (data.genre !== null && (typeof data.genre !== 'string' || !genres.includes(data.genre))) {
      throw new HttpError(400, `Genre must be one of: ${genres.join(', ')}, or null.`)
    }
    result.genre = data.genre as Genre | null
  }
  return result
}

export function parsePagination(query: Record<string, unknown>) {
  function integer(value: unknown, fallback: number, max: number) {
    if (value === undefined) return fallback
    if (typeof value !== 'string' || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
      throw new HttpError(400, 'Pagination must use nonnegative integers; limit must be 1–100.')
    }
    return Number(value)
  }
  const limit = integer(query.limit, 20, 100)
  const offset = integer(query.offset, 0, Number.MAX_SAFE_INTEGER)
  if (limit === 0) throw new HttpError(400, 'Limit must be 1–100.')
  return { limit, offset }
}
