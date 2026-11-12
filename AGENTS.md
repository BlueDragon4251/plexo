# Agent instructions — BlueDragon4251 Plexo fork

**Important active project:** Complete browser-to-Plexo POST download handling.

Before working on Plexo in this fork, read **[docs/POST_DOWNLOAD_HANDOFF.md](docs/POST_DOWNLOAD_HANDOFF.md)** in full. It is the canonical project handoff and progress log, designed so a new chat or coding agent can continue without relying on previous ChatGPT conversations.

## Start here (do not infer state from this file alone)
1. Read the handoff, then inspect the **current remote**: `BlueDragon4251/plexo`, branch `feat/post-download-support`, and fork Draft PR [#1](https://github.com/BlueDragon4251/plexo/pull/1). Compare with upstream `anmolkapil/plexo:main`.
2. Confirm which commits/tests/CI runs exist *now*. Last known branch HEAD on 2026-11-12: `7be596a09aee19be1033343417f163c2f87a654e`. The code may have changed afterward.
3. The current work is **only a fallback against malformed GET replays**. Real POST-body capture, single-stream download execution, end-to-end verification, and an upstream PR are **not done**.
4. Implement and test the next concrete action rather than writing only a plan; push code on the feature branch (or a focused successor branch).
5. Keep `docs/POST_DOWNLOAD_HANDOFF.md` updated with changes, test evidence, blockers and next steps. Keep fork `main` clean of unfinished application changes.
6. Follow `CONTRIBUTING.md` and all existing project conventions. Never commit browser session secrets, POST bodies, authentication tokens or private user data.

## User's one-sentence continuation request

If asked to 'continue the Plexo project by looking at the repository', the task is to **continue the POST download support implementation** in the named fork and branch until properly tested. The Samsung `SM-P613_EUR_14_Opensource.zip` POST attachment is the reference bug. Do not ask the user to re-explain the goal.

## Repository links

- [Detailed status, technical design and prioritized checklist](docs/POST_DOWNLOAD_HANDOFF.md)
- [Existing early design plan on the feature branch](https://github.com/BlueDragon4251/plexo/blob/feat/post-download-support/docs/post-download-design.md)
- [Feature branch](https://github.com/BlueDragon4251/plexo/tree/feat/post-download-support)
- [Draft PR in fork](https://github.com/BlueDragon4251/plexo/pull/1)
- [Official upstream](https://github.com/anmolkapil/plexo)
