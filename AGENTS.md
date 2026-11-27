# AGENTS.md

Instructions for AI coding agents working in this repository.

- **To draw something:** read `docs/illustration.md`. Write data in `src/library/drawings/` (or start from `examples/my-drawing.tsx`) and register it in its `index.ts`. Reusable parts go to `src/engine/geometry/kit.ts`.
- **To change the engine:** `docs/architecture.md` says where each change goes. The engine (`src/engine`) never imports the library (`src/library`). Prefer improving the engine to patching drawings one by one.
- Everything is a pure function of time: no `Math.random`, no clock; use `random(seed)` from `motion.ts`.
- English in code, data, docs and commits. Answer in the language the person writes in.
- Before a commit: `npm run validate`, then render and **look** (`npm run still`, `npm run still:night`). A refactor must render identically (`node tools/compare.mjs before.png after.png`). On Windows: `npm.cmd`, `npx.cmd`.
- Keep it lean: no dead code, no duplicates.
- Do not run `npm publish`.
