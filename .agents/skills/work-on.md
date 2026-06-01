---
description: End-to-end Jetpack workflow that turns a task prompt into a draft PR on its own isolated worktree and `jp docker` instance. Use whenever the user asks to "work on", "ship", "implement", "take to PR", "build and submit", or otherwise wants a change driven from plan → code → tests → screenshots → pull request, or when they ask for a parallel/isolated sandbox separate from their primary `jetpack_dev` container. Also use for "set up a branch for X", "spin up an env to try Y", "walk this spec through to a PR", and similar phrasings — even when the user doesn't name this skill directly. Prefer this over freehand coding whenever the request carries a concrete scope that ends at a reviewable PR.
---

# /work-on

Drives a task prompt all the way to a draft pull request on its own worktree and its own `jp docker` instance, without touching the primary `jetpack_dev` environment. This skill exists because the default monorepo Docker setup is singleton — two `jp docker up` calls from different branches would otherwise collide — so parallel work requires the named-instance CLI flags and port isolation this skill relies on.

## Prerequisites

- **Docker Desktop is running.** The port-allocation step calls `docker ps`; it fails silently on a stopped daemon.
- **`jp` is on your PATH.** `jp` is the canonical CLI (see `AGENTS.md`). If your shell has it as `jetpack` or you invoke it as `pnpm jetpack`, substitute freely — every `jp` command below works identically under those aliases.
- **`jq` is installed.** The scripts in `work-on/scripts/` use it to parse `.work-on/env.json`. `brew install jq` on macOS if missing.
- **`pnpm install --frozen-lockfile` may fail** if the lockfile has drifted since the last pull. The bootstrap script falls back to a regular `pnpm install` automatically; don't panic if you see the warning.

## Trigger phrases

Match this skill when the user's request includes phrases like:

- "work on [something]"
- "implement [feature/spec/ticket]"
- "ship [change]" / "take [this] to PR" / "build and PR"
- "spin up a branch / worktree / sandbox for [X]"
- "set up an isolated environment to try [Y]"
- "walk this through to a PR"
- "draft a PR that does [Z]"

Ambiguous-but-likely triggers: "can you fix [specific thing] and open a PR", "make this happen end-to-end", "go do [task]" when the task has non-trivial scope. If the request is a one-line fix or obviously throwaway exploration, decline this skill and just code.

## Example walkthrough

**User:** "Can you work on fixing the label wrap on mobile in the Forms label block? Figma: https://figma.com/file/abc123"

The skill would:

1. **Parse** the prompt → slug `fix-forms-label-wrap`, project `projects/packages/forms`, visual = yes, Figma reference recorded.
2. **Plan** the change (inspect the block's label CSS, identify breakpoint rule), show the plan, wait for approval.
3. **Allocate ports** via `work-on/scripts/alloc-ports.sh fix-forms-label-wrap` → deterministic band 1 → WP 8080, phpMy 8281, Mailpit 1180/2525, SFTP 1122.
4. **Bootstrap** via `work-on/scripts/bootstrap-worktree.sh fix-forms-label-wrap` → creates `../jetpack-fix-forms-label-wrap` on branch `change/fix-forms-label-wrap` off trunk, runs pnpm install, seeds `.work-on/`.
5. `jp docker up -d --name fix-forms-label-wrap --port 8080 --port-phpmy 8281 --port-inbox 1180 --port-smtp 2525 --port-sftp 1122 --clone-from dev` → `jp docker install --name fix-forms-label-wrap --port 8080` (usually a no-op after clone).
6. **Baseline screenshot** of the affected block at `http://localhost:8080/...` → `.work-on/screenshots/fix-forms-label-wrap-before.png`.
7. **Implement** the CSS fix.
8. `jp build packages/forms` → `jp test js packages/forms` → `jp phan packages/forms`.
9. **After screenshot** → compare to Figma reference.
10. `jp changelog add packages/forms -s patch -t fixed -e "Forms: Fix label wrap on mobile."`
11. Commit (`Forms: Fix label wrap on mobile`), push, open **draft** PR via `jetpack-pr` skill with before/after attachments + testing steps + Figma link.
12. `jp docker stop --name fix-forms-label-wrap`. Worktree stays for review follow-ups.

## When to use
- Non-trivial features or bug fixes that land as their own PR.
- Changes where before/after screenshots matter.
- Work you want isolated from a running `jetpack_dev` container.

## When not to use
- One-line trivial fixes (overhead isn't worth it).
- Work that must mutate `jetpack_dev` state directly.
- Tasks that depend on a live WordPress.com connection / Jurassic Tube tunnel — tunnels are not set up by this skill.

## Modes

Ask the user up front which mode to run, unless they've specified:

1. **Full run** — plan → bootstrap → implement → verify → draft PR. Default.
2. **Bootstrap only** — plan + worktree + docker up, then stop and hand off. Useful when the human wants to drive implementation themselves.
3. **Implement only** — resume Phases 5–11 against an existing `/work-on` bootstrap (worktree present, docker already running). The skill finds `.work-on/env.json` inside the target worktree and reads the slug/port map from it.

## Preflight (always run)

1. **Read `AGENTS.md`** for the current build, test, docker, changelog, and PR commands. Do not guess from memory — these change.
2. **Read any project-level `.codex/README.md`** for the project you're about to touch. It will save expensive re-exploration.
3. **Read `design.md` at the repo root if it exists.** This is the product's design lens (the devkit pattern). Execute its procedure as a checklist before Phase 2 planning: state before-building assumptions tagged `confident`/`assuming`/`unclear`, walk the pattern-matching tiers, surface designer-review triggers by name, name relevant principles. The lens content overrides this skill's defaults where they conflict on UI choices. Skip silently if `design.md` does not exist.
4. **Git state**:
   - `git fetch origin trunk --quiet`
   - `git status` — the working tree must be clean before spawning a worktree.
   - `git branch --show-current` — determine whether we're on `trunk` or a feature branch.
5. **Continuation detection**:
   - Current branch ≠ trunk AND has commits ahead of `origin/trunk` → ask: "This looks like a continuation of `<branch>`. Options: (a) add to that branch (force-push may be needed later to keep rebased), (b) branch off fresh from trunk. Which?" Act on the answer.
   - A worktree already exists at the proposed path → ask whether to reuse or pick a different slug.
   - A docker compose project matching `jetpack_<slug>` is already running → ask whether to reuse, stop, or pick a different slug.
6. **Fill in missing details** by asking the user, not by guessing: Linear/P2/Figma links, plugin scope, whether the change is visual. A self-explanatory PR needs these.

## Phase 0 — Parse the prompt

Extract:
- **Task slug** — kebab-case, ≤ 30 chars, safe as both `--name` and branch suffix (e.g. `fix-forms-label-wrap`).
- **Target project(s)** — e.g. `projects/plugins/jetpack`, `projects/packages/forms`. If ambiguous, ask.
- **Visual change?** — any UI/CSS/React/block markup implies yes. If yes, Phases 4 and 7 are mandatory.
- **External references** — Linear, P2 (use the `abc1-2-p2` shorthand per `AGENTS.md` "Confidentiality"), Figma, GitHub issue.
- **Scope boundary** — anything explicitly out of scope.

## Phase 1 — Orient & research

- `git log -20 --oneline` on the target area.
- Grep the codebase for existing patterns before writing anything new.
- If the change is large (> ~200 LoC expected) or the area is unfamiliar, spawn an `Explore` agent on the top recent contributors' merged PRs in that area to surface conventions.
- Note nearby tests — they're the first place the change can break.

## Phase 2 — Plan

Produce and show the user a plan containing:
- Files to touch (with line ranges where known).
- Approach and trade-offs (2–3 bullets).
- Test plan (manual and automated).
- Changelog decision: needed? which project? draft entry text.
- Baseline-screenshot path (URL + what to capture) if visual.

**Wait for user approval** before moving on, unless they've said "skip planning".

## Phase 3 — Worktree & Docker bring-up

From the **main checkout**, allocate ports and bootstrap the worktree using the helper scripts so the details stay consistent across runs:

```bash
PORTS=$(.agents/skills/work-on/scripts/alloc-ports.sh <slug>)
# PORTS is JSON, e.g. {"band":1,"wp":8080,"phpmy":8281,"inbox":1180,"smtp":2525,"sftp":1122}

WORKTREE=$(.agents/skills/work-on/scripts/bootstrap-worktree.sh <slug>)
# WORKTREE = /path/to/jetpack-<slug>, created on branch change/<slug> off origin/trunk
```

If `alloc-ports.sh` exits 2, every band is taken — ask the user to stop one of the running instances or provide explicit ports.

Bring up the isolated Docker from within the worktree:

```bash
cd "$WORKTREE"
jp docker up -d \
  --name <slug> \
  --port  "$(echo "$PORTS" | jq -r .wp)" \
  --port-phpmy "$(echo "$PORTS" | jq -r .phpmy)" \
  --port-inbox "$(echo "$PORTS" | jq -r .inbox)" \
  --port-smtp  "$(echo "$PORTS" | jq -r .smtp)" \
  --port-sftp  "$(echo "$PORTS" | jq -r .sftp)" \
  --clone-from dev
```

WordPress image pulls can take several minutes on a cold cache — if `jp docker install` fails with "WordPress install is incomplete! Perhaps it is still downloading?", wait ~30s and retry once before escalating. Then:

```bash
jp docker install --name <slug> --port "$(echo "$PORTS" | jq -r .wp)"
```

Use `--clone-from <name>` to seed from a specific running source instance. When the flag is omitted, the CLI auto-clones from `jetpack_dev` if it's running; pass `--no-clone` to opt out and get a fresh-install flow instead.

Write the full session record to `$WORKTREE/.work-on/env.json` using the schema below. Mode 3 (implement-only resume) reads this file — fields are mandatory.

## Phase 4 — Baseline screenshot (visual changes only)

Skip if Phase 0 classified the change as non-visual.

1. Some projects need a one-time `jp install <project>` before the first build. Run it if the project hasn't been built in this worktree before.
2. Build the affected project at the pre-change state (same commit as trunk, since no code has been written yet):
   ```
   jp build <project>
   ```
   The mounted volume means the running `jetpack_<slug>` container picks the new build up immediately.
3. Auto-pick the browser tool:
   - **Playwright MCP** (default) — best for screenshots, clicks, form interaction, a11y labels, visual comparison.
   - **Chrome DevTools MCP** (via the `chrome-devtools-mcp:chrome-devtools` skill) — when the task needs perf metrics, network throttling, heavy console interrogation, or CDP-only features.
4. Navigate to `http://localhost:<wp-port>/<path>` and save `.work-on/screenshots/<slug>-before.png`.

## Phase 5 — Implement

Write the changes on the worktree branch.

Guardrails from the root `CLAUDE.md`:
- Minimal diff, match existing patterns, no speculative abstractions.
- No new error handling for situations that can't happen.
- Comments explain *why*, not *what*; only add when non-obvious.
- No AI attribution in commits.

**If the real implementation path diverges materially from the Phase 2 plan**, stop and confirm before continuing.

## Phase 6 — Quality gates

All commands are in `AGENTS.md`. Run the subset that applies:

| Change type | Commands |
|---|---|
| PHP in a project | `jp build <project>`, `jp test php <project>`, `jp phan <project>` |
| JS/TS in a project | `jp build <project>`, `jp test js <project>` (no-op if the project doesn't define it) |
| WP-integration plugin (jetpack / wpcomsh) | `jp docker phpunit <target> -- --name <slug>` — the `--name` routes to the *worktree's* instance, not `jetpack_dev` |
| Root / `tools/*` change | `pnpm test` inside the affected tool package |
| Every change | lint the touched files: `npx eslint <files>` and project-local `composer lint` / PHPCS when present |

**2-cycle fix limit.** If the same gate fails twice in a row, stop and show the user — don't keep grinding. Silent grinding is how a "15-minute fix" becomes an hour of wasted context.

## Phase 7 — Browser verify (visual changes only)

1. Re-run `jp build <project>` to bake the implementation.
2. Navigate to `http://localhost:<wp-port>/<path>` in the same browser tool used in Phase 4.
3. Save `.work-on/screenshots/<slug>-after.png`.
4. Check the browser console; save any new errors to `.work-on/console-<slug>.log`.
5. If a Figma URL was given, fetch the image (WebFetch) or ask the user to paste one, and compare.

## Phase 8 — Changelog

If any file under `projects/` changed, delegate to `.agents/skills/jetpack-changelog.md` **now**, not later. Changelog wording often shakes out loose ends — the act of summarising the user-visible change forces you to notice incomplete edges.

`AGENTS.md` documents the significance/type vocabulary. The Jetpack plugin uses custom types (`major | enhancement | compat | bugfix | other`) — check `projects/plugins/jetpack/composer.json` before writing.

## Phase 9 — Self-review

- Read `git diff trunk..HEAD` end to end. Flag dead code, overfitting, drift from the Phase 2 plan.
- If `/simplify` is available in the user's environment, invoke it.
- Re-run Phase 6 gates if code moved. Re-run Phase 7 browser check if a UI file moved.

## Phase 10 — Commit & PR

Commits:
- Imperative, present-tense, component-prefixed: `Forms: Fix label wrap on mobile`.
- Single-line commit subject when the diff speaks for itself; short body only when the *why* isn't obvious.
- **Never** include AI attribution footers.

Push:
```
git push -u origin change/<slug>
```

Create a **draft** PR by delegating to `.agents/skills/jetpack-pr.md`. Additions for this skill:

- Pass `--draft` to `gh pr create`.
- Apply `[Status] In Progress` rather than `[Status] Needs Review`. A draft is WIP; don't page the review team yet.
- Use `--body-file`, never `--body` — heredoc escaping breaks on backticks and special chars.
- **Screenshots**: local paths don't render in the body. Either (a) add the images as a PR comment via `gh pr comment <num> --body-file <file-with-![alt](path)>` so GitHub converts them to CDN URLs, then reference those URLs from the PR body, or (b) open the PR first and ask the user to drag the images in and finalise.
- Embed: Phase 2 test plan, Phase 6 gate outputs, Phase 0 external references, before/after screenshot URLs.
- Suggest reviewers if the user hasn't named any — pick the top 1–2 recent authors on the changed files from `git log --format='%an'`.

## Phase 11 — Cleanup

**On success:**

- `jp docker stop --name <slug>` — stops the containers and frees ports. DB, uploads, and `node_modules` remain on disk for review follow-ups.

Do NOT run automatically — wait for PR merge or explicit user request:
- `jp docker clean --name <slug>` (destroys that instance's DB).
- `git worktree remove <path>` (removes the worktree + scratchpad).

**On failure** (any phase errors out):

- Attempt `jp docker stop --name <slug>` so the named instance doesn't sit orphaned holding ports.
- Leave the worktree in place; the user may want to inspect the partial state.
- Tell the user exactly which phase failed, what the error was, and which of the two cleanup paths to use next.

**Report at the end** — always:
- PR URL (or "not opened" if we stopped earlier).
- Phase-by-phase status: pass / fail / skipped.
- Path to `.work-on/screenshots/` and `.work-on/console-*.log`.
- What was deferred for merge-time cleanup.

---

## `.work-on/env.json` schema

Written by Phase 3, read by Mode 3. Fields are required unless marked optional. Dates are ISO 8601 UTC.

```json
{
  "slug": "fix-forms-label-wrap",
  "branch": "change/fix-forms-label-wrap",
  "worktree": "/Users/you/a8c/dev/jetpack-fix-forms-label-wrap",
  "project": "projects/packages/forms",
  "visual": true,
  "band": 1,
  "ports": {
    "wp": 8080,
    "phpmy": 8281,
    "inbox": 1180,
    "smtp": 2525,
    "sftp": 1122
  },
  "references": {
    "figma": "https://figma.com/file/abc123",
    "linear": null,
    "p2": null,
    "issue": null
  },
  "created": "2026-04-17T15:30:00Z"
}
```

## Port allocation

Main `jetpack_dev` uses: WP 80, phpMyAdmin 8181, Mailpit inbox 1080, Mailpit SMTP 25, SFTP 1022.

Allocation is done by `work-on/scripts/alloc-ports.sh <slug>`. It reads `docker ps` for currently-bound host ports, picks the first band whose five ports are all unbound, and prints JSON on stdout. Bands are deterministic from the slug hash so the same task lands in the same band across restarts. Exit code 2 means every band is occupied — ask the user to free one.

Band map (kept in sync with the script):

| Band | WP | phpMyAdmin | Mailpit inbox | Mailpit SMTP | SFTP |
|---|---|---|---|---|---|
| 1 | 8080 | 8281 | 1180 | 2525 | 1122 |
| 2 | 8090 | 8381 | 1280 | 2626 | 1222 |
| 3 | 8100 | 8481 | 1380 | 2727 | 1322 |
| 4 | 8110 | 8581 | 1480 | 2828 | 1422 |

## Docker instance tracking

Before creating a new instance:

```
docker ps -a --filter 'name=jetpack_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Collisions: ask the user to reuse, stop + recreate, or pick a different slug.

## When to pause and ask

Default is to act, but stop and ask when:
- Continuation is detected at preflight.
- The plan diverges from expectations during implementation.
- A gate fails twice on the same check (the 2-cycle limit).
- All port bands are occupied.
- The task turns out to need a live WordPress.com connection.
- The inferred slug, project, or scope feels wrong or thin.

Keep each prompt short: one question, give defaults, proceed on the answer.

## Success signals

The skill completed successfully if all of these hold:

- `git branch --show-current` (inside the worktree) equals `change/<slug>`.
- `git log origin/trunk..HEAD` is non-empty and every commit message is imperative, present-tense, and does NOT contain `Co-Authored-By: Claude` or `Generated with Claude Code`.
- `gh pr view --json isDraft,state,body` returns `{"isDraft":true,"state":"OPEN"}` and the body contains a "Testing instructions" section.
- `docker ps --filter name=jetpack_<slug>` lists **no running container** (Phase 11 immediate stop was honored).
- `git worktree list | grep jetpack-<slug>` still shows the worktree present (deferred cleanup).
- If the change was visual: `.work-on/screenshots/<slug>-before.png` and `<slug>-after.png` both exist and are >4 KB.
- If any file under `projects/` changed: a new entry exists in that project's `changelog/` directory.
- `.work-on/env.json` is valid JSON and round-trips through `jq` without error.

Use these as the "definition of done" when you report back to the user — mention any that didn't hold.

## Related skills
- `.agents/skills/jetpack-changelog.md` — Phase 8.
- `.agents/skills/jetpack-pr.md` — Phase 10.
- `.agents/skills/jetpack-review-pr.md` — run before requesting a human reviewer.

## Scripts
- `work-on/scripts/alloc-ports.sh` — port-band allocator.
- `work-on/scripts/bootstrap-worktree.sh` — worktree + pnpm install + scratchpad.

## Known limitations / future extensions
- `/implement <slug>` — companion skill that assumes a prior `/work-on` bootstrap (picks up from Phase 5 using `.work-on/env.json`). Not yet implemented.
- Merge-time cleanup hook that removes the worktree + cleans Docker data once the PR merges.
- First-class Jurassic Tube / wp.com-connected flows.
