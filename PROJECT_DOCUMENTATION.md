# Assignment Project Documentary

This document explains the whole project, every code file in the repository, and the exact order to run APIs for end-to-end testing.

## 1) Project At A Glance

- Frontend: React + Vite
- Backend: Node.js + Express
- Authentication users: PostgreSQL
- Tasks, categories, tags: MongoDB
- Reminder jobs: BullMQ + Redis (with in-memory fallback)

## 2) Runtime Flow (High Level)

1. Backend starts from `backend/server.js`.
2. Backend validates required env vars (`MONGODB_URI`, `JWT_SECRET`), connects MongoDB and PostgreSQL.
3. Backend creates PostgreSQL `users` table if missing.
4. Backend seeds default categories in MongoDB (`Work`, `Personal`, `Urgent`).
5. Reminder worker starts (Redis/BullMQ if available, otherwise in-memory timers).
6. Existing pending tasks are scanned and reminders are re-scheduled.
7. Frontend starts from `frontend/src/main.jsx` and routes users to login/signup/dashboard.
8. API calls from frontend use `frontend/src/api/axios.js` with `/api/v1` base path.

## 3) How To Run The Project

### Prerequisites

- Node.js 18+
- MongoDB running
- PostgreSQL running
- Redis running (recommended through Docker)

### 3.1 Start Redis

From root:

```bash
docker compose up -d
```

### 3.2 Backend Setup And Run

From `backend`:

```bash
npm install
npm run dev
```

Create `backend/.env` with:

```env
PORT=5000
JWT_SECRET=replace-with-strong-secret
MONGODB_URI=mongodb://127.0.0.1:27017/assignment_app

# Option A
POSTGRES_URI=postgresql://postgres:password@localhost:5432/assignment_app

# Option B (instead of URI)
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres
# POSTGRES_DB=assignment_app
# POSTGRES_SSL=false

REDIS_URL=redis://127.0.0.1:6379
WEBHOOK_URL=
REMINDER_WEBHOOK_URL=
```

Backend base URL: `http://localhost:5000/api/v1`

### 3.3 Frontend Setup And Run

From `frontend`:

```bash
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

Vite proxies `/api/*` to backend `http://localhost:5000` in development.

## 4) Backend File-By-File Documentary

### 4.1 Entry + Routing

- `backend/server.js`
  - Main backend entry.
  - Registers JSON parser + cookie parser.
  - Mounts routes:
    - `/api/v1/auth`
    - `/api/v1/tasks`
    - `/api/v1/categories`
    - `/api/v1/tags`
  - Connects MongoDB + PostgreSQL.
  - Initializes SQL table and default categories.
  - Starts reminder system and schedules pending reminders.
  - Handles graceful shutdown.

- `backend/routes/auth.js`
  - Auth endpoints and validation middleware.

- `backend/routes/tasks.js`
  - All task endpoints.
  - Applies auth middleware to all task routes.

- `backend/routes/categories.js`
  - All category endpoints.
  - Applies auth middleware.

- `backend/routes/tags.js`
  - All tag endpoints.
  - Applies auth middleware.

### 4.2 Controllers

- `backend/controllers/authController.js`
  - `register`: creates user, hashes password, returns JWT + user, sets token cookie.
  - `login`: validates password, returns JWT + user, sets token cookie.
  - `logout`: clears auth cookie.
  - `profile`: returns authenticated user profile.

- `backend/controllers/taskController.js`
  - `createTask`: creates task for authenticated user.
  - `getTasks`: lists tasks with optional `category` and `tags` filters.
  - `getTaskById`: returns one task owned by user.
  - `updateTask`: updates allowed fields only.
  - `deleteTask`: deletes owned task.
  - Side effects:
    - schedules/cancels/reschedules reminders,
    - fires completion webhook,
    - synchronizes tags into tag catalog.

- `backend/controllers/categoryController.js`
  - `seedDefaultCategories`: startup seed for system categories.
  - `createCategory`: creates user category, blocks collision with system defaults.
  - `getCategories`: returns system + user categories.
  - `updateCategory`: renames user category and updates tasks using old name.
  - `deleteCategory`: deletes user category and nulls category in related tasks.

- `backend/controllers/tagController.js`
  - `ensureTagsExist`: upserts task tags into tag catalog.
  - `createTag`, `getTags`, `updateTag`, `deleteTag`.
  - Tag rename/delete cascades to task documents.

### 4.3 Database + Repository

- `backend/db/postgres.js`
  - PostgreSQL pool setup and connection helpers.
  - Supports either `POSTGRES_URI` or split env vars.

- `backend/repositories/userRepository.js`
  - SQL for users table creation and user CRUD lookups.
  - Maps SQL row shape to API user shape.

### 4.4 Models (MongoDB)

- `backend/models/Task.js`
  - Task schema with ownerId, title, description, dueDate, status, category, tags.
  - Serializes `_id` as `id`.

- `backend/models/Category.js`
  - Category schema with `name`, `ownerId`, `isDefault`.
  - Exports `DEFAULT_CATEGORIES` = `Work`, `Personal`, `Urgent`.
  - Unique compound index on `(name, ownerId)`.

- `backend/models/Tag.js`
  - Tag schema with `name`, `ownerId`.
  - Unique compound index on `(name, ownerId)`.

### 4.5 Middleware

- `backend/middleware/auth.js`
  - Extracts JWT from `Authorization: Bearer ...` or cookie.
  - Verifies token and attaches `req.user`.

- `backend/middleware/validate.js`
  - Generic Joi validator middleware.
  - Sanitizes request payload and formats validation errors.

### 4.6 Validators

- `backend/validators/authValidators.js`
  - register/login validation rules.

- `backend/validators/taskValidators.js`
  - create/update/filter/id validation rules for tasks.

- `backend/validators/categoryValidators.js`
  - create/update/id validation rules for categories.

- `backend/validators/tagValidators.js`
  - create/update/id validation rules for tags.

### 4.7 Services

- `backend/services/reminderQueue.js`
  - Schedules reminders 1 hour before due date.
  - Uses BullMQ+Redis when available, else in-memory timeouts.
  - Handles startup re-hydration of reminders.

- `backend/services/webhookService.js`
  - Sends completion webhook with retry + exponential backoff.

### 4.8 Utilities

- `backend/utils/appError.js`
  - Custom `AppError` class with HTTP status + details.

- `backend/utils/asyncHandler.js`
  - Wrapper to pass async controller errors to Express error middleware.

- `backend/utils/errorHandler.js`
  - Centralized 404/error responses for AppError, JWT errors, Mongoose, PostgreSQL conflicts.

### 4.9 Backend Config And Collections

- `backend/package.json`
  - Backend scripts and dependencies.

- `backend/assignment-api-clean.postman_collection.json`
  - Full API request collection with variables and token/id capture tests.

- `backend/assignment-api-import-safe-v20.postman_collection.json`
  - Import-safe subset (v2.0 schema).

- `backend/assignment-api-import-safe-v21.postman_collection.json`
  - Import-safe collection (v2.1 schema).

- `backend/package-lock.json`
  - Auto-generated dependency lock file.

## 5) Frontend File-By-File Documentary

### 5.1 App Boot + Routing

- `frontend/index.html`
  - Root HTML shell with `#root` mount.

- `frontend/src/main.jsx`
  - React entry point.

- `frontend/src/App.jsx`
  - Router map:
    - `/signup`
    - `/login`
    - `/dashboard`
    - `/` redirects to `/login`
  - Adds top-right toast notifications.

### 5.2 API Layer

- `frontend/src/api/axios.js`
  - Axios instance with `withCredentials: true`.
  - Normalizes base URL and appends `/api/v1`.

### 5.3 Shared UI Components

- `frontend/src/components/Button.jsx`
  - Shared button with variant support.

- `frontend/src/components/Card.jsx`
  - Shared card container, optional large layout.

- `frontend/src/components/Input.jsx`
  - Shared labeled input.

- `frontend/src/components/ProtectedRoute.jsx`
  - Placeholder wrapper; currently returns children directly.

- `frontend/src/components/PublicRoute.jsx`
  - Placeholder wrapper; currently returns children directly.

### 5.4 Pages

- `frontend/src/pages/Login.jsx`
  - Login form, client-side validation, login API call.

- `frontend/src/pages/Signup.jsx`
  - Signup form, client-side validation, register API call.

- `frontend/src/pages/Dashboard.jsx`
  - Main app screen for:
    - profile load,
    - task CRUD,
    - category CRUD,
    - task filtering by category/tags,
    - status toggle,
    - logout.

### 5.5 Frontend Styling + Config

- `frontend/src/index.css`
  - Global styles and component/page styles.

- `frontend/vite.config.js`
  - Dev server config and backend proxy.

- `frontend/vercel.json`
  - SPA rewrite to `index.html` for client-side routes.

- `frontend/package.json`
  - Frontend scripts and dependencies.

- `frontend/package-lock.json`
  - Auto-generated dependency lock file.

## 6) API Endpoints (Complete)

Base URL: `http://localhost:5000/api/v1`

### Auth

1. `POST /auth/register`
2. `POST /auth/login`
3. `GET /auth/profile`
4. `POST /auth/logout`

### Categories (auth required)

1. `POST /categories`
2. `GET /categories`
3. `PATCH /categories/:id`
4. `DELETE /categories/:id`

### Tags (auth required)

1. `POST /tags`
2. `GET /tags`
3. `PATCH /tags/:id`
4. `DELETE /tags/:id`

### Tasks (auth required)

1. `POST /tasks`
2. `GET /tasks`
3. `GET /tasks/:id`
4. `PATCH /tasks/:id`
5. `DELETE /tasks/:id`

## 7) Exact API Execution Order (Recommended)

Use this sequence for clean end-to-end testing.

### Step 1: Register

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\",\"name\":\"Sample User\"}"
```

### Step 2: Login (capture token)

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"password123\"}"
```

Copy `token` from response and export it:

```bash
TOKEN=<paste-jwt-token>
```

### Step 3: Profile check

```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Categories flow

Create:

```bash
curl -X POST http://localhost:5000/api/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Side Projects\"}"
```

List:

```bash
curl -X GET http://localhost:5000/api/v1/categories \
  -H "Authorization: Bearer $TOKEN"
```

Update:

```bash
curl -X PATCH http://localhost:5000/api/v1/categories/<categoryId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Hobbies\"}"
```

Delete (optional test at end):

```bash
curl -X DELETE http://localhost:5000/api/v1/categories/<categoryId> \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Tags flow

Create:

```bash
curl -X POST http://localhost:5000/api/v1/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Client A\"}"
```

List:

```bash
curl -X GET http://localhost:5000/api/v1/tags \
  -H "Authorization: Bearer $TOKEN"
```

Update:

```bash
curl -X PATCH http://localhost:5000/api/v1/tags/<tagId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Client B\"}"
```

Delete (optional test at end):

```bash
curl -X DELETE http://localhost:5000/api/v1/tags/<tagId> \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Tasks flow

Create:

```bash
curl -X POST http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Finish assignment\",\"description\":\"Create docs\",\"dueDate\":\"2026-12-31T00:00:00.000Z\",\"status\":\"pending\",\"category\":\"Work\",\"tags\":[\"High Priority\",\"Client A\"]}"
```

List all:

```bash
curl -X GET http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"
```

List by category:

```bash
curl -X GET "http://localhost:5000/api/v1/tasks?category=Work" \
  -H "Authorization: Bearer $TOKEN"
```

List by tags:

```bash
curl -X GET "http://localhost:5000/api/v1/tasks?tags=High%20Priority,Client%20A" \
  -H "Authorization: Bearer $TOKEN"
```

Get by id:

```bash
curl -X GET http://localhost:5000/api/v1/tasks/<taskId> \
  -H "Authorization: Bearer $TOKEN"
```

Update:

```bash
curl -X PATCH http://localhost:5000/api/v1/tasks/<taskId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"completed\"}"
```

Delete:

```bash
curl -X DELETE http://localhost:5000/api/v1/tasks/<taskId> \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: Logout

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## 8) Order Summary (Short)

1. Register
2. Login
3. Profile
4. Categories (create -> list -> update)
5. Tags (create -> list -> update)
6. Tasks (create -> list/filter -> get -> update -> delete)
7. Optional cleanup: delete created category/tag
8. Logout

## 9) Best Way To Execute In Practice

- Postman: import `backend/assignment-api-clean.postman_collection.json` and run folders in this order: `Auth -> Categories -> Tags -> Tasks`.
- Collection variables auto-populate for token and ids in the clean collection test scripts.

