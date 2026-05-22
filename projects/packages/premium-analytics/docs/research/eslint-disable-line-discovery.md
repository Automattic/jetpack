# How the `@automattic/charts` CSS-import disable-directive turned out to be unnecessary

Captured here because the path to the current invariant ran through
six rounds of review — including two dogfood tasks that each
falsified the spec the prior rounds had agreed on. The current
invariant is **not** "use the inline form" (Rounds 2–4's wrong
answer), and **not** "both forms strip so verify-and-re-add in a
follow-up" (Round 5's wrong answer); it is **"the disable directive is
unnecessary because `import/no-unresolved` does not fire on CSS
subpath imports — write the import bare and never add a directive."**

The invariant itself lives in
[`../../AGENTS.md`](../../AGENTS.md) → "Common patterns and pitfalls" →
"ESLint patterns". This file is the forensic trail explaining *how*
the team reached it, not what it is.

Audience: agents and humans extending the chart-related code in this
package. Read this only if you are touching the `@automattic/charts`
CSS-import pattern itself, are about to propose re-adding a disable
directive, or are about to install a post-commit verification step
for one.

---

## What was being implemented

A pie chart on the analytics dashboard, requiring a CSS subpath import:

```ts
import '@automattic/charts/style.css';
```

The subpath resolves to `dist/index.css`, which is gitignored and not
built during the ESLint CI step. At the time, every contributor —
including the task md author — assumed `import/no-unresolved` would
therefore fire on the import in CI lint. Round 6 ultimately showed
that assumption was wrong (the repo's TS import resolver doesn't
evaluate CSS subpath imports at all), but Rounds 1–5 took that
assumption as given.

The task md (now removed; see [`../../AGENTS.md`](../../AGENTS.md) for
the current canonical reference) initially told the agent to disable
the rule. The form of the disable directive turned out to be
load-bearing in a non-obvious way — until Round 6 showed the
directive itself was the load that didn't need bearing.

## Round 1 — first attempt: `eslint-disable-next-line`

Initial form:

```ts
// eslint-disable-next-line import/no-unresolved -- CSS subpath; dist/index.css is gitignored
import '@automattic/charts/style.css';
```

Locally, this was fine. On CI, `import/no-unresolved` fired anyway —
the disable comment was *not in the committed file*. The agent's
sandbox tree had it; the pushed commit didn't.

## Round 2 — first guess at the mechanism: Prettier blank line

Hypothesis: Prettier was inserting a blank line between the disable
comment and the import, breaking the next-line scope.

The fix proposed was to switch to inline `eslint-disable-line`, which
travels with the import token and isn't affected by intervening
whitespace.

Verified empirically (the inline form survived the pipeline), so the
fix shipped. The hypothesis about Prettier was wrong — confirmed in
Round 3 — but the fix happened to also solve the actual underlying
problem, so the symptom went away.

## Round 3 — Copilot review caught the wrong mechanism

A Copilot review on the task md called out that
`.prettierrc.js` only loads `prettier-plugin-svelte`; no
import-organizing plugin is in the Prettier config. So Prettier
couldn't have been the cause of the blank line in Round 2.

Re-investigation pointed at ESLint instead. `tools/js-tools/eslintrc/base.mjs:318-325`
configures `import/order`:

```js
'newlines-between': 'never',
```

…plus alphabetic ordering. The `pnpm run lint-file --fix` step in
pre-commit applies this rule, which reorders imports. During that
reorder pass, the standalone `eslint-disable-next-line` comment ends
up missing from the file that subsequently gets committed.

The task md was rewritten in Round 3 to blame ESLint's `import/order`
reorder + `--fix` removing the now-detached comment, instead of
Prettier.

## Round 4 — Copilot caught the next-rung wrong mechanism

Round 3's "ESLint `--fix` removes the orphaned comment" was *also*
unverified. Copilot pointed out that `pnpm run lint-file` is just
`eslint --flag v10_config_lookup_from_file`; it does not pass
`--report-unused-disable-directives`, and `reportUnusedDisableDirectives`
doesn't appear in the ESLint configs either. So `--fix` should not be
removing the directive even when it's orphaned.

At this point the team chose to stop chasing the mechanism. The
relevant signal is the observed outcome — multiple sandbox runs of
the task show the next-line form's directive missing from the
committed file — not whichever specific rule or fix interaction is
responsible.

The task md was rewritten one more time to describe the failure chain
purely in terms of *what is observed*, not *why*:

> pre-commit reorders imports → disable comment ends up missing from
> the committed file → CI lint fails on `import/no-unresolved`.

The practical fix (inline `eslint-disable-line`) is unchanged; the
spec just stopped making claims about lint internals it couldn't
substantiate.

## Round 5 — host dogfood (PR #49 / [RSM-3713](https://linear.app/a8c/issue/RSM-3713)) falsifies "inline is robust"

The Phase 1 Linear-first restructure (PR #48) shipped an AGENTS.md
"ESLint patterns" section claiming the inline form persists because
"the trailing-on-the-same-line form travels with the import token, so
reordering doesn't separate them." The first dogfood task run under
that spec — adding a page-views line chart on host — falsified that
claim within minutes.

The sequence on
`add/premium-analytics-line-chart` (commit `dd52a32094`):

1. `Write` placed
   `import '@automattic/charts/style.css'; // eslint-disable-line import/no-unresolved -- ...`
   in `stage.tsx` alongside three other new imports.
2. `git commit` ran the pre-commit pipeline (Prettier formatting, then
   `eslint --fix` via `lint-file` on the three staged files).
3. `git show HEAD -- ...stage.tsx` revealed the import line was
   present but the inline directive **was gone**.

A follow-up commit (`e60c87ea93`) re-added the comment manually. That
commit's pre-commit pass left the directive intact — most plausibly
because the only change in that commit was the comment itself; the
strip mechanism (whatever it is) seems to require a broader rewrite
in the same pass.

### The pie chart branch never actually shipped the inline form either

While investigating Round 5, this history-wide search:

```bash
git log --all -S 'eslint-disable-line import/no-unresolved' --oneline \
  -- projects/packages/premium-analytics/routes/dashboard/stage.tsx
```

…returned a single commit: `e60c87ea93` (the Round 5 follow-up above).
No commit on `fork/add/premium-analytics-pie-chart` — the branch whose
review cycle drove Rounds 1–4 — ever contained the inline directive
in `stage.tsx`. Confirming directly with:

```bash
git show fork/add/premium-analytics-pie-chart:projects/packages/premium-analytics/routes/dashboard/stage.tsx
```

…shows the import is there, the directive is not.

Implication: the Round 2 conclusion that "the inline form survived
the pipeline" appears to have been a misread of the local working
tree at the time, never re-verified against the committed file.
Rounds 3–4's confident claims about *why* the inline form was robust
were therefore built on a load-bearing observation that turned out
to be wrong.

## Round 6 — second host dogfood (PR #50 / [RSM-3726](https://linear.app/a8c/issue/RSM-3726)) falsifies "follow-up commit lets the comment through" and "the directive is needed at all"

The Round 5 update to AGENTS.md installed an operational rule: after
`git commit`, run `git show HEAD -- <file>` and confirm the directive
is on the import; if missing, re-add it in a follow-up commit, which
"typically lets the comment through because nothing else is being
rewritten."

The first run under that updated spec — adding a top-pages bar chart
on the host — falsified *both* halves of the rule.

The sequence on `add/premium-analytics-bar-chart`:

1. Initial commit `038bf1dc32` placed the import with the inline
   directive. Pre-commit stripped it (expected per Round 5).
2. Follow-up commit `53c62ddcbd` re-added *only* the directive (no
   other change in the file). Pre-commit stripped it again — leaving
   the follow-up commit literally empty (zero file changes). This is
   the case Round 5 predicted "typically lets the comment through".

### What the pre-commit pipeline actually emits

Running the same pipeline locally (`pnpm run lint-file <file>`) with
the directive in place produced this warning:

```
projects/packages/premium-analytics/routes/dashboard/stage.tsx
  2:40  warning  Unused eslint-disable directive
        (no problems were reported from 'import/no-unresolved')
✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

The Husky pre-commit hook invokes `lint-file --max-warnings=0 --fix`
(per the commit-time output: `JS issues detected and automatically
fixed via eslint.`), so:

- `--fix` autofixes the unused-directive warning (removes the
  comment)
- `--max-warnings=0` then sees zero warnings (since they were just
  fixed) and exits 0
- The strip is the autofix, not a separate reordering or formatter step

This contradicts Round 4's conclusion that
`reportUnusedDisableDirectives` was not the mechanism. Round 4
correctly noted that the `lint-file` script doesn't pass
`--report-unused-disable-directives` and no config explicitly sets
`linterOptions.reportUnusedDisableDirectives`. But ESLint v9 enables
this option by default (`'warn'`) regardless of whether any config
mentions it, so the warning fires anyway. Round 4 missed the *implicit
default*.

### Why the directive was redundant in the first place

Empirically — running `pnpm run lint-file <file>` against two
filesystem states:

1. With `dist/index.css` present (workspace charts package built) →
   exit 0, no warnings.
2. With `dist/index.css` moved aside (simulating the CI lint
   environment, where charts isn't pre-built) → exit 0, no warnings.

`import/no-unresolved` does not fire in either case. Reading the
config:

```js
// tools/js-tools/eslintrc/base.mjs:251-266 (verbatim)
settings: {
	'import/extensions': javascriptFiles
		.map( v => v.replace( '**/*', '' ) )
		.filter( v => v !== '.svelte' ),
	'import/internal-regex': '^jetpack-js-tools/',
	'import/resolver': {
		typescript: {
			project: tsconfigPath,
			conditionNames: [ ...envConditionNames, ...defaultConditionNames ],
			alias: {
				// These somehow confuse import/named (maybe they're outdated or incomplete?), alias them to nothing.
				'@types/lodash': [ null ],
				'@types/wordpress__block-editor': [ null ],
			},
		},
	},
```

The resolver is `eslint-import-resolver-typescript`, which only
resolves JS-like extensions. CSS subpath imports are outside its
purview; `import/no-unresolved` simply does not evaluate them. Every
prior round had been operating on an unverified premise — the
*original* claim "`import/no-unresolved` fires on this import in CI"
was never actually substantiated. None of Rounds 1–5 ran the lint
without the directive to check whether the rule fires; everyone
assumed it did because the task md said so.

The Round 5 search of full history for `eslint-disable-line
import/no-unresolved` returning only `e60c87ea93` is *almost*
consistent with this. The dominant pattern across every other commit
that touched this import is "directive absent" — either never written,
or written and stripped. `e60c87ea93` itself is a single-commit
anomaly: at that one commit the directive *did* make it through
pre-commit. The likely cause is that immediately before the commit the
agent had manually run `rm projects/js-packages/charts/dist/index.css`
and `pnpm run lint-file --fix`, which could have changed which warnings
fired at lint time; the recorded pre-commit hook output for that
commit shows only Prettier output, hinting `lint-file --fix` may not
have re-run on the staged file. The exact bypass mechanism wasn't
isolated, and it isn't reproducible from the current spec — every
subsequent commit under normal pre-commit flow has stripped the
directive. The dominant rule (strip) holds; `e60c87ea93` is noted here
so a future investigator looking at history doesn't think it
contradicts Round 6.

The "shipping pie chart works without the directive" observation isn't
a contradiction either — it never needed the directive.

### Updated invariant (post-Round 6)

The disable directive is **not needed and cannot be retained**. Write
the import bare:

```ts
import '@automattic/charts/style.css';
```

No post-commit verification step. No follow-up commit. The PR #50
description and DoD verification comment record this finding inline;
the AGENTS.md "ESLint patterns" section is updated to match.

### Lessons (revised)

The Round 5 lessons stand with one revision:

1. (unchanged) **Spec-as-source-of-truth for future agents** means we
   can't encode wrong mechanisms even when the practical fix happens
   to work.
2. **Both forms are unreliable AND unnecessary.** Round 5 framed the
   directive as needed-but-fragile. Round 6 shows it was never needed.
   The load-bearing thing is *not having a disable directive at all*.
3. (unchanged) **Multi-round Copilot review is genuinely useful**…
4. **Dogfood-as-validation actually fires — repeatedly.** PR #49
   (Round 5) falsified Round 4's mechanism. PR #50 (Round 6)
   falsified Round 5's operational rule. The pattern is robust: each
   dogfood catches the latest wrong-but-plausible claim.
5. **Verify the premise, not just the workaround.** Rounds 1–5 all
   assumed `import/no-unresolved` fires on this import; nobody ran
   `pnpm run lint-file <file>` without the directive to check.
   Round 6 did, and the entire chain of reasoning collapsed.

## Why this file exists

The current invariant ("the directive is unnecessary; write the import
bare; do not run a post-commit verification step") lives in
[`../../AGENTS.md`](../../AGENTS.md) → "Common patterns and pitfalls"
→ "ESLint patterns". It would be a one-liner there if someone
discovered it from scratch, but in practice this team burned six
rounds on the question — five chasing a workaround for a rule that
doesn't fire. This file is the receipt: if a future implementer or
reviewer proposes re-adding the directive (or any kind of post-commit
verification step for it), they can find here a concrete account of
how every prior assumption failed empirical testing.

---

## Index

This is the first entry under `docs/research/`. The convention is:
short, specific, named after the invariant the research produced.
Future entries should follow the same shape — what was implemented,
what went wrong, what was tried, what the final discipline is.
