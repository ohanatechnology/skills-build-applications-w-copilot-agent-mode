# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Route components load their own contract endpoint through the shared client, using relative `/api` paths and accessible loading, empty, and error states.
- Logic tier decision: Keep validation and business behavior in explicit services; reject invalid payloads and missing references with 4xx responses.
- Data tier decision: Require the contract fields in Mongoose, preserve team names and mascots, and seed recent demo activities with stable upsert IDs.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; store user/team references, one point per minute, and the creation time.
- Team management approach: Require non-empty names and mascots; default members to an empty array.
- Leaderboard approach: Sum activity points per team, include teams with no activity at zero, sort descending, then assign 1-based ranks.
- Workout suggestions approach: Match a user's most common recent activity focus first, fall back to their fitness goal, and explain the recommendation.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — schema assertions pass; the seed integration test is blocked because MongoMemoryServer cannot download MongoDB in this environment.
- API command: `npm run test:api --prefix octofit-tracker/backend` — blocked before API assertions for the same MongoDB download restriction.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — passed (15 tests).
- Backend build command: `npm run build --prefix octofit-tracker/backend` — passed.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — passed.
