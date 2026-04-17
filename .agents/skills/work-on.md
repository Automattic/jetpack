---
description: End-to-end workflow from prompt to draft PR on an isolated Jetpack Docker instance. Plans, worktrees, implements, tests, screenshots, opens the PR.
---

# /work-on

Drives a task prompt all the way to a draft pull request on its own worktree and its own `jp docker` instance, without touching the primary `jetpack_dev` environment. Depends on the parallel-environment CLI flags (`jp docker up --name ... --port ...`, `--port-phpmy/inbox/smtp/sftp`).

> **CLI note.** All commands use `jp`, which is the canonical Jetpack monorepo CLI documented in `AGENTS.md`. If your local install exposes it as `jetpack` or `pnpm jetpack` instead, swap freely — they resolve to the same command.

## When to use
- New features or non-trivial bug fixes that should land as their own PR.
- Changes where before/after screenshots matter.
- Work you want fully isolated from the running `jetpack_dev` container.

## When not to use
- One-line trivial fixes (overhead isn't worth it).
- Work that must mutate `jetpack_dev` state directly.
- Tasks that depend on a live WordPress.com connection / Jurassic Tube tunnel — tunnels are not set up by this skill.

## Modes

Ask the user up front which mode to run, unless they've specified:

1. **Full run** — plan → bootstrap → implement → verify → draft PR. Default.
2. **Bootstrap only** — plan + worktree + docker up, then stop and hand off. Useful when the human wants to drive the implementation themselves.
3. **Implement only** — resume Phases 5–11 against an existing `/work-on` bootstrap (worktree present, docker already running). Look for `.work-on/env.json` inside the target worktree to recover the slug/port map.

## Preflight (always run)

1. **Read `AGENTS.md`** for the current build, test, docker, changelog, and PR commands. Do not guess from memory — these change.
2. **Read any project-level `.codex/README.md`** for the project you're about to touch (see the codex notes in `AGENTS.md` and the user's global instructions). It will save expensive re-exploration.
3. **Git state**:
   - `git fetch origin trunk --quiet`
   - `git status` — the working tree must be clean before spawning a worktree.
   - `git branch --show-current` — determine whether we're on `trunk` or a feature branch.
4. **Continuation detection**:
   - Current branch ≠ trunk AND has commits ahead of `origin/trunk` → ask the user: "This looks like a continuation of `<branch>`. Options: (a) add to that branch (force-push may be needed later to keep rebased), (b) branch off fresh from trunk. Which?" Act on the answer.
   - A worktree already exists at the proposed path → ask whether to reuse or pick a different slug.
   - A docker compose project matching the proposed `jetpack_<slug>` is already running → ask whether to reuse, stop, or pick a different slug.
5. **Fill in missing details** by asking the user, not by guessing: Linear/P2/Figma links, plugin scope, whether the change is visual. The goal is a self-explanatory PR; blanks hurt that.

## Phase 0 — Parse the prompt

From the user's request, extract:
- **Task slug** — kebab-case, ≤ 30 chars, safe as both `--name` and branch suffix (e.g. `fix-forms-label-wrap`).
- **Target project(s)** — e.g. `projects/plugins/jetpack`, `projects/packages/forms`. If ambiguous, ask.
- **Visual change?** — any UI/CSS/React/block markup implies yes. If yes, Phases 4 and 7 are mandatory.
- **External references** — Linear ticket, P2 link (use the `abc1-2-p2` shorthand per AGENTS.md "Confidentiality"), Figma URL, GitHub issue. These feed the PR body.
- **Scope boundary** — what is explicitly out of scope (useful to note in the PR).

## Phase 1 — Orient & research

- `git log -20 --oneline` on the target area for recent context.
- Grep the codebase for existing patterns before writing anything new.
- If the change is large (> ~200 LoC expected) or the area is unfamiliar, spawn one or two `Explore` agents on the top recent contributors' merged PRs in that area to pick up conventions.
- Note any nearby tests — they're the first place the change can break.

## Phase 2 — Plan

Produce and show the user a plan that includes:
- Files to touch (with line ranges where known).
- Approach and trade-offs (2–3 bullets).
- Test plan (manual and automated).
- Whether a changelog entry is needed, for which project(s), and a draft entry.
- Baseline-screenshot path (URL + what to capture) if visual.

**Wait for user approval** before moving on, unless they've said "skip planning".

## Phase 3 — Worktree & Docker bring-up

Pick a slug (from Phase 0) and a free **port tuple** via the **Port allocation** section below. Record them.

From the main checkout (the user's working directory):

```
git worktree add /path/to/jetpack-<slug> -b change/<slug> trunk
cd /path/to/jetpack-<slug>
pnpm install --frozen-lockfile --prefer-offline
```

Bring up the isolated Docker:

```
jp docker up -d \
  --name <slug> \
  --port <wp-port> \
  --port-phpmy <phpmy-port> \
  --port-inbox <inbox-port> \
  --port-smtp <smtp-port> \
  --port-sftp <sftp-port>
jp docker install --name <slug> --port <wp-port>
```

Persist the choices for cleanup and resume. In the worktree:

```
mkdir -p .work-on
echo '{"slug":"<slug>","branch":"change/<slug>","ports":{"wp":<wp-port>, ...}}' > .work-on/env.json
```

Mark `.work-on/` as locally-ignored so it never commits:

```
echo '.work-on/' >> .git/info/exclude
```

## Phase 4 — Baseline screenshot (visual changes only)

Skip if Phase 0 classified the change as non-visual.

1. Build the affected project on the pre-change worktree state (same commit as trunk, since no code has been written yet):
   ```
   jp build <project>
   ```
   The mounted volume means the running `jetpack_<slug>` container picks the new build up immediately.
2. Auto-pick the browser tool based on what the change needs:
   - **Playwright MCP** (default) — great for screenshots, clicks, form interaction, a11y labels, visual verification. Most tasks.
   - **Chrome DevTools MCP** (`chrome-devtools-mcp:chrome-devtools` skill) — when the task needs perf metrics, network throttling, heavy console interrogation, or CDP-only features.
3. Navigate to `http://localhost:<wp-port>/<path>` and capture `before.png` into `.work-on/screenshots/<slug>-before.png`.

## Phase 5 — Implement

Write the changes on the worktree branch.

Guardrails from the root `CLAUDE.md`:
- Minimal diff, match existing patterns, no speculative abstractions.
- No new error handling/fallbacks for situations that can't happen.
- No comments that describe *what*; only *why* if non-obvious.
- No AI attribution in commits.

**If the real implementation path diverges materially from the Phase 2 plan**, stop and confirm with the user before continuing.

## Phase 6 — Quality gates

All commands are in `AGENTS.md`. Run the subset that applies to the changed files:

| Change type | Commands |
|---|---|
| PHP inside a project | `jp build <project>`, `jp test php <project>`, `jp phan <project>` |
| JS/TS inside a project | `jp build <project>`, `jp test js <project>` (no-op if the project doesn't define it) |
| WP-integration plugin (jetpack / crm / wpcomsh) | `jp docker phpunit <target>` — see `AGENTS.md` "Testing Prerequisites" |
| Root / `tools/*` change | `pnpm test` inside the affected tool package |
| Every change | lint the touched files: `npx eslint <files>` and project-local `composer lint` / PHPCS when present |

**2-cycle fix limit.** If the same gate fails twice in a row, stop and show the user — don't keep grinding.

## Phase 7 — Browser verify (visual changes only)

1. Re-run `jp build <project>` to bake the implementation.
2. Navigate to `http://localhost:<wp-port>/<path>` in the same browser tool used in Phase 4.
3. Capture `after.png` to `.work-on/screenshots/<slug>-after.png`.
4. Check the browser console; record any new errors.
5. If a Figma URL was given in Phase 0, fetch the image (WebFetch) or ask the user to paste one, and compare visually.

## Phase 8 — Changelog

If any file under `projects/` changed, delegate to `.agents/skills/jetpack-changelog.md` now. Do it *before* the PR, not after — changelog wording often shakes out loose ends.

`AGENTS.md` documents the significance/type vocabulary. For the Jetpack plugin specifically, the types are custom (`major | enhancement | compat | bugfix | other`) — check `projects/plugins/jetpack/composer.json`.

## Phase 9 — Self-review

- Read `git diff trunk..HEAD` end to end. Flag anything that looks like:
  - dead code
  - overfitting to a specific case
  - drift from the Phase 2 plan
- If the `simplify` skill is available in the user's environment (`/simplify`), invoke it.
- Re-run Phase 6 gates if code moved. Re-run Phase 7 browser check if a UI file moved.

## Phase 10 — Commit & PR

Commits:
- Imperative, present tense, component-prefixed: `Forms: Fix label wrap on mobile`.
- Single line where possible. Short body only when the *why* isn't obvious from the diff.
- **Never** include AI attribution footers in commit messages.

Push:
```
git push -u origin change/<slug>
```

Create a **draft** PR by delegating to `.agents/skills/jetpack-pr.md`. Required additions for this skill:
- `--draft` on `gh pr create`.
- Embedded before/after screenshots when Phase 7 ran. Local paths do not render inline, so either:
  - drop the images as a PR comment via `gh pr comment <num> --body-file <body-with-images>` (GitHub converts attachments to CDN URLs), OR
  - prompt the user to drag-and-drop the images into the PR after creation and finalise the body.
- Testing instructions copied from Phase 2's test plan and enriched with any Phase 6 gate outputs.
- External references from Phase 0 (Linear / P2 / Figma / issue).
- Use `--body-file` with `gh pr create`, never `--body` — heredoc escaping burns you on backticks and special chars.

## Phase 11 — Cleanup

Immediate:
- `jp docker stop --name <slug>` — stops the containers and frees ports. The DB, uploads, and `node_modules` are kept on disk for easy resume on review feedback.

Deferred (do NOT run automatically — wait for the PR to merge or an explicit user request):
- `jp docker clean --name <slug>` — destroys that instance's DB data.
- `git worktree remove /path/to/jetpack-<slug>` — removes the worktree.
- `.work-on/` scratchpad goes with the worktree.

Report to the user:
- PR URL
- Phase-by-phase gate summary (pass / fail / skipped)
- Path to screenshots
- What was deferred for merge-time cleanup

---

## Port allocation

Main `jetpack_dev` uses: WP 80, phpMyAdmin 8181, Mailpit inbox 1080, Mailpit SMTP 25, SFTP 1022.

Algorithm:
1. List currently-bound host ports:
   ```
   docker ps --format '{{.Ports}}' | grep -oE '[0-9]+->' | tr -d '->' | sort -un
   ```
2. Pick the first band whose five ports are all unbound. Bands are deterministic so the same task slug tends to land in the same band on re-runs:

   | Band | WP | phpMyAdmin | Mailpit inbox | Mailpit SMTP | SFTP |
   |---|---|---|---|---|---|
   | 1 | 8080 | 8281 | 1180 | 2525 | 1122 |
   | 2 | 8090 | 8381 | 1280 | 2626 | 1222 |
   | 3 | 8100 | 8481 | 1380 | 2727 | 1322 |
   | 4 | 8110 | 8581 | 1480 | 2828 | 1422 |

3. If all bands are taken, list running instances to the user and ask them to free a slot or pick explicit ports.

Record the chosen ports in `.work-on/env.json` so Mode 3 (implement-only resume) can find them.

## Docker instance tracking

Before creating a new instance:
```
docker ps -a --filter 'name=jetpack_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```
Collisions: ask the user whether to reuse, stop + recreate, or pick a different slug.

## When to pause and ask

Default is to act, but ALWAYS stop and ask when:
- Continuation is detected at preflight.
- The plan diverges from expectations during implementation.
- A gate fails twice on the same check (2-cycle limit).
- All port bands are occupied.
- The task turns out to need a live WordPress.com connection — tunnel setup is out of scope.
- The user hasn't provided a link or slug and the inferred one feels wrong.

Keep each prompt short: one question, give defaults, proceed on the answer.

## Related skills
- `.agents/skills/jetpack-changelog.md` — Phase 8.
- `.agents/skills/jetpack-pr.md` — Phase 10.
- `.agents/skills/jetpack-review-pr.md` — run before requesting a human reviewer.

## Known limitations / future extensions
- `/implement <slug>` — a companion skill that assumes a prior `/work-on` bootstrap (picks up from Phase 5 using `.work-on/env.json`). Not yet implemented.
- Merge-time cleanup hook that removes the worktree + cleans Docker data once the PR merges. Not yet implemented.
- First-class Jurassic Tube / wp.com-connected flows. Out of scope for now.
