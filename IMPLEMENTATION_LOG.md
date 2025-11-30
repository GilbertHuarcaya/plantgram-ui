# Plantgram UI — Implementation Log

Date: 2025-11-27

Log of implemented items and remaining work.

- 2025-11-27 10:00 — Created `plantgram-ui` scaffold with `public/index.html`, `store/index.js`, and placeholders for screens.
- 2025-11-27 10:20 — Implemented `auth` store: `login`, `signup`, `verify`, token persistence in `localStorage`.
- 2025-11-27 10:35 — Implemented `posts` store: `load` feed, `createPost` (upload -> post), `getById`, simple `like` method.
- 2025-11-27 10:50 — Implemented `comments` store: `load`, `add` comment.
- 2025-11-27 11:05 — Implemented `profile`, `species`, `saves`, `notifications` stores with basic methods.
- 2025-11-27 11:15 — Added UI sections in `index.html` for Login, Signup, Feed, Create Post, Post Detail, Profile.
- 2025-11-27 11:35 — Added Explore UI (species search) and wired to `species.search` store.
- 2025-11-27 11:45 — Added Saves UI (list saved posts) and wired to `saves` store.
- 2025-11-27 11:55 — Added Notifications UI and implemented `notifications.markRead` and `notifications.remove` in store.
- 2025-11-27 12:10 — Implemented Plant Profiles UI and `plantProfiles` store (list, create, view, delete).

Remaining / Next tasks:
- Implement Explore UI and species search UI and link to species detail (medium).
 - Implemented Explore UI and species search UI (basic).
- Implement Plant Profiles CRUD UI and backend integration (medium).
- Implement Notifications UI and mark-as-read interactions (small).
- Implement Saves UI (list saved posts) and UX polishing (small).
 - Implemented Notifications UI and mark-as-read/delete interactions (basic).
 - Implemented Saves UI (list saved posts) (basic).
- Implement Settings (edit profile, upload profile_pic) (medium).
- Add client-side validation and friendly error/toast components (small).
- Add unit/manual tests and end-to-end smoke test for flows (small).

Notes:
- The frontend assumes API at `http://localhost:3000` by default; override `window.PLANTGRAM_API_URL` before `store/index.js` to change.
- Upload endpoint expected to return `imageUrl` or `image_url` or `filename` (fallback constructs `/uploads/<filename>`).

-- End of log
