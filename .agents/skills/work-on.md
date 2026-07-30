---
description: Optional end-to-end Jetpack workflow that drives a scoped task to a draft PR inside its own git worktree and its own named `jp docker` instance, leaving the primary `jetpack_dev` untouched. It wraps the repo-native parallel-worktree flow (`tools/docker/bin/seed-worktree-env.sh`, tools/docker/README.md § "Parallel development environments") and layers plan → code → quality gates → screenshots → changelog → draft PR on top; it is not a replacement for ordinary in-checkout work. It costs a worktree, a pnpm install, and a multi-minute Docker bring-up. OFFER it when a request has concrete scope that ends at a reviewable PR and would genuinely benefit from isolation, then proceed only if the user accepts — do NOT enter it unprompted. Do not use it for one-line fixes, debugging, lookups, exploration, work that must mutate `jetpack_dev` directly, or anything requiring a Jurassic Tube tunnel.
---

# /work-on

Drives a task prompt all the way to a draft pull request on its own worktree and its own `jp docker` instance, without touching the primary `jetpack_dev` environment. This skill exists because the default monorepo Docker setup is singleton — two `jp docker up` calls from different branches would otherwise collide — so parallel work requires the named-instance CLI flags and port isolation this skill relies on.

**This skill is an option, not a policy.** It is one way to work in this repo, offered alongside the plain in-checkout workflow and the repo-native worktree flow described below. Offer it, name what it costs, and take no for an answer — see "Relationship to the native worktree flows".

## Prerequisites

- **Docker Desktop is running.** Bring-up and the instance checks in Phase 3 and Phase 11 call `docker ps`; they fail silently on a stopped daemon.
- **`jp` is on your PATH.** `jp` is the canonical CLI (see `AGENTS.md`). If your shell has it as `jetpack` or you invoke it as `pnpm jetpack`, substitute freely — every `jp` command below works identically under those aliases.
- **`jq` is installed.** Used to read and write `.work-on/env.json`. `brew install jq` on macOS if missing.
- **`pnpm install --frozen-lockfile` may fail** if the lockfile has drifted since the last pull. The bootstrap script falls back to a regular `pnpm install` automatically; don't panic if you see the warning.

## When to offer this skill

**Enter this skill only when the user has asked for it, or has accepted an offer of it.** The skill name is an everyday phrase — "let's work on the dashboard" is how any task begins — so a phrase match alone is never sufficient evidence that the user wants a worktree and a Docker instance.

Named requests — run it:

- "/work-on [X]", "use work-on for this", "run the work-on flow"

Unnamed requests worth **offering** it for — say what it costs and wait:

- "spin up a branch / worktree / sandbox for [X]"
- "set up an isolated environment to try [Y]"
- "walk this through to a PR" / "take this to PR" / "build and PR"
- "implement [feature/spec/ticket]" where the scope is non-trivial and ends at a reviewable PR

The offer should be one sentence and concrete, e.g.: *"I can run this through `/work-on` — its own worktree plus a dedicated `jp docker` instance, so your `jetpack_dev` stays untouched. Costs a few minutes of bring-up. Want that, or should I just work here?"*

Do not offer it at all for: one-line fixes, debugging an existing failure, code lookups or questions, throwaway exploration, or work that must mutate `jetpack_dev` directly. Just do the work in the current checkout.

## Example walkthrough

**User:** "Can you work on fixing the label wrap on mobile in the Forms label block? Figma: https://figma.com/file/abc123"

The skill would:

1. **Parse** the prompt → slug `fix-forms-label-wrap`, project `projects/packages/forms`, visual = yes, Figma reference recorded.
2. **Plan** the change (inspect the block's label CSS, identify breakpoint rule), show the plan, wait for approval.
3. **Bootstrap** via `work-on/scripts/bootstrap-worktree.sh fix-forms-label-wrap` → creates `../jetpack-fix-forms-label-wrap` on branch `change/fix-forms-label-wrap` off trunk, runs pnpm install, seeds `.work-on/`.
4. **Isolate Docker** via `tools/docker/bin/seed-worktree-env.sh` inside the worktree → writes `COMPOSE_PROJECT_NAME=jetpack_a1b2c3` and a free `PORT_*` set into `tools/docker/.env`; record `NAME=a1b2c3` and `WP_PORT=8080`.
5. `jp docker up -d` (no flags — `.env` supplies name and ports, and the DB auto-clones from `jetpack_dev`) → `jp docker install --name a1b2c3 --port 8080` (a no-op after a successful clone).
6. **Baseline screenshot** of the affected block at `http://localhost:8080/...` → `.work-on/screenshots/fix-forms-label-wrap-before.png`.
7. **Implement** the CSS fix.
8. `jp build packages/forms` → `jp test js packages/forms` → `jp phan packages/forms`.
9. **After screenshot** → compare to Figma reference.
10. `jp changelog add packages/forms -s patch -t fixed -e "Forms: Fix label wrap on mobile."`
11. Commit (`Forms: Fix label wrap on mobile`), push, open **draft** PR via `jetpack-pr` skill with before/after attachments + testing steps + Figma link.
12. `jp docker stop --name a1b2c3`. Worktree stays for review follow-ups.

## When to use
- Non-trivial features or bug fixes that land as their own PR.
- Changes where before/after screenshots matter.
- Work you want isolated from a running `jetpack_dev` container.

## When not to use
- One-line trivial fixes (overhead isn't worth it).
- Work that must mutate `jetpack_dev` state directly.
- Tasks that depend on a live WordPress.com connection / Jurassic Tube tunnel — tunnels are not set up by this skill.

## Relationship to the native worktree flows

Two mechanisms already cover parts of what this skill does. Know which one you're displacing before you start.

**`tools/docker/bin/seed-worktree-env.sh`** (repo-native, and the path `tools/docker/README.md` § "Parallel development environments" calls *recommended*). It seeds a worktree's `tools/docker/.env` with a unique `COMPOSE_PROJECT_NAME` and a free port set, after which a bare `jp docker up -d` is isolated. If all you want is an isolated environment, **use that script directly — it is smaller, documented, and maintained with the CLI.** This skill's value over it is everything around the environment: planning, quality gates, screenshots, changelog, and the draft PR.

**Phase 3 calls that script rather than reimplementing it.** This skill used to carry its own port allocator (`alloc-ports.sh`, deterministic bands passed as `--port*` flags); it was retired because the two allocators could not see each other. `seed-worktree-env.sh` reserves ports by reading other worktrees' `.env` files, and the old allocator never wrote one — so a `work-on` instance was invisible to it and it could hand out a port already in use. Their per-service bases disagreed too (phpMyAdmin `8281` vs `8282`, SFTP `1122` vs `2222`). Do not reintroduce a second allocator: if ports need changing, edit the worktree's `tools/docker/.env` or use the manual `--port*` flags documented in `tools/docker/README.md`.

**Harness-native worktree tools** (e.g. Claude Code's `EnterWorktree`). These create a worktree and switch into it, but do nothing about Docker. A worktree made that way has no seeded `tools/docker/.env`, so a bare `jp docker up` there silently re-points the shared `jetpack_dev` containers at it. If you use a harness worktree tool in this repo, run `seed-worktree-env.sh` inside the new worktree before any `jp docker` command.

## Modes

Ask the user up front which mode to run, unless they've specified:

1. **Full run** — plan → bootstrap → implement → verify → draft PR. Default.
2. **Bootstrap only** — plan + worktree + docker up, then stop and hand off. Useful when the human wants to drive implementation themselves.
3. **Implement only** — resume Phases 5–11 against an existing `/work-on` bootstrap (worktree present, docker already running). The skill finds `.work-on/env.json` inside the target worktree and reads the slug, instance name, and port map from it.

## Progress checkpoints (always run)

**At the end of every phase, record where you got to.** A coordinator (the centurion skill, or the user asking "what's in flight?") reads this file instead of interrupting the worker.

```bash
.agents/skills/work-on/scripts/checkpoint.sh \
  --phase 6 --name "Quality gates" \
  --action "jp test js packages/forms — 3 suites passed"
```

It writes `<worktree>/.work-on/status.json` atomically, carrying over any field you don't pass.

`bootstrap-worktree.sh` already seeds the first checkpoint (phase 3, `running`) as it creates the worktree, so a worktree always has a status file from the moment it exists — that's what lets a coordinator tell "never started" from "started and went quiet". Don't re-write it for the same phase; the next call you make should be the one after Docker is up.

Also call it — not only at phase boundaries — when:

- **You block.** `--blocker "phan fails twice on the same check"` (implies `state: blocked`). Do this *before* surfacing the question, so a poller sees the reason even if nobody is watching the chat.
- **You resume.** `--clear-blocker` returns the state to `running`.
- **The PR opens.** `--pr <url> --state done` in Phase 10.
- **You fail out.** `--state failed --action "<what broke>"` in Phase 11's failure path.

`status.json` and `env.json` are different files with different jobs — never merge them or write one from the other:

| | written | rewritten | describes | read by |
|---|---|---|---|---|
| `env.json` | once, Phase 3 | no | the session: slug, branch, instance, ports, references | Mode 3 resume |
| `status.json` | every phase boundary | yes | progress: phase, state, last action, blocker, PR | coordinators, the user |

## Preflight (always run)

0. **Confirm the user actually wants this flow.** If they named the skill, proceed. If you arrived here by inference, stop and offer it in one sentence (see "When to offer this skill"), naming the cost — a worktree, a pnpm install, and a multi-minute Docker bring-up. If they decline or don't answer clearly, work in the current checkout instead. Never spawn a worktree or a Docker instance on inference alone.
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
   - The proposed worktree already exists and its `tools/docker/.env` names a running compose project (`docker ps --filter name=<COMPOSE_PROJECT_NAME>`) → ask whether to reuse that instance, stop it, or pick a different slug.
6. **Fill in missing details** by asking the user, not by guessing: Linear/P2/Figma links, plugin scope, whether the change is visual. A self-explanatory PR needs these.

## Phase 0 — Parse the prompt

Extract:
- **Task slug** — kebab-case, ≤ 30 chars, safe as a branch suffix and worktree directory name (e.g. `fix-forms-label-wrap`). It is *not* the Docker instance name — see Phase 3.
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

From the **main checkout**, bootstrap the worktree:

```bash
WORKTREE=$(.agents/skills/work-on/scripts/bootstrap-worktree.sh <slug>)
# WORKTREE = /path/to/jetpack-<slug>, created on branch change/<slug> off origin/trunk
```

Then isolate the worktree's Docker using the **repo-native seeder** — this skill does not allocate ports itself:

```bash
cd "$WORKTREE"
tools/docker/bin/seed-worktree-env.sh
```

That writes a unique `COMPOSE_PROJECT_NAME` plus a free `PORT_*` set into the worktree's `tools/docker/.env`. It is host-only, idempotent, and a no-op in the primary checkout. It exits non-zero with an explanatory message if the name it would use is already claimed by another worktree — read the message rather than retrying.

Read the values back; every later `jp docker` subcommand needs them:

```bash
# Last occurrence wins and surrounding whitespace is ignored — matches how the
# seeder and `jp docker` themselves parse the file. Don't simplify to a bare grep:
# `.env` may carry hand-edited or duplicated keys.
read_env() {
  grep -E "^[[:space:]]*$1[[:space:]]*=" tools/docker/.env | tail -1 | cut -d= -f2- | tr -d '[:space:]'
}

INSTANCE=$(read_env COMPOSE_PROJECT_NAME)   # e.g. jetpack_a1b2c3
NAME=${INSTANCE#jetpack_}                   # value for --name
WP_PORT=$(read_env PORT_WORDPRESS)
```

> **`--name` is not the slug.** The seeder derives the instance name from git's worktree id, not from your task slug, so `NAME` is an opaque id. Record it in `.work-on/env.json` (below) — Mode 3 and every cleanup command read it from there.

Bring the instance up. Pass **no `--name` or `--port*` flags**: `up` is the one subcommand that reads `tools/docker/.env` (`shouldManageParallelEnv` in `tools/cli/commands/docker.js`), and flags that disagree with `.env` only produce conflict warnings.

```bash
jp docker up -d
```

Because `.env` supplies the name, the CLI treats this as a parallel instance and **auto-clones the database from `jetpack_dev`** when that instance is running — same content, users, and Jetpack connection, no separate install needed. If `jetpack_dev` isn't running the clone is skipped silently and you get the fresh-install flow, so follow up with:

```bash
jp docker install --name "$NAME" --port "$WP_PORT"
```

WordPress image pulls can take several minutes on a cold cache — if `jp docker install` fails with "WordPress install is incomplete! Perhaps it is still downloading?", wait ~30s and retry once before escalating.

Pass `--no-clone` to `up` to force a fresh install, or `--clone-from <name>` to seed from a specific instance instead of `jetpack_dev`. Note that `--clone-from` makes a missing source a hard error, where auto-clone degrades quietly.

**Every other `jp docker` subcommand needs `--name "$NAME"` explicitly** — `install`, `stop`, `clean`, and `phpunit` do not read `.env`, and without the flag they resolve to the primary `jetpack_dev` instance.

Write the full session record to `$WORKTREE/.work-on/env.json` using the schema below. Mode 3 (implement-only resume) reads this file — fields are mandatory.

## Phase 4 — Baseline screenshot (visual changes only)

Skip if Phase 0 classified the change as non-visual.

1. Some projects need a one-time `jp install <project>` before the first build. Run it if the project hasn't been built in this worktree before.
2. Build the affected project at the pre-change state (same commit as trunk, since no code has been written yet):
   ```
   jp build <project>
   ```
   The mounted volume means the running `$INSTANCE` container picks the new build up immediately.
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
| WP-integration plugin (jetpack / wpcomsh) | `jp docker phpunit <target> -- --name "$NAME"` — `$NAME` is the instance id from `.work-on/env.json`; without it the run hits `jetpack_dev`, not the worktree |
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

Record the PR as soon as it exists — this is the checkpoint a coordinator waits on:

```bash
.agents/skills/work-on/scripts/checkpoint.sh \
  --phase 10 --name "Commit & PR" --state done --pr "<pr-url>"
```

## Phase 11 — Cleanup

**On success:**

- `jp docker stop --name "$NAME"` — stops the containers and frees ports. DB, uploads, and `node_modules` remain on disk for review follow-ups. `$NAME` comes from `.work-on/env.json`; omitting it stops the user's primary `jetpack_dev` instead.

Do NOT run automatically — wait for PR merge or explicit user request:
- `jp docker clean --name "$NAME"` (destroys that instance's DB).
- `git worktree remove <path>` (removes the worktree + scratchpad, including its `tools/docker/.env`, which releases the seeded ports and instance name for reuse).

**On failure** (any phase errors out):

- Checkpoint the failure first, before anything else — it's the only record a coordinator gets:
  ```bash
  .agents/skills/work-on/scripts/checkpoint.sh --state failed --action "<what broke, one line>"
  ```
- Attempt `jp docker stop --name "$NAME"` so the named instance doesn't sit orphaned holding ports.
- Leave the worktree in place; the user may want to inspect the partial state.
- Tell the user exactly which phase failed, what the error was, and which of the two cleanup paths to use next.

**Report at the end** — always:
- PR URL (or "not opened" if we stopped earlier).
- Phase-by-phase status: pass / fail / skipped.
- Path to `.work-on/screenshots/` and `.work-on/console-*.log`.
- What was deferred for merge-time cleanup.

---

## `.work-on/env.json` schema

Written by Phase 3, read by Mode 3. Fields are required unless marked optional. Dates are ISO 8601 UTC. `instance`, `name`, and `ports` are copied verbatim from the worktree's `tools/docker/.env` after seeding — never invent them, and re-read `.env` if they ever disagree with it.

```json
{
  "slug": "fix-forms-label-wrap",
  "branch": "change/fix-forms-label-wrap",
  "worktree": "/Users/you/a8c/dev/jetpack-fix-forms-label-wrap",
  "project": "projects/packages/forms",
  "visual": true,
  "instance": "jetpack_a1b2c3",
  "name": "a1b2c3",
  "ports": {
    "wp": 8080,
    "phpmy": 8282,
    "inbox": 1180,
    "smtp": 2525,
    "sftp": 2222
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

## `.work-on/status.json` schema

Written by `checkpoint.sh` at every phase boundary; read by coordinators. Never hand-write it — the script's atomic temp-file-and-`mv` is what stops a poller reading half a file.

```json
{
  "slug": "fix-forms-label-wrap",
  "worktree": "/Users/you/a8c/dev/jetpack-fix-forms-label-wrap",
  "phase": 6,
  "phase_name": "Quality gates",
  "state": "running",
  "last_action": "jp test js packages/forms — 3 suites passed",
  "blocker": null,
  "pr": null,
  "updated": "2026-07-30T18:37:57Z"
}
```

`state` is one of `running`, `blocked`, `done`, `failed`. `blocker` is non-null only when `state` is `blocked`. `pr` is null until Phase 10 opens the draft.

## Port allocation

**This skill does not allocate ports.** `tools/docker/bin/seed-worktree-env.sh` owns that, and Phase 3 calls it — see "Relationship to the native worktree flows".

Main `jetpack_dev` uses: WP 80, phpMyAdmin 8181, Mailpit inbox 1080, Mailpit SMTP 25, SFTP 1022. The seeder allocates the first free value at or above a per-service base — WP `8080`, phpMyAdmin `8282`, inbox `1180`, SMTP `2525`, SFTP `2222` — so a first worktree usually lands exactly on those, and later ones step up from there. Values are persisted in the worktree's `tools/docker/.env` and stay stable across restarts.

The seeder reserves ports recorded in other worktrees' `.env` files, but does not probe for live-bound host ports and does not lock against two worktrees seeding at the same instant. A genuine clash surfaces as `address already in use` from `jp docker up` — edit the port in `tools/docker/.env` and retry, then update `.work-on/env.json` to match. See `tools/docker/README.md` § "Parallel development environments" for the authoritative rules.

## Docker instance tracking

Before creating a new instance:

```
docker ps -a --filter 'name=jetpack_' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

Instance names come from git's worktree id, so two live worktrees cannot collide by construction — and `seed-worktree-env.sh` refuses to seed a name another worktree has already claimed. What you're looking for here is an *orphan*: a container from a worktree that was removed without `jp docker clean`. Match names against `git worktree list`; anything unmatched is stale, and stopping or cleaning it is the user's call.

## When to pause and ask

Default is to act, but stop and ask when:
- Continuation is detected at preflight.
- The plan diverges from expectations during implementation.
- A gate fails twice on the same check (the 2-cycle limit).
- `seed-worktree-env.sh` exits non-zero, or `jp docker up` reports `address already in use`.
- The task turns out to need a live WordPress.com connection.
- The inferred slug, project, or scope feels wrong or thin.

Keep each prompt short: one question, give defaults, proceed on the answer.

## Success signals

The skill completed successfully if all of these hold:

- `git branch --show-current` (inside the worktree) equals `change/<slug>`.
- `git log origin/trunk..HEAD` is non-empty and every commit message is imperative, present-tense, and does NOT contain `Co-Authored-By: Claude` or `Generated with Claude Code`.
- `gh pr view --json isDraft,state,body` returns `{"isDraft":true,"state":"OPEN"}` and the body contains a "Testing instructions" section.
- `docker ps --filter name="$INSTANCE"` lists **no running container** (Phase 11 immediate stop was honored).
- `git worktree list | grep jetpack-<slug>` still shows the worktree present (deferred cleanup).
- If the change was visual: `.work-on/screenshots/<slug>-before.png` and `<slug>-after.png` both exist and are >4 KB.
- If any file under `projects/` changed: a new entry exists in that project's `changelog/` directory.
- `.work-on/env.json` is valid JSON and round-trips through `jq` without error.
- `.work-on/status.json` exists, is valid JSON, and its `state` is `done` with a non-null `pr`.

Use these as the "definition of done" when you report back to the user — mention any that didn't hold.

## Related skills
- `.agents/skills/jetpack-changelog.md` — Phase 8.
- `.agents/skills/jetpack-pr.md` — Phase 10.
- `.agents/skills/jetpack-review-pr.md` — run before requesting a human reviewer.

## Scripts
- `work-on/scripts/bootstrap-worktree.sh` — worktree + pnpm install + scratchpad.
- `work-on/scripts/checkpoint.sh` — atomic phase-boundary write to `.work-on/status.json`.

Port and instance-name allocation is **not** a script of this skill's — Phase 3 calls `tools/docker/bin/seed-worktree-env.sh`, which ships with the Docker CLI.

## Known limitations / future extensions
- `/implement <slug>` — companion skill that assumes a prior `/work-on` bootstrap (picks up from Phase 5 using `.work-on/env.json`). Not yet implemented.
- Merge-time cleanup hook that removes the worktree + cleans Docker data once the PR merges.
- First-class Jurassic Tube / wp.com-connected flows.
