# Sonoscope user API

Development CRUD for the existing PostgreSQL User model. Authentication and
authorization are not implemented: anyone who can reach this API can access or
modify users. The server binds to 127.0.0.1 by default. Add authentication and
ownership/admin checks before exposing it publicly; HOST can override the bind address.

## Setup

Run from the project's `server` folder with Node.js 24 and PostgreSQL available:

```sh
npm ci
```

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`; WSL:
`cp .env.example .env`) and set DATABASE_URL to your local development database.
Do not overwrite an existing .env. Then run:

```sh
npm run db:generate
npm run db:push
npm run typecheck
npm test
npm run dev
```

`db:push` applies the schema to the chosen database. Use a development database;
use reviewed Prisma migrations for production. No database is created automatically.

## Endpoints

Base URL: `http://localhost:3000`

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| POST | /api/users | Create a user | 201 + user |
| GET | /api/users?limit=20&offset=0 | List users (limit 1–100) | 200 + {users, limit, offset} |
| GET | /api/users/:id | Read one user | 200 + user |
| PATCH | /api/users/:id | Update supplied fields | 200 + user |
| DELETE | /api/users/:id | Delete user | 204, no body |

Create requires `email`; `name` and `genre` are optional. Update accepts any
nonempty subset of these three fields. Email is trimmed and lowercased. Name
must contain 1–100 characters or be null. Genre must be ROCK, HIP_HOP, RNB, LOFI,
POP, JAZZ, ELECTRONIC, OTHER, or null. Use null to clear name or genre.
IDs, timestamps, and nested audio records cannot be supplied in a user request.

Errors return `{ "error": "message" }`: 400 for invalid input, 404 for missing
users, 409 for duplicate emails, 413 for oversized bodies, or 500 for unexpected errors.

**Deleting a user also deletes their Sonofile and Stem records**, following the
existing cascade relationships. It does not delete externally stored audio files.

PowerShell example (keep the returned ID for read/update/delete):

```powershell
$user = Invoke-RestMethod http://localhost:3000/api/users -Method Post -ContentType 'application/json' -Body '{"email":"sami@example.com","name":"Sami","genre":"JAZZ"}'
Invoke-RestMethod "http://localhost:3000/api/users/$($user.id)"
Invoke-RestMethod "http://localhost:3000/api/users/$($user.id)" -Method Patch -ContentType 'application/json' -Body '{"genre":"ROCK"}'
Invoke-RestMethod http://localhost:3000/api/users
Invoke-RestMethod "http://localhost:3000/api/users/$($user.id)" -Method Delete
```

Implementation follows routes → controllers → services → Prisma. `npm test`
checks HTTP behavior using an isolated in-memory service without PostgreSQL.
To verify real persistence, run the examples against a development database;
restart the server after creating a user and confirm it can still be read.
