# JS Ashanti - E-commerce Platform

Full-stack e-commerce platform with:
- `backend/` (Express + Prisma + Better Auth + workers)
- `web/` (Next.js)
- `mobile/` (Expo React Native)

## One-command local startup (recommended)

From repo root:

```bash
npm run start:all
```

This command now:
- ensures `backend/.env` and `web/.env` exist
- applies local Docker DB defaults for backend (`localhost:55432`)
- starts Docker Postgres (`docker compose up -d db`)
- starts backend and web dev servers
- waits for health checks before reporting success

Optional variants:

```bash
# Backend + web + iOS simulator build/run
npm run start:all:ios

# Backend + web + Expo web
npm run start:all:expo-web
```

Stop all dev services:

```bash
npm run stop:all
```

## Why this fixes recurring setup issues

The recurring local issues were usually from:
- missing `.env` files in fresh worktrees
- backend pointing at wrong DB port (`5432` vs Docker `55432`)
- services started in inconsistent order

Using `start:all` keeps startup deterministic each time.

## Required local prerequisites

- Docker Desktop (or compatible Docker engine)
- Node + npm
- macOS + Xcode tools for iOS simulator (`start:all:ios`)

## Local URLs

- Web app: [http://localhost:3000](http://localhost:3000)
- Backend health: [http://localhost:4001/api/health](http://localhost:4001/api/health)
- Expo web (if started): [http://localhost:8081](http://localhost:8081)

## Environment files

Do not commit real secrets.

- `backend/.env.example` now uses Docker DB default:
  - `DATABASE_URL="postgresql://user:password@localhost:55432/js_ashanti_db"`
- `web/.env.example` points web to local backend:
  - `NEXT_PUBLIC_BACKEND_URL=http://localhost:4001`

## Admin login notes

- Admin route: [http://localhost:3000/admin](http://localhost:3000/admin)
- Login route: [http://localhost:3000/login](http://localhost:3000/login)
- Backend validates auth session from cookie.

## Starting Servers Individually

If you prefer to start each component in its own terminal window (e.g. to monitor logs without them combining together), follow these steps in separate terminal windows:

### 1. Database (PostgreSQL)
Ensure Docker is running on your machine, then start your local database:
```bash
docker compose up -d db
```
The database will be exposed on port `55432`.

### 2. Backend (Express API)
The backend requires the database to be running.
```bash
cd backend
npm run dev
```
Wait until you see `Server running on port 4001`. The backend handles all APIs and Authentication.

### 3. Web Client (Customer & Admin)
In a new terminal window:
```bash
cd web
npm run dev
```
The web app is available at `http://localhost:3000`.

### 4. Mobile App (Expo / React Native)
Make sure the backend is fully running first so the mobile app can connect successfully to authentication and data routes.
```bash
cd mobile
npm run ios
```
Wait for Expo to start the Metro bundler completely and deploy to the iOS simulator. The Expo bundler runs locally on port `8081`.
*Note*: If you only need the Metro packager to connect an existing app via Expo Go, you can do `npm start` instead of `npm run ios`.

## Production deploy

The API is a long-running Node process (Socket.IO + analytics workers). It cannot run as Vercel serverless alone.

You cannot invent Cloudinary, Resend, or Google OAuth keys. The app boots without them: image uploads return 503, emails are skipped, and Google login is hidden.

### Docker (recommended)

From the repo root, create a gitignored `.env` (do not commit it):

```bash
PUBLIC_URL=http://localhost
POSTGRES_PASSWORD=choose-a-strong-password
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-20b
BETTER_AUTH_SECRET=generate-a-32-byte-hex-secret
```

Then:

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

Open [http://localhost](http://localhost). Nginx serves the storefront and proxies `/api` and `/socket.io` to the backend.

Admin login after seed:

- Email: `admin@example.com`
- Password: `password123`

### Render

`render.yaml` defines Postgres + API + web. After connecting the GitHub repo in the Render dashboard:

1. Set `GROQ_API_KEY` on `js-ashanti-api`
2. Set `BETTER_AUTH_URL` and `FRONTEND_URL` to the public HTTPS URLs
3. Set `NEXT_PUBLIC_BACKEND_URL` on `js-ashanti-web` to the API URL (or the public origin if you put a reverse proxy in front)

Rotate any Groq key that was pasted into chat before using it in production.

