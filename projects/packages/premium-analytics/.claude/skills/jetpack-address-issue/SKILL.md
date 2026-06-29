---
name: jetpack-address-issue
description: >
  Address a Linear or GitHub issue end-to-end — research, implement, build, test in the local dev
  env with before/after screenshots, open a PR with a "Why" section, then start the review feedback
  loop. Use when the user says "open a PR to address an issue", "address <issue>", or
  "/jetpack-address-issue". Args: <issue-id-or-url> (prompts if omitted).
---

Address the issue given by the provided args end-to-end and ship a PR.

Trigger phrases: "open a PR to address an issue", "address <issue>", or `/jetpack-address-issue <issue>`.

This skill **extends** `/jetpack-pr` — it does not replace it. All existing PR requirements (changelog entry, PR template, labels, push to remote, no AI attribution) still apply. The steps below add the issue-driven workflow on top.

If no issue ID/URL was provided as args, ask the user once for the issue ID/URL, then proceed.

**Autonomy:** once started, run end-to-end without per-step confirmation. You are cleared to commit, push to remote, open the PR, and hand off to the review loop within the scope of this skill. Only stop to ask the user when (a) the issue itself is ambiguous about intent, (b) a meaningfully different approach surfaces during research (per step 2), (c) research invalidates the issue — bug doesn't reproduce, fix already shipped, request conflicts with current direction (per step 2), (d) a step 4 build or step 5 env failure persists after one retry, or (e) you hit any other blocker you genuinely cannot resolve. "I'm about to push" or "I'm about to open the PR" are not reasons to interrupt.

## Steps

1. **Read the issue.**
   - Linear (e.g. `RSM-2277` or `https://linear.app/a8c/issue/...`): fetch the issue via the Linear API key at `~/.linear-api-key` (or the `context-a8c` MCP provider). Pull title, description, comments, project, acceptance criteria.
   - GitHub (e.g. `#1234` or a `github.com/...` URL): `gh issue view <num> --json title,body,comments,labels,assignees`.
   - **Follow cross-links.** If the issue references a counterpart in the other system (Linear → GitHub or vice versa), read both — context, AC, or prior discussion often lives on only one side.
   - Capture the issue's acceptance criteria verbatim — they become both the implementation checklist (step 6) and the Testing instructions section in the PR (step 7).

2. **Research the best solution.**
   - Read every file the issue names; use the `Explore` subagent for any cross-file investigation (existing patterns, conventions, similar prior PRs).
   - If the issue proposes an approach, validate it against the actual code — don't follow blindly. If a meaningfully different approach surfaces, raise it with the user before implementing (autonomy stop condition (b)).
   - **Exit early if research invalidates the issue:** the bug doesn't reproduce on trunk, the fix has already shipped in a recent commit, or the request conflicts with current code/product direction. Report findings — do not create a branch or open a PR (autonomy stop condition (c)).
   - **Plan mode is the one approved interruption** for non-trivial changes (3+ steps or architectural decisions): enter plan mode, get the plan approved, then resume autonomous execution from step 3.

3. **Branch and implement.**
   - Branch: `<agent>/<issue-id-lowercased>-<short-slug>` (agent auto-detected from pwd, e.g. `atlas/rsm-2277-results-panel-block`).
   - **If the branch already exists**: locally → check it out and continue (resumed work); only on remote → fetch and check out (pick up a prior failed attempt); both exist and have diverged → escalate, don't pick a side.
   - **Mark the issue in progress.** GitHub: `gh issue edit <num> --add-assignee @me`. Linear: move to "In Progress" via the API at `~/.linear-api-key`. Skip silently on permission errors — this is hygiene, not a blocker.
   - Implement. Add a changelog entry under the touched project's `changelog/` directory (run `/jetpack-changelog` if needed).
   - Clean commits, no AI attribution.

4. **Build the affected project.**
   - Invoke the `jetpack-build-matrix` skill (full matrix — `jp build --deps` alone is **not** sufficient for E2E; see that skill).
   - Skip only when the change is purely docs / `.claude` config / tooling that needs no build.
   - **On build failure**: read the actual error, fix what's diagnosable (lockfile drift, missing dep), retry once. Escalate on persistent failure — don't loop indefinitely.

5. **Bring up the local dev env.**
   - Invoke the `jetpack-dev-env` skill (auto-detects the agent from pwd) to start docker + the Jurassic Tube tunnel.
   - Admin creds: `wordpress` / `<DEV_ADMIN_PASS>` (set by the dev-env skill).
   - **Reachability check is HTTP 200 on `/` AND `/wp-admin/`** — a live tunnel that returns 5xx does not count as "up." Don't proceed to step 6 until both URLs return 200.
   - **If WP returns 5xx**: tail the debug log and list active plugins to find the offender:
     ```bash
     docker exec jetpack_<agent>-wordpress-1 tail -50 /var/www/html/wp-content/debug.log
     docker exec jetpack_<agent>-wordpress-1 wp plugin list --status=active --skip-plugins --allow-root
     ```
     The usual cause is another source-mounted active plugin lacking a build (jetpack, jetpack-search, etc.). Build the offending plugin via `jetpack-build-matrix`, or deactivate it via `wp plugin deactivate <slug> --allow-root` if it's outside this PR's scope. One retry; persistent 5xx is a step-5 stop condition.

6. **Test in the browser thoroughly, then capture screenshots if user-visible.**
   - Decide first: does this change anything a user sees (UI, editor, front-end markup, admin screens, emails, block output)? If purely backend/internal, **skip screenshots** and note "no user-visible change" in the PR's testing instructions — but still exercise the change end-to-end via REST/CLI/wp-cli where applicable.
   - **For API changes** (REST endpoint added/changed, response shape changed, new wp-cli command, etc.): capture the actual request and response payload from the live env (curl against the JT tunnel, or `wp` inside the container). Save the raw JSON/output verbatim — it goes into the PR body in step 7 as evidence, wrapped in `<details>`.
   - For user-visible changes, **drive the actual feature** with the chrome MCP browser tooling against `https://jp-<agent>.jurassic.tube/` (or `localhost:<port>`):
     - Cover the **golden path** the issue describes.
     - Cover **edge cases** that fall out of the change — empty state, error state, the inverse condition, interaction with adjacent features the change touches. Don't stop at "the page rendered."
     - Type-checks and unit tests verify code correctness, not feature correctness. If the UI isn't actually exercisable for some reason, say so explicitly in the PR rather than claiming success.
   - **Bug-fix loop (autonomous, no check-ins):** if testing surfaces a bug — the original one isn't gone, a regression appeared, or an edge case is broken — fix it, rebuild the affected layer (re-run step 4 if needed), then re-test the full set above. Loop until every case passes. Do not pause to report "found a bug, fixing" mid-loop; just fix and re-verify. **If the loop expands scope** (more files touched, broader behavior than the original intent), update the changelog entry to reflect what actually shipped. Only escalate if a fix requires a meaningfully different approach than what was planned in step 2.
   - Once everything passes, invoke the `jetpack-screenshot-local` skill to capture **before/after** screenshots via the JT tunnel and publish them to `refs/heads/screenshots/<branch>` so they render inline in the PR body.

7. **Open the PR via `/jetpack-pr` — with a "Why" section.**
   - Run the `/jetpack-pr` flow (changelog check, push, template, labels, `--body-file` via `mktemp`).
   - **Preserve every section `.github/PULL_REQUEST_TEMPLATE.md` requires** (Privacy, Related, Testing instructions, etc.). The custom sections below are *prepended* to the template, not a replacement. Never blank out a template section.
   - **Populate the template's Testing instructions section with the issue's acceptance criteria from step 1**, verbatim, as a checklist. Reviewers should be able to verify the fix by working through that list against the Screenshots / API changes / Verification evidence.
   - Body structure (prepended above the existing template):

   ````markdown
   Fixes <issue-link>

   ## Why
   <1–3 sentences in plain language: what the user couldn't do before, what they can do now, why it matters. Avoid implementation jargon.>

   ## Proposed changes
   <bullets of functional changes>

   ## Screenshots
   ### Before
   ![before](https://raw.githubusercontent.com/<owner>/<repo>/screenshots/<branch>/before.png)
   ### After
   ![after](https://raw.githubusercontent.com/<owner>/<repo>/screenshots/<branch>/after.png)

   ## API changes
   <One-line summary of what changed at the API surface.>

   <details>
   <summary>Request</summary>

   ```http
   GET /wp-json/jetpack/v4/<endpoint>
   ```

   </details>

   <details>
   <summary>Response</summary>

   ```json
   { "...": "..." }
   ```

   </details>

   ## Verification
   <One-line summary of how a non-UI / non-API change was exercised — e.g. "Triggered cron handler manually and confirmed sync queue drained.">

   <details>
   <summary>Output</summary>

   ```text
   $ wp jetpack sync status
   ...
   ```

   </details>

   <PR template content (Related, Privacy, Testing instructions populated with AC, etc.) follows unchanged>
   ````

   - Omit any of Screenshots / API changes / Verification when the change doesn't touch that surface. Don't leave placeholder sections.
   - **At least one of Screenshots / API changes / Verification must be present** — every PR ships *some* evidence the change was exercised. The only exception is pure-docs / pure-tooling PRs where the diff itself is the evidence.

8. **Start the review feedback loop.**
   - Immediately after `gh pr create` returns the PR URL, invoke the `jetpack-pr-review-cycle` skill with the new PR number.
   - That skill is autonomous once started (per saved feedback) — do not pause for per-step confirmation on its commit/push/comment/resolve actions.

## Final output

When the initial pass is done and the review loop has been handed off, print:
- The PR URL
- The screenshot branch URL (if any)
- One sentence noting that `jetpack-pr-review-cycle` is now running in the background

Nothing else — no recap of what was done, the diff and PR body already document it.
