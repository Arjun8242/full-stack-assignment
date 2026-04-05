# Assignment App — Extended Task Management API

Full-stack task management application with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Auth/User store: PostgreSQL
- Task store: MongoDB
- Message Queue: BullMQ (Redis)

## 1. Local Setup And Run

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or cloud connection string)
- PostgreSQL 13+
- Docker (recommended, for Redis) — or a standalone Redis 6+

## Clone And Install
From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Start Redis (for BullMQ)

Using Docker (recommended):

```bash
# From the project root
docker compose up -d
```

This starts a Redis container on `localhost:6379`.

Or, if you already have Redis installed locally, ensure it is running on port 6379.

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

# Redis for BullMQ
REDIS_URL=redis://127.0.0.1:6379

# Completion webhook — POST request on task completion
# Leave blank to disable; set to e.g. https://webhook.site/<your-uuid>
WEBHOOK_URL=

# Reminder webhook — POST request 1 hour before due date
# Leave blank for console-only logging
REMINDER_WEBHOOK_URL=
```

Notes:
- Use either `POSTGRES_URI` OR the individual `POSTGRES_*` variables.
- If `POSTGRES_SSL=true`, backend uses TLS with `rejectUnauthorized: false`.
- `WEBHOOK_URL` and `REMINDER_WEBHOOK_URL` are optional; when blank the respective feature only logs to console.

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
- `categoryId` (auto-filled by Create Category test)

---

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

---

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

---

## Task Endpoints
All task endpoints require auth.

Task schema:
- `id` (string) — Mongo ObjectId
- `ownerId` (number) — linkage to auth user
- `title` (string, required, max 200)
- `description` (string, optional, max 2000)
- `dueDate` (ISO date or null)
- `status` (`pending` | `completed`)
- `category` (string or null) — name of a category
- `tags` (array of strings) — free-form text tags
- `createdAt`, `updatedAt`

### POST /tasks
Create task for current user.

Request body:

```json
{
  "title": "Finish assignment",
  "description": "Create docs",
  "dueDate": "2026-12-31T00:00:00.000Z",
  "status": "pending",
  "category": "Work",
  "tags": ["High Priority", "Client A"]
}
```

Validation:
- `title`: required, max 200 chars
- `description`: optional, max 2000 chars
- `dueDate`: optional ISO 8601 date (nullable)
- `status`: optional, `pending` or `completed` (default: `pending`)
- `category`: optional string (max 100 chars, nullable)
- `tags`: optional array of strings (each max 100 chars)

**Side-effects:**
- If `dueDate` is provided, a BullMQ reminder job is scheduled (fires 1 hour before due).
- If `status` is `completed`, the completion webhook fires immediately (if `WEBHOOK_URL` is configured).

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
    "category": "Work",
    "tags": ["High Priority", "Client A"],
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

Possible errors:
- `400` validation failed
- `401` auth missing/invalid

### GET /tasks
List all tasks for current user, with optional filtering.

Query parameters (all optional):
- `category` — filter by exact category name (e.g. `?category=Work`)
- `tags` — filter by tags. Comma-separated string or repeated params.
  - `?tags=High Priority,Client A` — tasks that contain **all** specified tags
  - `?tags[]=High Priority&tags[]=Client A` — same

Success `200`:

```json
{
  "success": true,
  "count": 2,
  "tasks": [ ... ]
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
  "task": { ... }
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
  "status": "completed",
  "category": "Personal",
  "tags": ["Done"]
}
```

Validation:
- Must include at least one updatable field
- Allowed fields: `title`, `description`, `dueDate`, `status`, `category`, `tags`

**Side-effects:**
- If `status` changed to `completed`:
  - Cancels any pending BullMQ reminder for this task
  - Fires the completion webhook (POST to `WEBHOOK_URL` with task details and retry logic)
- If `dueDate` changed:
  - Cancels old reminder and schedules a new one (or cancels if `dueDate` set to null)
- If task was already `completed`, no webhook is re-fired on further updates

Success `200`:

```json
{
  "success": true,
  "task": { ... }
}
```

Possible errors:
- `400` invalid body/id
- `404` task not found (including other-user task)

### DELETE /tasks/:id
Delete task owned by current user.

**Side-effects:**
- Cancels any pending BullMQ reminder for the deleted task

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

---

## Category Endpoints
All category endpoints require auth.

Category schema:
- `id` (string) — Mongo ObjectId
- `name` (string, required, max 100)
- `ownerId` (number or null) — null for system defaults
- `isDefault` (boolean) — true for system defaults
- `createdAt`, `updatedAt`

System default categories (seeded on startup):
- **Work**
- **Personal**
- **Urgent**

### POST /categories
Create a custom category for the current user.

Request body:

```json
{
  "name": "Side Projects"
}
```

Validation:
- `name`: required, 1-100 chars, must not conflict with system default names

Success `201`:

```json
{
  "success": true,
  "category": {
    "id": "67f01a7ec8d4f22c9768f700",
    "name": "Side Projects",
    "ownerId": 1,
    "isDefault": false,
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

Possible errors:
- `400` name conflicts with system default
- `400` validation failed

### GET /categories
List all categories available to the current user (system defaults + user-created).

Success `200`:

```json
{
  "success": true,
  "categories": [
    { "id": "...", "name": "Work", "ownerId": null, "isDefault": true, ... },
    { "id": "...", "name": "Personal", "ownerId": null, "isDefault": true, ... },
    { "id": "...", "name": "Urgent", "ownerId": null, "isDefault": true, ... },
    { "id": "...", "name": "Side Projects", "ownerId": 1, "isDefault": false, ... }
  ]
}
```

### PATCH /categories/:id
Rename a user-created category. System defaults cannot be modified.

Path params:
- `id`: 24-char Mongo ObjectId

Request body:

```json
{
  "name": "Side Hustles"
}
```

**Side-effects:**
- Updates the `category` field on all of the user's tasks that referenced the old name.

Success `200`:

```json
{
  "success": true,
  "category": { "id": "...", "name": "Side Hustles", ... }
}
```

Possible errors:
- `403` cannot modify system default categories
- `404` category not found

### DELETE /categories/:id
Delete a user-created category. System defaults cannot be deleted.

Path params:
- `id`: 24-char Mongo ObjectId

**Side-effects:**
- Sets `category` to `null` on all of the user's tasks that referenced this category.

Success `200`:

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

Possible errors:
- `403` cannot delete system default categories
- `404` category not found

---

## 3. Real-Time Reminders (BullMQ)

### How It Works
1. When a task is created/updated with a `dueDate`, a **delayed BullMQ job** is enqueued.
2. The job fires **1 hour before** `dueDate`. If the due date is already within 1 hour (or in the past), the job fires immediately.
3. On trigger, the reminder is:
   - **Logged to console**: `[REMINDER] ⏰ Task "title" (ID: ...) is due in ~1 hour!`
   - **POSTed to `REMINDER_WEBHOOK_URL`** (if configured) with payload: `{ taskId, title, dueDate, ownerId, triggeredAt }`
4. If a task is **updated with a new `dueDate`**, the old reminder is cancelled and a new one is scheduled.
5. If a task is **marked completed** or **deleted**, its reminder is cancelled.
6. On **server restart**, all pending tasks with future due dates are re-checked, and any missing reminder jobs are re-scheduled.

### Architecture
- **Queue**: `task-reminders` (BullMQ / Redis)
- **Job ID**: `reminder:<taskId>` (deterministic, allows easy cancel/replace)
- **Worker concurrency**: 5

---

## 4. Completion Webhook (External Service Integration)

### How It Works
1. When a task's status changes to `completed`, a POST request is sent to `WEBHOOK_URL` (if configured).
2. **Payload**:
   ```json
   {
     "taskId": "67f01a7ec8d4f22c9768f6f6",
     "title": "Finish assignment",
     "completedAt": "2026-04-02T12:00:00.000Z",
     "userId": 1
   }
   ```
3. **Retry logic**: 3 attempts with exponential backoff (1s → 2s → 4s).
4. Success/failure is logged to console.

### Testing
Set `WEBHOOK_URL` in `.env` to a [webhook.site](https://webhook.site) URL to observe incoming payloads.

---

## 5. Quick Curl Examples

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

Create category:

```bash
curl -X POST http://localhost:5000/api/v1/categories \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Side Projects"}'
```

List categories:

```bash
curl http://localhost:5000/api/v1/categories \
  -H "Authorization: Bearer <jwt>"
```

Create task with category & tags:

```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My task","description":"Demo","category":"Work","tags":["High Priority","Client A"],"dueDate":"2026-12-31T00:00:00.000Z"}'
```

Filter tasks by category:

```bash
curl "http://localhost:5000/api/v1/tasks?category=Work" \
  -H "Authorization: Bearer <jwt>"
```

Filter tasks by tags:

```bash
curl "http://localhost:5000/api/v1/tasks?tags=High Priority,Client A" \
  -H "Authorization: Bearer <jwt>"
```

Filter tasks by category + tags:

```bash
curl "http://localhost:5000/api/v1/tasks?category=Work&tags=High Priority" \
  -H "Authorization: Bearer <jwt>"
```

Complete a task (triggers webhook):

```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/<taskId> \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

---

## 6. Project Structure

```text
assignment/
  docker-compose.yml        # Redis for BullMQ
  backend/
    .env
    server.js
    package.json
    assignment-api.postman_collection.json
    controllers/
      authController.js
      taskController.js
      categoryController.js
    routes/
      auth.js
      tasks.js
      categories.js
    models/
      Task.js               # category, tags fields
      Category.js
    services/
      reminderQueue.js       # BullMQ queue + worker
      webhookService.js      # completion webhook + retry
    validators/
      authValidators.js
      taskValidators.js
      categoryValidators.js
    repositories/
      userRepository.js
    middleware/
      auth.js
      validate.js
    db/
      postgres.js
    utils/
      appError.js
      asyncHandler.js
      errorHandler.js
  frontend/
    src/
    vite.config.js
```

## 7. Notes
- Users are stored in PostgreSQL.
- Tasks are stored in MongoDB and linked to users via numeric `ownerId`.
- Categories are stored in MongoDB. Defaults (Work, Personal, Urgent) are seeded on startup.
- Access control is owner-based: another user receives `404 Task not found` on task read/update/delete.
- BullMQ requires Redis. Use `docker compose up -d` to start Redis before the backend.
- Reminders are re-hydrated on server restart — no lost reminders after reboot.
- Completion webhooks are fire-and-forget with retry logic and do not block the API response.
