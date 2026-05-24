# Cycle-aware bullet behaviour

Each Jetpack release cycle type has its own bullet-level rules. The skill MUST identify cycle type before applying any other rule — the bullet-level work differs sharply between alpha polish, beta polish, stable squash, point release, and post-release editorial.

Header/version/date/section-structure mechanics for each cycle are handled by automation (`tools/release-plugin.sh`, `tools/changelogger-release.sh`, `changelogger write/squash`). This file covers only the bullet-level decisions the editor makes after the automation has run.

## Identifying the cycle

The cycle is determined by the version string the script (or the editor) is about to write into the `## <version>` header. The skill can derive this from the squash-commit subject or from the `--use-version` / `--prerelease` flags the script passed.

| Subject pattern | Cycle type |
|---|---|
| `Backport jetpack X.Y-a.N changes` | Alpha backport |
| `Backport jetpack X.Y-beta changes` | Beta backport |
| `Backport Jetpack X.Y` / `Backporting stable X.Y` | Stable backport |
| Subject mentions `X.Y.Z` (with a third number) | Point release |
| `Update changelog`, `Squash changelog`, `Remove changelog line`, edits after a stable cut | Post-release editorial |

The header date is automation's job (`--release-date` default or override) — don't think about dates as a bullet-level decision.

## Alpha backport

The release script runs on the release branch (`jetpack/branch-X.Y`) with only the cherry-picked snippets present in `changelog/`. It generates a clean new `## X.Y-a.N` section from those snippets. The skill picks up at the editorial-review step:

1. Run prose polish (`changelog-style.md`) on every bullet — sentence-case after `:` prefix, imperative voice, strip `by <implementation>` tails, backtick code identifiers, terminal periods, etc.
2. Run structural-bullet rules — same-PR multi-bullet selection, `Update package dependencies` consolidation.
3. Apply section routing per `section-routing.md` — demote API-only/infra-only entries to `### Other changes`.
4. Respect the guardrails in `changelog-style.md § Guardrails` (don't normalize prefixes, don't fabricate PR refs, etc.).

**Note — there is no "drop entries that shipped elsewhere" step.** The cherry-pick decision for which PRs go into this alpha happens BEFORE the changelogger runs, at the release-manager level. By the time the skill sees a generated section, the curation is already done.

The polish bar on alpha is high.

## Beta backport

Same flow as alpha. Same polish bar.

## Stable backport

The stable cut collapses alphas + beta into a single `## X.Y` block. The header rewrite, section-structure flattening, and alphabetization are automation's job. The bullet-level work that remains:

1. **Selectively recategorize entries** between `### Enhancements`, `### Bug fixes`, `### Improved compatibility`, and `### Other changes`. See `section-routing.md` for the routing patterns.
2. **Rewrite individual bullet text** for clarity, brevity, polish. The full rewrite catalogue (sentence-case after colon, drop verbose tails, normalize prefixes, backtick code references, etc.) lives in `changelog-style.md § Rewrite individual bullet text during stable squash`.
3. **Drop or merge entries that share a PR reference.** Consolidate same-intent bullets per the same-PR multi-bullet selection rules.
4. **Consolidate `Update package dependencies` lines.** Multiple `Update package dependencies.` entries collapse to one with all PR refs space-joined.

**Apply all four passes by default — surface each rewrite as a candidate edit for human confirmation rather than auto-applying.** The skill's stance is "surface, don't auto-rewrite" (see `SKILL.md § Scope rule`). The editor accepts or rejects each candidate per release; the skill does not require an upfront mode declaration.

The `Do NOT re-edit text from a prior-released "## X.Y-1" section` rule (see `changelog-style.md § Guardrails`) applies cleanly only to **prior** (`## X.Y-1`, `## X.Y-2`) sections — the current cycle's own `## X.Y-a.*` sections are fair game for polish during the squash.

## Point release

Point releases (`## X.Y.Z`, e.g. `15.3.1`, `15.7.1`) run from the existing `jetpack/branch-X.Y` release branch, not from trunk. The release branch's `changelog/` directory typically contains one PR snippet cherry-picked with the fix; `changelogger write --use-version=X.Y.Z` generates the `## X.Y.Z` block.

Bullet-level rules:

- **Bullet wording is copied verbatim from the snippet body** when a snippet exists. Do NOT polish — the snippet wording wins, even if it lacks a trailing period or a `[#NN]` reference.
- If `changelog/` is empty for the plugin but a sub-package has a relevant snippet (e.g. `projects/packages/forms/changelog/<file>`), copy that bullet verbatim. Do NOT invent wording from the PR body.

**Do NOT auto-rewrite vulnerability vocabulary for point releases.** See `section-routing.md § Security framing`.

## Post-release editorial

A commit landing on trunk **after the stable cut**, to align the published changelog with what actually shipped. Tight window — same-day or one-day-later. Two observed sub-triggers:

1. **Hotfix landed between stable cut and public release.** The hotfix's user-facing companion (the feature it disabled) gets **demoted to `### Other changes`**, and the hotfix bullet is **added to `### Other changes`** (NOT `### Bug fixes`). Both choices hide the entries from `readme.txt` because users never experienced either the feature or the bug.
2. **Same-day cleanup of botched-cycle prose.** Free-form paragraphs (not bullets) that explained a transient bad beta get removed once the stable squash absorbs the bad cycle.

**Strict non-edit signal for post-release editorial: preserve surviving entries' wording verbatim.** Do NOT polish neighbouring bullets while editing. The post-release commit is silently surgical: delete, demote, or add bullets; never rewrite.

Date-bump (e.g. `04-07` → `04-08`) is automation's job — don't think about it.

## Cross-cycle reminder

After applying any bullet-level rule, double-check that the rule was scoped to the **current** release block. Touching prior `## X.Y-1` sections above the current cut is the strongest non-edit guardrail (see `changelog-style.md § Anti-patterns`).
