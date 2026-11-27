# Contributing

Thank you for helping. Drawings, rigs, engine improvements, docs and bug reports are all welcome.

## Set up

```
npm install
npm run studio      # watch your change
npm run validate    # types and tests
```

## What makes a good change

- **A new drawing** is data in `src/library/drawings/`, up to about 30 lines. Follow the checklist in `docs/illustration.md`, give it a `purpose` and an honest `grade` and `note`, and register it in its `index.ts`.
- **Improve the engine** when the same flaw shows up in several drawings. It beats patching them one by one.
- **Everything is a pure function of time.** No `Math.random`, no clock, no CSS animation; use `random(seed)` from `motion.ts`.
- **Keep it lean:** no dead code, no duplicates, one place per change (`docs/architecture.md` says where).
- **English** in code, data, docs and commit messages.
- **Original work only:** no third-party characters, logos, art or SVGs with a restrictive license. By contributing you agree to publish your work under the MIT license.

## Before the pull request

1. `npm run validate` passes. New math comes with a test in `test/`.
2. Look at the result: `npm run look -- name` for one drawing, `npm run still` and `npm run still:night` for many. Put an image of what changed in the pull request.
3. For a refactor, the render must be identical. Render before and after and run `node tools/compare.mjs before.png after.png`.

## Reporting a bug

Open an issue with the drawing data that shows it, the frame or time, what you expected and an image of what you got.
