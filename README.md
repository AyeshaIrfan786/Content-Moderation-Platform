# Content-Moderation-Platform


A full-stack platform where users submit images for automated AI-powered policy screening, can appeal disputed verdicts, and admins get full oversight: a review queue, per-category policy controls, and platform-wide analytics.


Built to satisfy the Full-Stack Intern Assignment: multi-role auth, AI integration in a core workflow, interconnected data modeling (users → submissions → verdicts → appeals → policies), and a Dockerized one-command setup.

---

## Architecture Decisions

**Why MERN (MongoDB + Express + React + Node):** the data model is naturally document-shaped — a submission embeds a variable-length array of images, and each image embeds a variable-length array of per-category verdict objects. MongoDB's flexible schema avoids the join overhead a relational DB would need for this nesting, while Mongoose still gives schema validation and enum constraints where it matters (roles, outcomes, enforcement types).

**Why embed verdicts inside the submission instead of a separate `Verdict` collection:** a verdict has no independent lifecycle — it's never queried, updated, or deleted outside the context of its submission. Embedding avoids an extra round-trip on every submission read (history page, admin queue, analytics) and keeps the "one verdict per image, per category" relationship explicit in the schema.

**Why a policy snapshot is stored on every image, not just a reference:** the assignment requires that policy changes "do not retroactively alter existing verdicts." Storing only a reference (e.g. `policyId`) would mean an admin editing that policy later silently changes the meaning of old verdicts. Snapshotting the full policy config at screening time makes every past verdict immutable and auditable, independent of what the live policy config looks like today.

**Why the AI call sits in its own service module (`services/moderationService.js`):** the controller shouldn't know the details of the vision provider. `moderationService` exposes one function — `analyzeImage(base64, mimeType) → per-category results` — keeping screening logic isolated from the rest of the app.

**Why JWT in `localStorage` instead of sessions:** the frontend and backend are fully decoupled (separate Docker containers, separate dev servers), so a stateless token sent via an Axios interceptor is simpler than managing server-side session storage across a future multi-instance deployment.

**Why images are never written to disk:** Multer uses memory storage — the buffer is base64-encoded and sent straight to the vision API, then discarded. This avoids managing a file storage layer (and cleanup) for an assignment-scale app, at the cost of not being able to re-display the original image later (only the verdict is persisted).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express, JWT auth, Multer |
| Database | MongoDB (Mongoose) |
| Frontend | React 18, Vite, React Router, Recharts |
| AI | Gemini |
| DevOps | Docker Compose, Nginx |

## High-Level Architecture

```
Browser → Nginx (frontend) → /api proxy → Express backend → MongoDB
                                              ↓
                                    Gemini vision API
```

---

## Core Features (mapped to assignment spec)

- **User submissions** — upload up to 6 images per request; each image screened and verdicted independently.
- **Verdict system** — outcome (`Approved` / `Flagged for Review` / `Blocked`), per-category breakdown (result, confidence, reasoning), timestamp, and policy snapshot.
- **Appeal workflow** — users appeal any `Flagged`/`Blocked` image with a written justification; admins accept (auto-overrides to `Approved`) or reject with a response.
- **Policy configuration** — per category: enable/disable, confidence threshold (%), enforcement mode (`Auto-Block` / `Flag for Review`).
- **Admin analytics** — submission volume over time, verdict distribution by outcome/category, appeal resolution stats, users ranked by submission count and by violation count.
- **Roles** — `user` (submit, view own history, appeal) and `admin` (all of the above + appeals queue, manual override, policy config, analytics).

---

## Quick Start (Docker — recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set at minimum:
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — your Gemini API key

### 2. Build and run
```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| App (frontend) | http://localhost:8080 |
| API (direct) | http://localhost:5000/api |

The backend seeds the database automatically on first startup if it's empty.

### 3. Demo accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@test.com | admin123 |
| User | user@test.com | user123 |

### Re-seed manually
```bash
docker-compose run --rm backend npm run seed
```
>  Warning: the seeder wipes existing users and policy config.

---

## Local Development (without Docker)

### Backend
```bash
cd backend
cp ../.env.example .env   # or create backend/.env manually
npm install
npm run dev
```
Set `MONGO_URI=mongodb://localhost:27017/content-moderation` and run MongoDB locally, then:
```bash
npm run seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — Vite proxies `/api` to the backend on port 5000.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `PORT` | No | Backend port (default `5000`) |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `MODERATION_PROVIDER` | No | `gemini` |
| `GEMINI_API_KEY` | Yes | Google AI Studio key |
| `VITE_API_URL` | No | Frontend API base URL (default `/api`) |

---

## Usage Flow

1. **Register** or log in with a demo account.
2. **Submit** — upload up to 6 images and click *Upload & Screen*.
3. **History** — view past submissions, verdicts, and category breakdowns; filter by outcome/category/date.
4. **Appeal** — challenge a flagged or blocked result from the history page.
5. **Admin** — log in as `admin@test.com` to manage appeals, policies, submissions, and analytics.

---

## Project Structure

```
content-moderation-platform/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/            # User, Submission, Appeal, PolicyConfig
│   ├── routes/
│   ├── services/moderationService.js
│   ├── seeder.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Smoke Test Checklist

- [ ] Register a new user
- [ ] Upload an image and receive a verdict
- [ ] File an appeal on a flagged/blocked submission
- [ ] Log in as admin and accept/reject the appeal
- [ ] Confirm the verdict override appears in history
- [ ] `docker-compose up --build` works from a clean clone

## License

MIT
