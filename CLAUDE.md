# CLAUDE.md

## Project Overview

Omega Strikers Drafter — a real-time competitive draft tool for the game Omega Strikers. Two teams (blue/red) go through map bans, awakening reveals, and character ban/pick phases via WebSocket. Spectators can watch live.

## Architecture

**Monorepo** with three packages under `packages/`:

- **shared** (`@os-drafter/shared`) — Pure TypeScript: types, game data (characters, maps, awakenings), and the `DraftMachine` state machine. No I/O, no framework dependencies. This is the source of truth for draft logic.
- **server** (`@os-drafter/server`) — Fastify 5 + Socket.IO 4. Manages rooms in-memory (`RoomRegistry`), runs `DraftTimer` countdowns, broadcasts state via Socket.IO events. REST endpoints for room creation (`POST /rooms`) and status (`GET /rooms/:id`).
- **client** (`@os-drafter/client`) — Next.js 16 + React 19. Zustand store synced to Socket.IO events. Home page has forms to create drafts. Room page (`/room/[id]?role=blue|red|spectator`) renders the draft board.

## Key Patterns

- **DraftMachine is pure and synchronous** — It takes actions, returns new state. No timers, no I/O. The server wraps it with `DraftTimer` and Socket.IO broadcasting.
- **Turn orders are generated upfront** — `turnOrders.ts` produces the full sequence of `TurnStep[]` for a given config. The machine walks through them via `turnIndex`.
- **Simultaneous mode uses `pendingActions`** — Both teams submit, server holds until both are in (or timer expires). Team views hide opponent's pending action.
- **Shared package must build before client/server** — The `pnpm predev` script handles this. CI/build commands run `pnpm --filter @os-drafter/shared build` first.
- **Game data is static TypeScript** — Characters, maps, and awakenings are defined in `packages/shared/src/data/`. Assets live in `packages/client/public/assets/`. Data files reference asset paths by convention (`/assets/characters/Ai.Mi.png`).

## Commands

```bash
pnpm install              # Install all dependencies
pnpm predev               # Build shared (required before dev)
pnpm dev                  # Run client + server + shared watch concurrently
pnpm build                # Build all: shared → client → server
pnpm test                 # Run shared + server tests
pnpm lint                 # Lint all packages
```

Individual packages:
```bash
pnpm --filter @os-drafter/shared test:watch
pnpm --filter @os-drafter/server test:watch
pnpm --filter @os-drafter/client dev
```

## Code Conventions

- TypeScript strict mode everywhere
- ES modules (`"type": "module"`) in server and shared
- Import from shared via `@os-drafter/shared` (workspace dependency)
- Client path alias: `@/*` maps to `./src/*`
- Server imports use `.js` extensions (required for ESM with tsc output)
- Styling: Tailwind CSS 4 with OKLCH color tokens in `globals.css`
- Components: Base UI (Radix) + class-variance-authority for variants

## Socket.IO Event Protocol

**Client → Server:**
- `room:create(config, callback)` — Create room
- `room:join(roomId, role)` — Join room
- `draft:start()` — Start the draft (requires both teams connected)
- `draft:ban-map(mapId)` — Ban a map
- `draft:pick-map(mapId)` — Pick a map
- `draft:select(characterId)` — Tentative character selection (preview, no lock-in)
- `draft:lock()` — Lock in the current selection

**Server → Client:**
- `room:state(RoomState)` — Connection status, config
- `draft:state(DraftState)` — Full draft state (team-filtered for hiding opponent pending actions)
- `draft:timer(remaining)` — Countdown tick
- `draft:phase-change(phase)` — Phase transitioned
- `draft:action(action)` — Action audit event
- `error(message)` — Error notification

## Environment Variables

Client reads `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_SOCKET_IO_URL` (default: `http://localhost:8082`).
Server reads `PORT` (default: 8082) and `CLIENT_ORIGIN` (default: `http://localhost:3000`).

## Hosting

- **Frontend:** Vercel (auto-deploys from `main` branch, root directory: `packages/client`)
- **Backend:** Railway (auto-deploys from `main` branch, start command: `node packages/server/dist/index.js`)
- **Domain:** `drafter.bestieinslot.com` (CNAME → Vercel)

## Testing

Tests use Vitest. The most critical tests are for `DraftMachine` in `packages/shared/src/__tests__/` — these cover all draft mode × ban mode × mirror rule combinations, timer expiry, turn orders, and simultaneous action handling.

Server integration tests in `packages/server/src/__tests__/` test room lifecycle and draft flow over Socket.IO.

## Updating Game Data

When Omega Strikers patches add/remove characters, maps, or awakenings:

1. Add/remove asset images in `packages/client/public/assets/`
2. Update data files in `packages/shared/src/data/` — `characters.ts`, `maps.ts`, `awakenings.ts`
3. For awakenings: update `CURRENT_AWAKENING_POOL` (legal pool) and `AWAKENING_EXCLUSIONS` (pairing rules)
4. For maps: set `active: false` on removed maps rather than deleting them (preserves history)
5. Run `pnpm test` to verify data integrity tests still pass

## Known Limitations

- Room storage is in-memory — rooms are lost on server restart. No TTL eviction yet (memory leak risk for abandoned rooms).
- No rate limiting on room creation.
- Reconnection sends catch-up state but doesn't replay missed animations.
