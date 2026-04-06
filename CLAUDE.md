# CLAUDE.md

## Project Overview

Omega Strikers Drafter — a real-time competitive draft tool for the game Omega Strikers. Two teams (blue/red) go through map bans, awakening reveals, and character ban/pick phases via WebSocket. Spectators can watch live.

## Architecture

**Single PartyKit project** with shared code, server, and client in one repo:

- **shared** (`src/shared/`) — Pure TypeScript: types, game data (characters, maps, awakenings), and the `DraftMachine` state machine. No I/O, no framework dependencies.
- **server** (`src/server/`) — PartyKit `Party.Server` implementation. Each room is a PartyKit room instance with its own state. Handles WebSocket connections, draft logic, timers, and HTTP room creation.
- **client** (`src/client/`) — React 19 SPA built with Vite, served by PartyKit's static asset serving. Zustand store synced to PartySocket. Client-side routing.

## Key Patterns

- **DraftMachine is pure and synchronous** — Takes actions, returns new state. No timers, no I/O.
- **PartyKit rooms = draft rooms** — Each room ID maps 1:1 to a PartyKit room instance. No separate registry needed.
- **WebSocket messages are JSON** — `ClientMessage` and `ServerMessage` discriminated unions replace Socket.IO events.
- **Connection tags for roles** — `getConnectionTags` tags each connection with its role (blue/red/spectator) for targeted broadcasting.
- **Room creation via HTTP** — POST to `/parties/main/{roomId}` configures a room. The client generates the room ID.
- **Vite builds the client** — `partykit.json` runs `vite build` before deploy. Dev mode runs Vite and PartyKit concurrently.

## Commands

```bash
npm install              # Install all dependencies
npm run dev              # Run PartyKit server (1999) + Vite dev server (3000) concurrently
npm run build            # Build client with Vite
npm run deploy           # Build + deploy to PartyKit
npm test                 # Run tests
npm run lint             # Type-check
```

## WebSocket Message Protocol

**Client → Server (JSON via WebSocket):**
- `{ type: "draft:start" }` — Start the draft
- `{ type: "draft:ban-map", mapId }` — Ban a map
- `{ type: "draft:pick-map", mapId }` — Pick a map
- `{ type: "draft:select", characterId }` — Tentative character selection
- `{ type: "draft:lock" }` — Lock in current selection

**Server → Client (JSON via WebSocket):**
- `{ type: "room:state", state }` — Room connection status
- `{ type: "draft:state", state }` — Draft state (team-filtered)
- `{ type: "draft:timer", remaining }` — Timer tick
- `{ type: "draft:phase-change", phase }` — Phase transition
- `{ type: "draft:action", action }` — Action audit event
- `{ type: "error", message }` — Error notification

**HTTP:**
- `POST /parties/main/{roomId}` — Create/configure a room
- `GET /parties/main/{roomId}` — Get room state

## Code Conventions

- TypeScript strict mode
- ES modules (`"type": "module"`)
- Path aliases: `@/*` → `src/client/*`, `@shared/*` → `src/shared/*`
- Styling: Tailwind CSS 4 with OKLCH color tokens in `globals.css`
- Components: Base UI (Radix) + class-variance-authority for variants
- No `next/image` — plain `<img>` tags throughout
