# Omega Strikers Drafter

A real-time competitive draft tool for [Omega Strikers](https://omegastrikers.gg/) with character picks, map bans, and awakenings. Built for the competitive community to run structured drafts outside of the game's limited in-game tools.

**Live at:** [drafter.bestieinslot.com](https://drafter.bestieinslot.com)

## What it does

Two teams (blue and red) go through a multi-phase competitive draft:

1. **Map Draft** — Teams take turns banning and picking maps from a pool (Bo1 or Bo3 format)
2. **Awakening Reveal** — A randomized pair of starting awakenings is shown to both teams
3. **Character Ban Phase** — Each team bans characters (simultaneous or staggered)
4. **Character Pick Phase** — Each team picks 3 characters (snake, alternating, or simultaneous order)

Spectators can watch the draft in real-time. Timers auto-select randomly if a player doesn't lock in.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| State (client) | Zustand |
| UI Components | Base UI (Radix), class-variance-authority |
| Styling | Tailwind CSS 4 |
| Backend | Fastify 5, Socket.IO 4, TypeScript |
| Game Data | Static TypeScript files |
| Testing | Vitest |
| Monorepo | pnpm workspaces |

## Project Structure

```
OS-Drafter/
├── packages/
│   ├── client/          # Next.js frontend
│   ├── server/          # Fastify + Socket.IO backend
│   └── shared/          # Shared types, game data, draft state machine
├── package.json         # Workspace root
└── pnpm-workspace.yaml
```

### packages/shared

Core logic shared between client and server:

- **Game data** — Character roster (21), map pool (10), awakenings (59 total, 34 in legal pool) with exclusion rules
- **Types** — `DraftConfig`, `DraftState`, `RoomState`, Socket.IO event types
- **DraftMachine** — Pure synchronous state machine that handles all draft logic (bans, picks, turn order, mirror rules, simultaneous actions, timer expiry)
- **Turn orders** — Generated sequences for snake/alternating/simultaneous modes in both map and character drafts

### packages/server

Real-time backend:

- **Room management** — In-memory registry of draft rooms with create/join/disconnect
- **Socket.IO handlers** — Room events, draft actions (ban, pick, select, lock-in)
- **REST API** — `POST /rooms` (create), `GET /rooms/:id` (status), `GET /health`
- **DraftTimer** — Server-side countdown that broadcasts ticks and auto-selects on expiry
- **Validation** — Config validation with Fastify JSON schema

### packages/client

Next.js frontend:

- **Home page** — Forms to create map or character draft rooms
- **Room page** — Dynamic route (`/room/[id]?role=blue|red|spectator`) rendering the draft board
- **Draft board** — Character grid, ban/pick slots, team panels, timer, phase banner
- **Map ban phase** — Map grid with ban/pick mechanics for Bo1/Bo3
- **Zustand store** — Reactive state synced with Socket.IO events
- **Socket hook** — Manages connection, reconnection, and event dispatching

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10 (`corepack enable` to activate)

### Install & Run

```bash
git clone https://github.com/arajput96/OS-Drafter.git
cd OS-Drafter
pnpm install
pnpm predev       # Build shared package first
pnpm dev          # Runs client (localhost:3000) + server (localhost:8082) concurrently
```

Open [http://localhost:3000](http://localhost:3000) to create a draft room. Open the blue and red team links in separate browser tabs to test the full flow.

### Build

```bash
pnpm build        # Builds shared → client → server
```

### Test

```bash
pnpm test         # Runs shared + server test suites
```

## Draft Modes

### Character Draft
| Mode | Order |
|------|-------|
| Alternating | B, R, B, R, B, R |
| Snake | B, R, R, B, B, R (reverses each round) |
| Simultaneous | Both pick at the same time |

### Character Ban
| Mode | Behavior |
|------|----------|
| Staggered | B bans, R bans (alternating) |
| Simultaneous | Both ban at the same time |
| None | No bans |

### Mirror Rules
| Rule | Effect |
|------|--------|
| No mirrors | No duplicate picks across both teams |
| Team mirrors | Can't duplicate within own team, opponent can pick same |
| Full duplicates | Any character available to both teams |

### Map Draft
| Format | Steps |
|--------|-------|
| Bo1 | 3 side-select bans → map-select picks 1 |
| Bo3 | 6 steps → determines 3 games with role assignments |

## Environment Variables

### Client
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8082` | Server REST API URL |
| `NEXT_PUBLIC_SOCKET_IO_URL` | `http://localhost:8082` | Socket.IO server URL |

### Server
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8082` | Server port (Railway injects this) |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

## Self-Hosting

If you want to deploy your own instance:

### Frontend (Vercel)

1. Import the repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `packages/client`
3. Set **Install Command** to `cd ../.. && corepack enable && pnpm install --frozen-lockfile`
4. Set **Build Command** to `cd ../.. && corepack enable && pnpm install --frozen-lockfile && pnpm run build`
5. Add environment variables:
   - `NEXT_PUBLIC_API_BASE` = your backend URL
   - `NEXT_PUBLIC_SOCKET_IO_URL` = your backend URL

### Backend (Railway)

1. Create a new project on [Railway](https://railway.com) from the repo
2. Set **Build Command** to `corepack enable && pnpm install --frozen-lockfile && pnpm run build`
3. Set **Start Command** to `node packages/server/dist/index.js`
4. Add environment variables:
   - `CLIENT_ORIGIN` = your frontend URL (e.g., `https://your-app.vercel.app`)
   - `NODE_ENV` = `production`
5. Railway auto-injects `PORT` — do not set it manually

### Other Platforms

Any platform that supports persistent WebSocket connections works for the backend. The frontend is a standard Next.js app deployable anywhere Next.js runs. The key requirement is that `CLIENT_ORIGIN` on the server matches the frontend URL for CORS.

## Contributing

Contributions are welcome! To get started:

1. Fork the repo and create a branch from `main`
2. Run `pnpm install && pnpm predev && pnpm dev` to start the dev environment
3. Make your changes — the shared package rebuilds on save via `tsc --watch`
4. Run `pnpm test` to verify nothing is broken
5. Open a PR against `main`

### Updating Game Data

When Omega Strikers releases new characters, maps, or awakenings:

1. Add the asset image to `packages/client/public/assets/characters/`, `maps/`, or `awakenings/`
2. Update the corresponding data file in `packages/shared/src/data/` (`characters.ts`, `maps.ts`, or `awakenings.ts`)
3. For awakenings, update the legal pool (`CURRENT_AWAKENING_POOL`) and exclusion rules (`AWAKENING_EXCLUSIONS`) if needed

## License

This project is built for the Omega Strikers competitive community.
