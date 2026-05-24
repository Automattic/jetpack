# Jetpack Changelog Style

Bullet-level style for `CHANGELOG.md` entries. Applies during alpha/beta polish, reviewer feedback, and (selectively) stable squash. Does NOT apply to prior-released sections (see § Anti-patterns) or post-release editorial commits (see `cycle-aware.md § Post-release editorial`).

## Core rules

- Write for users and third-party developers, not for implementers.
- Use concise sentence fragments in imperative or bare-infinitive form: `Add`, `Fix`, `Improve`, `Refresh`. Convert past tense (`Removed`, `Fixed`), third-person singular (`Fixes`, `Adds`), and gerund forms (`Adding`, `Moving`) to imperative. Applies wherever the verb leads the body — immediately after `Prefix:` or at the start of an unprefixed bullet.
- Prefer US spelling: `behavior`, not `behaviour`.
- Quote literal UI labels with **double quotes**: `"Add new video"`, `"all subscribers"`, `"Send newsletter by default"`. Preserve **single quotes** when wrapping programming data values: `Add 'note' to the default whitelisted comment types` keeps single quotes because `'note'` is a `comment_type` field value, not a UI button label. Heuristic: "could a user see this string?" → double quotes; "is this a code/config value?" → leave single quotes.
- Use full proper names: `WordPress.com` (not `wpcom`), `WP Admin` (not `wp-admin`).
- Avoid long parentheticals and implementation detail. Put mechanism in commit messages, not changelogs.
- Merge near-duplicates, especially repeated dependency updates or same-feature option additions.
- **Do not reword settled prose — load-bearing.** If the contributor's wording is grammatical, accurate, has a sensible prefix, and conveys the user-facing change, **leave it alone**. Do not propose rewrites for any of these reasons:
  - "Tighter phrasing" / "more concise" / "more natural cadence" — long but clear sentences stay long.
  - "Match the cadence of neighbouring bullets" — neighbouring inconsistency is fine; the editor does not normalize across bullets unless the rulebook explicitly says to (e.g. coordinate-parallel-entries from related PRs).
  - "Punchier verb" — `Update`, `Improve`, `Add`, `Fix` are all acceptable lead verbs; do not substitute one for another for stylistic preference.
  - "Match an example in the style guide more closely" — the style guide's examples are illustrative, not normative templates. If a bullet doesn't exactly match an example but reads cleanly, leave it.
- **Default to the named rules below**, but surface a candidate rewrite when the bullet contains **codebase-internal shorthand that a public-changelog reader wouldn't understand**, even if no named rule fires. Triggers:
  - Commit-message glyphs used as English conjunctions or separators in prose: `+`, `&`, `→`, `~`, `/`. Example: `register sitemaps reads + rebuild dispatch` → `register sitemaps reads and rebuild dispatch`. Exceptions: keep when the token is part of a literal label (`Save & Continue`, `and/or`), a menu path (`Settings => Sharing`), or a code identifier.
  - Internal ticket IDs leaking into the bullet (e.g. `P1-1234`, `JIRA-5678`).
  - Code-only tokens used as English nouns when an English noun exists (e.g. `the publicize_module flag` when the bullet could say `the Publicize module flag`).
  - Acronyms outside the allowlist (see § Abbreviations) used without being introduced — surface for human confirmation, don't auto-spell-out.
- **Even with these triggers, surface as a candidate — do not auto-rewrite.** The contributor sometimes had a specific reason, and rewrites here often need PR-body context to land cleanly.
- **When in doubt, leave the bullet alone.**

## Bullet-membership rules — which bullets stay

Apply BEFORE prose polish. See `cycle-aware.md` for the cycle-specific drop passes (already-shipped, parallel point releases, later cuts).

### Same-PR multi-bullet selection

A single PR is allowed to contribute multiple bullets only when the snippets legitimately added more than one. When two bullets share `[#NNNNN]`:

- **Default: same intent → keep one, drop the other.** Selection rules:
  - **Security-loaded vocabulary vs neutral.** Keep the neutral one. (PR #47778 IDOR case — see `section-routing.md § Security framing`.)
  - **Developer-side API framing vs user-side UI framing.** Keep the user-side. Example: PR-pair #47564/#47565 — kept `"Send newsletter by default" toggle`, dropped `wpcom_newsletter_send_default site option`.
  - **Verbose engineering language vs terse user-readable summary.** Keep the terse. Example: PR #47912 — kept `Network Admin: Update UI.`, dropped `Network Admin: Replace legacy PHP masthead on Network Sites and Network Settings pages with the unified AdminPage header from @automattic/jetpack-components.`
- **Genuinely different user-visible effects → keep both.** Example: PR #47313 produced 3 Other-changes bullets, all preserved.
- **Concatenation is NOT allowed.** Never write `Foo. Bar. [#NN]` combining two intents into one line.

### Update-dependencies consolidation

Multiple bullets all reading `- Update package dependencies.` or `- Update dependencies.` **consolidate into ONE bullet** with all PR refs space-joined: three `Update package dependencies. [#46647] [#46691] [#46716]` lines become `Update package dependencies. [#46647] [#46691] [#46716]` (preserve input order, do not numerically sort).

This is cleaning up after `tools/changelogger-release.sh` (lines 231–235 and 244–249), which auto-appends `Update package dependencies.` entries to dependents. The verbose multi-line pattern is a tooling artifact, not a contributor choice.

**Apply by default on alpha, beta, and stable cycles.** Surface as a candidate so the editor can confirm — the skill's stance is "surface, don't auto-rewrite" — but always propose the consolidation when the pattern is present.

Conditions:
- **Different lead text = different consolidation key.** `Update dependencies.` and `Update package dependencies.` do NOT merge.
- **Order within consolidated line: preserve input order**, not numerical sort. Example: `Fix TypeScript errors detected by tsgo. [#47426] [#47423]` is descending and matches input order.
- Consolidate whatever dep bullets are present in the current release block — no need to dedup against prior cuts; the release script runs on the release branch with only cherry-picked snippets so duplicates don't naturally arise.
- **Normalize `Updated` (past-tense) to `Update`** when merging.

### Rewrite individual bullet text during stable squash

These rewrites apply during the stable cut on the current cycle's own `## X.Y-a.*` / `## X.Y-beta` sections — the ones being collapsed into the new `## X.Y` block. **Always surface these rewrites as candidate edits;** the editor accepts or rejects each per the "surface, don't auto-rewrite" stance.

Patterns observed (15.7 and 15.8 squashes):

- **Sentence-case first letter after `:` prefix.** `External Media: ensure that…` → `External Media: Ensure that…`
- **Move trailing noun-name to a `Prefix:` segment.** `Add 'note' to the default whitelisted comment types for Sync. [#47746]` → `Sync: Add 'note' to the default whitelisted comment types. [#47746]`
- **Drop verbose explanatory clauses.** Drop `…replacing About, Privacy, and Terms links` tail; drop middle clauses like `that caused the no-post-editor bundle to list wp-edit-post as a dependency, breaking…`
- **Drop exhaustive module enumerations.** Drop `Gravatar Hovercards, Likes, Subscribe Floating Button, Subscribe Overlay, WooCommerce Analytics, and WordAds modules` lists.
- **Backtick-wrap URL paths and code references.** `/sites/$site/purchases` → `` `/sites/$site/purchases` ``
- **Drop a category prefix when the new section is generic enough.** `Comment: Improve author Gravatar URLs…` → `Improve author Gravatar URLs…` (when moved to Other changes).
- **Correct brand/acronym capitalization.** `wp-admin` → `WP Admin`.
- **Replace abbreviated category names with canonical form.** `SEO Tools:` → `SEO:`.
- **Merge two PR entries for closely-related work.** Two Settings entries → `Settings: Modernize page UI. [#47490] [#47942] [#47656]`.
- **Merge two entries with the same PR reference**, replacing technical detail with terse summary. Two `[#47912]` Network Admin entries → `Network Admin: Update UI. [#47912]`.

## Prefixes and scope

- In `projects/plugins/jetpack/CHANGELOG.md`, entries often start with a product area or component prefix, for example `Scan Admin:`, `Search Dashboard:`, `VideoPress:`, or `Activity Log:`.
- In a package's own changelog, drop redundant package prefixes. For example, inside `projects/packages/podcast/CHANGELOG.md`, avoid `Podcast:` and use a narrower scope only when it adds clarity.
- **Strip the redundant `Jetpack:` prefix.** The whole product is Jetpack — using `Jetpack:` as the bullet prefix is tautological. Example: `Jetpack: remove getIconColor functions for block icons` → `` Remove `getIconColor` functions for block icons. ``
- **Strip the redundant `Jetpack ` qualifier when a sub-product prefix is also present.** `Jetpack Social:` → `Social:` (the entry is already inside the Jetpack plugin's CHANGELOG).
- **Add a category prefix to bare entries when context is clear.** A bullet without any prefix is acceptable but un-clustered; if the entry obviously belongs to a known feature area (Social, Newsletter, Forms…), add the prefix. Example: `- Reuse AI image generation in media section.` → `- Social: Reuse AI image generation in media section.` Use the PR subject (`git log --grep '(#NN)$'`) when the area is ambiguous.
- **Capitalize the first body word after the `Prefix:` colon.** `Forms: add filter to hide integration icons.` → `Forms: Add filter to hide integration icons.` Exception: when the first body word is a compound noun or code token that would normally be lowercase as a label (e.g. `pre-build` in `E2E: pre-build number-formatter package…`), leave it alone.
- Generic dependency-only entries can stay unprefixed, such as `Update dependencies.` or `Update package dependencies.`

## Sections

- Jetpack plugin changelog commonly uses sections such as `Enhancements`, `Improved compatibility`, `Bug fixes`, and `Other changes`.
- Put infra-only, flag-only, package-registration, and other non-user-facing entries in `Other changes`.
- `Other changes` is intentionally filtered out of `readme.txt` by `tools/plugin-changelog-to-readme.sh`.
- Package changelogs usually use Keep a Changelog sections such as `Added`, `Changed`, `Removed`, and `Fixed`.
- For nuanced demote/promote decisions between sections (API-only, compat-hardening, net-zero impact, security framing), see `section-routing.md`.

## Prose rewrites — what to trim

Apply on alpha, beta, and stable cycles; also during reviewer-feedback rounds. Surface each rewrite as a candidate so the editor can accept or reject it.

- **Strip "by `<implementation>`" tails from bug-fix entries.** Anything trailing `... by <how it was fixed / refactored>` is removed. More than one sentence in a bullet = trim. Examples:
  - `Fix modal shaking when content streams in by correcting header margins and making the header sticky` → `Prevent modal shaking from when content streams in`
  - `fix markers displaying as bullet points on Simple sites by moving data to inline JS and hiding fallback list via CSS` → `Fix markers displaying as bullet points on Simple sites`
- **Strip "for `<reason>`" justification tails — when aesthetic.** Drop `for consistency`, `for visual consistency`, `for cleaner appearance`. **Keep when the tail names a concrete measurable result** like `reducing plugin zip size by ~7 MB` or `improving performance by N%`.
- **Strip "migrated from `<internal-source>`" provenance tails.** Example: `Block Notes: Add Block Notes as a standalone Jetpack extension plugin, migrated from big-sky-plugin.` → `Block Notes: Add Block Notes as a standalone Jetpack extension plugin.`
- **Strip hedging / CYA disclaimers.** Phrases like "Shouldn't impact existing sites", "Not a big deal but" — remove.
- **Reframe "Fix `[bad thing not happening]`" → "`[Ensure / Add / Prevent] [good thing]`"** when the failure was never visible in a shipped build (internal regression) or when a positive frame is natural. Examples:
  - `Fix site icon not being shown on some sites.` → `Ensure site icon is shown on all sites.`
  - `Forms: Fix number field min and max values not displaying in the UI after page reload.` → `Forms: Ensure number field min and max values display in the UI after page reload.`
  - Counter-example (kept as "Fix"): `Map block: Fix markers displaying as bullet points on Simple sites.` — because users WERE seeing the bullet points. Also `WAF: Fix issue that potentially allowed bypassing WAF rules.` — no useful positive frame for a security bypass.
  - **High risk for a skill** — requires judging whether the bug was user-visible. Surface as candidate edit.
- **Rewrite refactor-internal language to user-visible outcome.** Internal-process verbs like `Unified`, `Migrated`, `Harmonized`, `Refactored` get rewritten to verbs naming the user-visible effect. Example: `Social: Unified social provider preview.` → `Social: Improve social preview for LinkedIn and Tumblr.` (needs PR-body knowledge to name the platforms — surface as candidate; the skill could name the wrong platforms).
- **Coordinate parallel entries from related PRs into a consistent template.** When N+ entries describe analogous work with idiosyncratic phrasing, rewrite all to a parallel template. Example (PR #46541):
  - `Gating for the donations block` → `Gate donations block behind conditional features.`
  - `Gating for the payment buttons block` → `Gate payment buttons block behind conditional features.`
  - `Gating for the PayPal payment buttons block` → `Gate PayPal payment buttons block behind conditional features.`
  - The phrase `behind conditional features` was invented by the editor — requires reading the PR(s). Surface as candidate.
- **Rewrite "Update X to have a better copy" → "Improve X copy".** Active voice + concision. Example: `Update disabled newsletter notice to have a better copy for private sites not set for coming soon.` → `Improve disabled newsletter notice copy for private sites not set for coming soon.`
- **Round out terse single-noun fragments.** Add a descriptor noun when the entry reads as a fragment. Example: `Updating to-test.md` → `Update to-test.md file.` Apply only when the bullet feels cut off. (Weak rule.)

## Prose rewrites — what to fix

- **Typo fixes.** Obvious misspellings (`compatability` → `compatibility`, `occuring` → `occurring`, `preivew` → `preview`). Strict.
- **Accuracy / subject-verb agreement.** Singular/plural mismatches get fixed. Example: `My Jetpack: Check red bubble notification async when cache is not available.` → `My Jetpack: Check red bubble notifications async when cache is not available.`
- **Fix typos in reviewer `suggestion` blocks before applying.** Don't paste verbatim — read and correct grammar before accepting.

## Identifiers — what to backtick

Wrap in backticks when the token names an entity:

- Function names: `getIconColor`
- Classes: `Jetpack_PostImages`, `Images`
- Hooks/filters: `jetpack_ai_assistant_generation_complete`, `breve_enabled`
- Config keys / option names: `wpcom_newsletter_send_default`, `baseUrl`
- Namespace paths: `Automattic\Jetpack\Post_Media\Twitter_Cards`
- Tool names: `tsgo`, `tsconfig`
- Status values: `in_sync`, `last_item`
- Block names with slashes: `core/button`, `jetpack/button`
- CSS class names: `jetpack-ignore-thumbnail`
- Kebab-case slugs when used as a named entity: `clear-queue` (as the literal endpoint name)
- URL paths when they're literal endpoints: `` `/sites/$site/purchases` ``

**Critical conditional — backtick when NAMED, not when DESCRIPTIVE.** The same kebab-case word can be backticked in one entry and bare in the next:

- `` Sync: Add `clear-queue` REST endpoint to allow clearing a Sync queue. `` — `clear-queue` IS the endpoint's name → backticked.
- `` Admin Menu: Add `inlineIcon` support to the admin-menu REST endpoint. `` — `admin-menu` is descriptive ("the admin-menu kind of endpoint"), not the literal endpoint name → NOT backticked. `inlineIcon` IS the literal parameter name → backticked.
- `` Mark all methods in the `Jetpack_PostImages` class as deprecated in favor of the Post_Media package's `Images` class. `` — `Jetpack_PostImages` and `Images` are literal class names → backticked. `Post_Media` is an adjectival qualifier of "package" → NOT backticked.

Heuristic: if the token can be replaced with `the <X> (where X is the entity-class noun)` and the sentence reads correctly, the token names an entity and gets backticks.

**Do NOT backtick:**

- All-caps acronyms with no special characters: `MCP`, `JSON`, `WAF`, `i18n`.
- PascalCase class names used as English nouns (medium confidence — corpus has only one observation, `PhanPossiblyUndeclaredVariable` un-backticked).
- File/path tokens used parenthetically: `to-test.md`.

## Abbreviations

- **Spell out programming-language abbreviations.** `TS` → `TypeScript`. `phpdoc` → `PHPDoc`. Example: `Fix TS errors detected by tsgo.` → `` Fix TypeScript errors detected by `tsgo`. ``
- **Keep Jetpack-internal abbreviations bare** (no spellout, no backticks): `AI`, `SEO`, `IDC`, `JP`, `WAF`, `CIAB`, `E2E`, `i18n`, `MCP`, `WPCom`. Extend the allowlist as new ones surface — don't auto-rewrite unfamiliar all-caps tokens.

## Formatting & punctuation

- **Terminal period before `[#NNNNN]`.** Every entry ends with `.` immediately before the space and the PR-ref bracket. Apply as a default whenever the editor is touching the entry. Example: `... Image Generation [#47829]` → `... Image Generation. [#47829]`
- **Preserve contributor's typographic glyphs.** `=>` (used for menu paths like `Settings => Sharing`) stays as-is. Em-dashes, en-dashes, curly quotes left alone when the contributor chose them.
- **Preserve compound-word choices.** `IP-address` (hyphenated) stays. `non-Business` (Plan-tier proper noun) stays.
- **Strip "noun: noun" repetition from possessive constructs.** `WordPress' new "Embed video from URL" option` → `the new WordPress "Embed video from URL" option` (avoid possessive apostrophe on the brand).
- **Rewrite quoted lowercase brand mentions.** `Subscriptions: update panel name to include "jetpack"` → `Subscriptions: Update panel name to include Jetpack branding.` (Use the brand naturally; don't quote a lowercase form of it.)
- **Strip "regardless" comma.** Weak rule. `Enable Image Studio for Big Sky and CIAB sites, regardless of Jetpack AI enabled status.` → `Enable Image Studio for Big Sky and CIAB sites regardless of Jetpack AI enabled status.`

## Reviewer patterns to preserve

- If feedback is ordering-only, preserve bullet text exactly and only reorder the current release block.
- If feedback is wording-focused, **apply the same principle to nearby entries** in the same current release block when the issue is clearly repeated. Don't only fix the marked lines.
- Do not paste reviewer suggestion blocks blindly. Correct typos or grammar mistakes in the suggestion before applying.
- Keep sort fixes and wording fixes in separate commits when review clarity matters.

## Anti-patterns

- **Nested bullets in release-note entries.** Flatten to one bullet per change.
- **Wrapper entries** that hide the real change behind a meta-label: `Address P1/P2/P3 review feedback`, `Sync with main`, `Various fixes`, `Misc fixes`. Unpack into the actual user-facing changes, or move them to `### Other changes` if they have no user-facing effect.
- **Trailing whitespace** on changelog lines. Strip it.
- **Stray quote marks, stray characters before `[#NN]`.** Strip them and replace with a proper terminal period. Example: `Fixes a compatability bug with the Gutenberg plugin" [#45967]` → `Fix a compatibility bug with the Gutenberg plugin. [#45967]`
- **Inconsistent spelling of proper nouns within the same file** — for example mixing `WPCOM`, `WPcom`, and `WordPress.com`. Pick the full proper name and apply it consistently in the **current** release block. Do not retroactively rewrite prior sections.
- **Implementation-detail parentheticals** longer than a sentence. That text belongs in the commit body, not the changelog.

## Guardrails — what the editor does NOT do

These are non-edits. The skill must respect them.

- **Do NOT re-edit bullet text already shipped in publicly-released sections** (`## X.Y-1`, `## X.Y-2`, etc. above the current cut). Lowercase verbs, missing periods, unbackticked identifiers, typos — all left alone. This is the strongest non-edit guardrail. The prerelease text was written and sorted on the wording that shipped; silently re-editing it now breaks the implicit "what shipped is what's documented" contract.
  - **Important nuance**: the current cycle's own `## X.Y-a.*` / `## X.Y-beta` sections are fair game for the full rewrite pass during the stable squash (see `cycle-aware.md § Stable backport`). The "frozen" guardrail applies to **prior**-released sections only.
- **Do NOT normalize prefix variants across sections for consistency.** `Newsletters:` and `Newsletter:` coexist; `Admin:`, `Admin dashboard:`, `Admin Menu:`, `Admin Page:` all coexist.
- **Do NOT add PR references that are missing.** Bullets that came in without `[#NN]` stay without `[#NN]`.
- **Do NOT collapse near-duplicate but not-identical entries.** Two distinct unit-test bullets about different endpoints both stay. Only exact lead-text duplicates get consolidated. Exception: same-PR-multi-bullet selection IS allowed to drop synonymous bullets that share a PR number.
- **Do NOT manually re-sort bullets after a wording edit.** The script sorted on the pre-edit text at write time. If a wording edit makes the visible order look "wrong," keep sort and wording in separate commits — don't reach in and reorder mid-wording-pass.
- **Do NOT spell out small acronyms / inline jargon.** `JP branding` stays as `JP branding`, not `Jetpack branding` (though see "Rewrite quoted lowercase brand mentions" above for the special case where lowercase `"jetpack"` in quotes IS rewritten).
- **Do NOT rewrite for "concision" alone.** A long but clear sentence stays long.
- **Do NOT touch the HTML comment in `### Other changes`.** The marker `<!-- Non-user-facing changes go here. This section will not be copied to readme.txt. -->` is matched literally by `tools/plugin-changelog-to-readme.sh:94`. Removing or altering it stops the readme regenerator from filtering, and `Other changes` then gets published to WP.org.
- **Do NOT remove "internal-clarifying" prose embedded in entries.** Example: `Switch Site command: Disable for now - note this was never included in a jetpack-plugin release.` — the editor fixed the prefix and added a period but left the internal note intact.
- **Do NOT auto-fix wrapper bullets, ordering inconsistencies, or nested bullets** — surface them, ask, then act with human confirmation.
