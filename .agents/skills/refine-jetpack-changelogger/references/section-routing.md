# Section routing — promote/demote between sections

This file covers **which `### Section` a bullet belongs in**. Routing is **publishing-pipeline gating**, not stylistic taste. The same bullet text can be correct under `### Enhancements` for one release and correct under `### Other changes` for another — section choice determines whether the entry reaches the public WP.org plugin page.

Applies to `projects/plugins/jetpack/CHANGELOG.md` primarily. Package CHANGELOGs use Keep a Changelog sections (`Added`/`Changed`/`Removed`/`Fixed`) and aren't gated against readme.txt.

## Why `### Other changes` matters

`tools/plugin-changelog-to-readme.sh` regenerates `projects/plugins/jetpack/readme.txt` from `CHANGELOG.md` and **filters out** `### Other changes`. The filter works by regex-matching the section's HTML comment (`<!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->`).

The decision rule: **if this entry would mislead or confuse a Jetpack admin reading the WP.org plugin page, demote to `### Other changes`.**

## The routing table

| Move | When to apply | Example bullet |
|---|---|---|
| `Enhancements` → `Other changes` | API-only / dev-only / SDK-only entries that ship no user-visible change. | `REST API: Add big_sky_enabled field to the site endpoint response.` |
| `Enhancements` → `Other changes` | Feature is introduced AND will be disabled before public release (net-zero user impact). | `Block Notes: Add Block Notes as a standalone Jetpack extension plugin.` (later disabled by hotfix). |
| `Major Enhancements` → `Other changes` | Entry is an opt-out for a previously-opt-in feature — net user impact is a disable, not a new capability. | `AI Assistant: Disable the Write Brief (Breve) proofreading feature by default.` |
| `Bug fixes` → `Improved compatibility` | Fix is compat hardening rather than a user-visible bug. | `Comments: Remove resource hints for outdated gravatar domains and use secure.gravatar.com instead.` |
| `Other changes` → `Improved compatibility` | Entry is a compat-related update that should reach readme.txt. | `Update purchases endpoint from v1.1 /sites/$site/purchases to v1.2 /upgrades?site=$site.` |
| `Bug fixes` → `Other changes` | Fix is non-user-facing infra (and may need its category prefix dropped — see `changelog-style.md § Prefixes`). | `Comment: Improve author Gravatar URLs…` → `Improve author Gravatar URLs…` |

**Always surface these moves as candidates.** Propose the demote/promote, let the editor accept or reject each.

The "infra-only / flag-only / package-registration" routing in `SKILL.md` step 4 covers the simplest case (no user-visible effect → `Other changes`). The table above expands that for more nuanced moves.

## Net-zero impact demotion

If a feature is introduced AND temporarily disabled in the same release, BOTH bullets route to `### Other changes`.

The hotfix entry that disabled the feature also goes to `### Other changes`, **not** `### Bug fixes`. Routing to Bug fixes would surface a bug to WP.org users who never experienced the bug; routing to Other changes hides it.

Strict where it applies.

## Security framing — select neutral wording from contributor snippets

When the same PR contributed **multiple changelog snippets** (e.g. one in the Jetpack plugin's `changelog/`, one in a sub-package's `changelog/`), and the wordings have different framings (one using vulnerability vocabulary, one using neutral user-facing language), **select the more neutral form at write time**. This is a selection decision, not a rewrite.

Example: a PR that contributes both `Newsletter Email Status: Fix IDOR vulnerability by adding per-post access control to the newsletter email sent status endpoint.` AND `Newsletter Email Status: Fix access control for the newsletter email sent status endpoint.` should publish as something close to `Newsletter Email Status: Add per-post access control to the newsletter email sent status endpoint.` — the neutral framing, not the IDOR framing.

**Do NOT auto-rewrite vulnerability vocabulary** when only one snippet exists. The skill MAY surface a candidate edit and ask for human confirmation.

Reasoning: a public-facing `readme.txt` with vulnerability vocabulary advertises an exploit vector. When the contributor offers both wordings, pick the one that does not advertise.

## Drop entries that document a recently-introduced internal regression

When an entry "fixes" a feature still being introduced in the same release (no shipped build ever had the bug), drop the entry. The companion feature-introduction entry remains. Conditional — applies when the feature-introduction entry is in the same section. Most commonly seen in alpha-cycle polish.

## Drop entries that describe internal toggle / UI state for a feature already covered elsewhere

When the entry adds dev-internal commentary about a feature already described by a separate user-facing entry, drop the dev-internal entry. Surface for human review.

## Drop or demote verbose menu-rename / internal-rebrand entries

When the entry only describes label/menu reshuffles without a user-visible behaviour change, consider demoting to `### Other changes` or dropping entirely. Weak rule — surface for human review rather than auto-drop.

## Strip botched-release explanatory prose after release ships

Free-form paragraphs (not bullets) that explain a transient beta issue get added at stable-cut time under the prerelease header, then **removed in a post-release editorial commit** once the stable squash collapses the bad cycle.

**Do NOT auto-add or auto-remove these notes.** They require human judgement about cycle context. If the skill spots free-form prose orphaned under a stable header (i.e. not a bullet, not a `### Section` header, not the `### This is a list…` blurb), surface it for human review.

## Wrapper entries cannot be polished — they must be unpacked or relocated

Entries that hide the real change behind a meta-label cannot be polished. They must be unpacked into the real user-facing change(s), or relocated to `### Other changes` if truly non-user-facing.

Common wrapper patterns:

- `Address P1/P2/P3 review feedback`
- `Sync with main`
- `Various fixes` / `Various changes` / `Various updates`
- `Misc fixes` / `Miscellaneous changes`

Surface these for human review — don't auto-unpack, since the real user-facing change has to be reconstructed from the PR body.

## The HTML comment marker is load-bearing

The marker `<!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->` is matched literally by `tools/plugin-changelog-to-readme.sh:94`. If the editor alters or removes the comment, the regenerator stops filtering and the `Other changes` section gets published to WP.org.

**Never touch this string** while making bullet-level changes around it.
