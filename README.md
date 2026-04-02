# Assignment App

Full-stack task management application with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Auth/User store: PostgreSQL
- Task store: MongoDB

## 1. Local Setup And Run

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or cloud connection string)
- PostgreSQL 13+

## Clone And Install
From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database Setup

### MongoDB (for tasks)
You only need a valid connection string in `MONGODB_URI`.

Examples:
- Local: `mongodb://127.0.0.1:27017/assignment_app`
- Atlas: `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`

### PostgreSQL (for users/auth)
Create a database first (example name: `assignment_app`):

```sql
CREATE DATABASE assignment_app;
```

The backend auto-creates the `users` table on startup (`initializeUsersTable`).

## Backend Environment Variables
Create `backend/.env`:

```env
PORT=5000
JWT_SECRET=replace-with-strong-secret
MONGODB_URI=mongodb://127.0.0.1:27017/assignment_app

# Option A: single connection string
# POSTGRES_URI=postgresql://postgres:password@localhost:5432/assignment_app

# Option B: individual vars
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=assignment_app
POSTGRES_SSL=false
```

Notes:
- Use either `POSTGRES_URI` OR the individual `POSTGRES_*` variables.
- If `POSTGRES_SSL=true`, backend uses TLS with `rejectUnauthorized: false`.

## Run Backend

```bash
cd backend
npm run dev
```

Backend base URL:
- `http://localhost:5000/api/v1`

## Run Frontend
In a second terminal:

```bash
cd frontend
npm run dev
```

Frontend URL:
- `http://localhost:5173`

Vite proxies `/api/*` to backend on port 5000 in local dev.

## Postman Collection
Import:
- `backend/assignment-api.postman_collection.json`

Collection variables:
- `baseUrl` = `http://localhost:5000/api/v1`
- `token` (auto-filled by Login test)
- `taskId` (auto-filled by Create Task test)

## 2. API Documentation

Base URL:
- `http://localhost:5000/api/v1`

Authentication:
- JWT supported via `Authorization: Bearer <token>` header
- Also set as `token` httpOnly cookie on register/login

Common response shape:

```json
{
  "success": true
}
```

Error response shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "message": "\"email\" must be a valid email",
      "path": "email",
      "type": "string.email"
    }
  ]
}
```

## Auth Endpoints

### POST /auth/register
Register a new user and issue token.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Sample User"
}
```

Validation:
- `email`: required, valid email
- `password`: required, min 6 chars
- `name`: optional, 1-120 chars (nullable)

Success `201`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Sample User"
  }
}
```

Possible errors:
- `400` email already exists
- `400` validation failed

### POST /auth/login
Login existing user and issue token.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Success `200`:

```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Sample User"
  }
}
```

Possible errors:
- `401` invalid credentials
- `400` validation failed

### POST /auth/logout
Clear auth cookie.

Auth:
- Token header/cookie recommended

Success `200`:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/profile
Get current authenticated user profile.

Auth:
- Required

Success `200`:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Sample User"
  }
}
```

Possible errors:
- `401` not authenticated / invalid token
- `404` user not found

## Task Endpoints
All task endpoints require auth.

Task schema:
- `id` (string)
- `ownerId` (number, internal linkage to auth user)
- `title` (string, required, max 200)
- `description` (string, optional, max 2000)
- `dueDate` (ISO date or null)
- `status` (`pending` | `completed`)
- `createdAt`, `updatedAt`

### POST /tasks
Create task for current user.

Request body:

```json
{
  "title": "Finish assignment",
  "description": "Create docs",
  "dueDate": "2026-12-31T00:00:00.000Z",
  "status": "pending"
}
```

Success `201`:

```json
{
  "success": true,
  "task": {
    "id": "67f01a7ec8d4f22c9768f6f6",
    "ownerId": 1,
    "title": "Finish assignment",
    "description": "Create docs",
    "dueDate": "2026-12-31T00:00:00.000Z",
    "status": "pending",
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

Possible errors:
- `400` validation failed
- `401` auth missing/invalid

### GET /tasks
List all tasks for current user.

Success `200`:

```json
{
  "success": true,
  "tasks": [
    {
      "id": "67f01a7ec8d4f22c9768f6f6",
      "ownerId": 1,
      "title": "Finish assignment",
      "description": "Create docs",
      "dueDate": null,
      "status": "pending",
      "createdAt": "2026-04-02T10:00:00.000Z",
      "updatedAt": "2026-04-02T10:00:00.000Z"
    }
  ]
}
```

### GET /tasks/:id
Get one task by ID for current user.

Path params:
- `id`: 24-char Mongo ObjectId

Success `200`:

```json
{
  "success": true,
  "task": {
    "id": "67f01a7ec8d4f22c9768f6f6",
    "ownerId": 1,
    "title": "Finish assignment",
    "description": "Create docs",
    "dueDate": null,
    "status": "pending",
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

Possible errors:
- `400` invalid task id format
- `404` task not found (including accessing another user's task)

### PATCH /tasks/:id
Update one or more task fields.

Path params:
- `id`: 24-char Mongo ObjectId

Request body (any subset, at least one field):

```json
{
  "title": "Finish assignment (updated)",
  "description": "Updated description",
  "dueDate": null,
  "status": "completed"
}
```

Validation:
- Must include at least one updatable field
- Allowed fields: `title`, `description`, `dueDate`, `status`

Success `200`:

```json
{
  "success": true,
  "task": {
    "id": "67f01a7ec8d4f22c9768f6f6",
    "ownerId": 1,
    "title": "Finish assignment (updated)",
    "description": "Updated description",
    "dueDate": null,
    "status": "completed",
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T11:00:00.000Z"
  }
}
```

Possible errors:
- `400` invalid body/id
- `404` task not found (including other-user task)

### DELETE /tasks/:id
Delete task owned by current user.

Success `200`:

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

Possible errors:
- `400` invalid task id
- `404` task not found (including other-user task)

## 3. Quick Curl Examples

Register:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Sample User"}'
```

Login:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Create task (Bearer token):

```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My task","description":"Demo"}'
```

Patch task:

```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/<taskId> \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title","description":"Updated description"}'
```

## 4. Project Structure

```text
assignment/
  backend/
    assignment-api.postman_collection.json
    server.js
    controllers/
    routes/
    models/
    validators/
    repositories/
    db/
  frontend/
    src/
    vite.config.js
```

## 5. Notes
- Users are stored in PostgreSQL.
- Tasks are stored in MongoDB and linked to users via numeric `ownerId`.
- Access control is owner-based: another user receives `404 Task not found` on task read/update/delete.
