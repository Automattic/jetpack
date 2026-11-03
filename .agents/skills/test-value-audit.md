---
name: test-value-audit
description: Use when auditing existing JS tests for duplication or value (a package, a directory, or the tests a PR or commit added), when deciding which tests to remove, merge, or rewrite, or when a suite has grown too slow for CI. Jest only.
---

# Test value audit

The criteria live in `docs/automated-testing.md` § "What a test must earn". Read them first.

**Scope:** a path audits every test under it. A PR or commit audits the test files it added or changed (`git diff --name-only <base>...<head>`), plus tests at other layers that cover the same code.

Work in the order below. CI time comes from suites that load or run repeatedly, not from individual tests, which cost milliseconds. Do the cheap, high-payoff steps for the whole scope before spending mutation runs on single tests.

## 1. Measure

Read the project's test setup first: the test scripts in `package.json`, the Jest config, and the project's `AGENTS.md`. Note any paths that run more than once and any suite grouping, and follow the project's rules when removing or merging a file.

Record the "before" state: the test count, and the time per suite and per configuration (`jest --json`: `numTotalTests`, and `endTime - startTime` for each entry in `testResults`). Rank the suites by time × number of runs, and work through them in that order.

## 2. Configuration first

These changes save the most CI time and need little or no mutation:

- **Repeated configurations.** For a path that runs more than once (for example under extra timezones), check each file it covers: does any of its tests fail only in that configuration? Check this with a mutant that triggers the difference. Narrow the path to the files where one does.
- **Suite load.** Merge small suites that test the same unit, and make suites eligible for any grouping mechanism.

## 3. Triage by reading

Read the source, its tests, and its consumers (`git grep` each export), and look across layers (component, hook, shared library). Some verdicts need no mutant. Decide them by reading:

- Same input and same expected value as another test: remove.
- Asserts only a type, a fixture shape, or a constant: remove.
- A hollow assertion, or an input that never reaches the branch the test's title names: rewrite or remove (see the last section).

## 4. Mutation-check only the doubtful removals

A removal is doubtful when the overlap is not literal: different inputs, a different layer, or a title claiming a behavior that no other test visibly covers. Run mutants for those only, from any worktree other than the main checkout (`git worktree add`, then `pnpm install`):

```bash
node <repo>/.agents/skills/test-value-audit/scripts/mutate.mjs mutants.json \
  [--tz=UTC,America/Los_Angeles] --drop=drop.txt -- npx jest --config=<config> <test paths>
```

- Write mutants that break what the candidate's title claims, plus the bug from the commit that added it (`git log -S`).
- Include the other layers' tests in `<test paths>`.
- The candidate can go only if `--drop` reports nothing lost. `KILLS NOTHING` only covers the mutants you wrote.
- A surviving mutant is a gap. Report it. The exception is an equivalent mutant, one that cannot change any output; it usually points to a redundant guard in the source, so report it separately.
- To drop a single assertion rather than a whole test, delete the assertion in the worktree and rerun without `--drop`.

## 5. Report

- A verdict table per file (keep / merge / remove / rewrite), with the reason and the evidence (an identical twin, or mutant ids).
- Configuration changes.
- Gaps.
- Before and after numbers, measured.

Apply the changes only when asked: one PR per module or feature area.

## Tests that look covered but are not

- `objectContaining` against a fixture that already holds the asserted value.
- `toBeInstanceOf( Date )`, `toBeDefined()`, or `length > 0` asserted in place of the actual value.
- A leap-year rule tested over a range that contains no February 29.
- A test that varies an input the code path ignores, such as a timezone the formatter never reads.
