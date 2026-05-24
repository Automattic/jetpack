---
name: refine-jetpack-changelogger
description: Refine, scope, and reorder Jetpack monorepo changelog entries during a release. Use when the release script pauses at the changelog review step, when applying reviewer feedback on changelog wording or ordering, or when polishing per-PR changelog snippets before `changelogger write`.
---

# Refine Jetpack Changelogger

## When to use this skill

- The `tools/release-plugin.sh` script is paused at `Step 1: do_changelogs`.
- A reviewer left inline comments on a prerelease PR's `CHANGELOG.md` files.
- You are polishing per-PR `changelog/` snippet files before they get written.

Operate on the current Jetpack repo checkout (CWD / `git rev-parse --show-toplevel`). Use host `git`/`gh` for inspection and commits; `gh` is NOT available inside the `jp` container.

## Scope rule (load-bearing)

- Touch only the **newest release block** in each generated `CHANGELOG.md`, unless the user explicitly widens scope.
- Preserve historical entries verbatim.
- Preserve unrelated working-tree changes.
- For commits: keep **sort-only** and **wording-only** changes in separate commits when both are needed, so the reviewer can verify the wording commit didn't accidentally re-order anything.
- **Surface, don't auto-rewrite.** Where a rule is conditional, ambiguous, or requires PR-body knowledge to apply faithfully, surface the candidate edit for human confirmation rather than auto-applying.

## Input sources and trust hierarchy

When applying any rule, the skill has these inputs available. Earlier sources override later when they disagree:

1. **The contributor's changelog entry text** — either the `changelog/<file>` snippet (pre-write mode) or the bullet in the newest release block of the aggregated `CHANGELOG.md` (post-write mode). This is the contract — the contributor's chosen wording guides every edit.
2. **The squash-commit SUBJECT line** — concise and accurate; useful when the entry is ambiguous or when re-prefixing. Retrieve with `git log --all --grep '(#NN)$'`.
3. **The squash-commit BODY** — verbose; can contain internal language ("IDOR", internal P2 references) that must NOT leak to the changelog. Use cautiously, mostly to disambiguate intent.
4. **The current `CHANGELOG.md`** — for tone calibration against neighbouring entries.
Most prose rules need only #1. PR-body inference (e.g. naming platforms in a refactor-internal rewrite) needs #3 and should be surfaced as a candidate, not auto-applied.

## Identify the cycle FIRST

The bullet-level work differs sharply between alpha polish, beta polish, stable squash, point release, and post-release editorial. Before applying any rule below, identify the cycle from the version string the script will write (or the squash-commit subject) and apply the cycle-specific bullet behaviour from `references/cycle-aware.md`.

Quick identification:

| Pattern | Cycle |
|---|---|
| `## X.Y-a.N` header | Alpha backport |
| `## X.Y-beta` header | Beta backport |
| `## X.Y` header from a stable squash | Stable backport — see cycle-aware.md |
| `## X.Y.Z` header (third number) | Point release |
| Editing an already-published `## X.Y` block on trunk | Post-release editorial |

Stable squashes are an opportunity for thorough polish. Apply the full rewrite catalogue (sentence-case after colon, drop verbose tails, normalize prefixes, backtick code references, merge same-PR bullets, consolidate dep updates) as candidate edits — the editor accepts or rejects each per `SKILL.md § Scope rule` ("Surface, don't auto-rewrite"). No upfront mode declaration is required.

## Entry point 1 — During the release-script changelog pause

Run from the repo root to see what's been touched:

```bash
git status --short --branch
git diff --name-only -- '**/CHANGELOG.md'
```

Then, for each touched changelog:

1. **Read the latest release block only.** Identify the cycle type (see "Identify the cycle FIRST" above) and apply the cycle-specific behaviour from `references/cycle-aware.md`:
   - Alpha/beta backports: apply prose polish to every bullet; apply structural rules (same-PR multi-bullet selection, `Update package dependencies` consolidation); apply section routing. No dedup step — the release script ran on the release branch with only cherry-picked snippets, so there is nothing duplicate to remove.
   - Stable squash: surface the full rewrite catalogue from `cycle-aware.md` and `changelog-style.md` as candidate edits — recategorize, merge same-PR bullets, consolidate `Update package dependencies`, rewrite bullets per `§ Rewrite individual bullet text during stable squash`. The editor accepts or rejects each.
   - Point release: copy bullet wording verbatim from the snippet; do not polish.
   - Post-release editorial: silently surgical — delete/demote/add bullets; never rewrite neighbouring entries.
2. Flatten any nested bullets and unpack wrapper entries like `Address P1/P2/P3 review feedback` into the real user-facing change(s) (see `references/changelog-style.md § Anti-patterns`).
3. Apply prefix and wording rules (`references/changelog-style.md`). Run same-PR multi-bullet selection and `Update package dependencies` consolidation BEFORE prose rewrites.
4. Route bullets between sections per `references/section-routing.md`. Infra-only / flag-only / package-registration / API-only entries demote to `### Other changes`. Net-zero-impact entries (introduced and disabled in the same release) demote to `### Other changes`. Surface nuanced moves (Bug fixes → Improved compatibility, etc.) as candidates.
5. **Do NOT manually re-sort after a wording edit.** The script sorted on the pre-edit text at write time. If the visible order looks wrong after your wording edits, plan a separate sort-only commit — never reorder mid-wording-pass.
6. If `projects/plugins/jetpack/CHANGELOG.md` was edited, run `tools/plugin-changelog-to-readme.sh jetpack`. The Other-changes filter relies on a literal HTML comment marker — see `references/changelogger-workflow.md § Jetpack plugin readme regeneration`. Never touch that marker while editing.
7. Check both Jetpack and `mu-wpcom-plugin` changelogs — `tools/release-plugin.sh jetpack` writes both.
8. Press Enter to resume the release script.

## Entry point 2 — Reviewer feedback on a prerelease PR

```bash
gh api repos/Automattic/jetpack/pulls/<PR>/comments \
  --jq '.[] | {user: .user.login, path, line: (.line // .original_line), body, diff_hunk}'
# Filter to one reviewer by appending: | select(.user == "<LOGIN>")
```

- Treat each `suggestion` block as a proposal, not authoritative text. Fix grammar/typos in the suggestion before applying.
- **Apply the principle, not just the marked lines.** If a reviewer flags one entry as too verbose, scan the same release block for other verbose entries and trim those proactively.
- Keep sort fixes and wording fixes as separate commits.
- If a commit fails with `ERR_PNPM_UNSUPPORTED_ENGINE`, run it with a Node version matching `package.json#engines` (use `nvm use` or a matching `PATH`).

## Entry point 3 — Pre-write snippet polish

```bash
git status --short -- '*/changelog/'
```

- Edit snippet bodies, not generated `CHANGELOG.md`. Changelogger sorts by final wording at `write` time, so polishing snippets avoids a post-write resort commit.
- Keep each snippet a short user-facing fragment that completes "This PR will …".
- Use a component/topic prefix in `projects/plugins/jetpack/changelog/` entries (e.g. `VideoPress:`, `Scan Admin:`). Inside a package's own `changelog/`, drop redundant package prefixes.
- Strip trailing whitespace and stray quote marks before they reach `changelogger write`.

## Multi-CHANGELOG handling

A single Jetpack release touches many `CHANGELOG.md` files: the Jetpack plugin itself, dozens of packages, the `mu-wpcom-plugin`, plus per-PR `changelog/` snippet files. Rules adapt to file type:

| File | Routing notes |
|---|---|
| `projects/plugins/jetpack/CHANGELOG.md` | Uses `Enhancements` / `Improved compatibility` / `Bug fixes` / `Other changes`. `### Other changes` is filtered out of readme.txt. All `section-routing.md` rules apply primarily here. |
| Package CHANGELOGs (`projects/packages/*/CHANGELOG.md`, `projects/js-packages/*/CHANGELOG.md`) | Uses Keep a Changelog sections (`Added` / `Changed` / `Removed` / `Fixed`). No readme.txt gate. Inside a package's own CHANGELOG, drop the redundant package prefix (e.g. drop `Podcast:` inside `projects/packages/podcast/CHANGELOG.md`). |
| Per-PR snippet files (`*/changelog/<file>`) | Pre-write polish (Entry point 3) edits these. Inside a package's snippet dir, drop the package's own prefix. |

Section names per file type are determined automatically by each project's `composer.json` `Config::types()`. The skill's job is to apply type-aware bullet rules: `section-routing.md` routing applies primarily inside the Jetpack plugin CHANGELOG, not in package CHANGELOGs.

## Verification

- `git diff --check`
- `tools/plugin-changelog-to-readme.sh jetpack` if the Jetpack plugin changelog was touched
- `tools/changelogger-validate-all.sh`
- Confirm the Jetpack checkout state is what you expect: `git status --short --branch`

## References

- `references/cycle-aware.md` — per-cycle bullet behaviour (alpha / beta / stable / point release / post-release editorial).
- `references/section-routing.md` — demote/promote between `Enhancements` / `Improved compatibility` / `Bug fixes` / `Other changes`. Net-zero demotion, security framing, wrapper detection. Why the Other-changes HTML comment is load-bearing.
- `references/changelog-style.md` — wording rules, prefix conventions, identifier backticking, abbreviation policy, prose rewrites, formatting and punctuation, anti-patterns, and guardrails (what the editor does NOT do).
- `references/changelogger-workflow.md` — release commands, sort internals, readme regeneration with the load-bearing HTML comment, dep-update consolidation source, mu-wpcom-plugin note.
