# Widget test groups

jest gives every test _file_ its own module registry. A widget suite therefore
re-evaluates the whole widget dependency graph — React, `@wordpress/components`,
`@wordpress/dataviews`, `@automattic/charts`, and this package's own modules —
from scratch, and most of a widget suite's cost is that evaluation rather than
the assertions. Measured on `widgets/top-posts`: 4.1s per run, of which 3.0s is
module loading. Six widget suites load ~195 modules each and 181 of them are the
same modules.

A file in this directory is a group: it `require`s several widget suites so they
run through one module registry and pay that cost once.

```tsx
require( '../top-posts/__tests__/top-posts.test.tsx' );
require( '../clicks/__tests__/clicks.test.tsx' );
```

The suites themselves are not modified and keep their own files — stack traces
still point at the real test file.

## Running

Grouping is opt-in, via `PA_TEST_GROUPS=1`. `pnpm run test` sets it.

```bash
pnpm run test                                   # grouped
pnpm exec jest --config=tests/jest.config.cjs widgets/top-posts   # ungrouped, unchanged
PA_NO_GROUPS=1 pnpm run test                    # force the whole run ungrouped
```

`tests/jest.config.cjs` reads the `require` lines here and ignores whichever side
is inactive, so no suite ever runs twice. Group membership lives in these files
and nowhere else.

## Adding a widget suite to a group

**Members of a group must declare an identical set of `jest.mock()` calls.** They
share one module registry, so a mock registered by one member applies to every
other member — putting a suite in the wrong group silently changes what its
neighbours test. `tests/js/test-groups.test.ts` enforces this and fails the build
on a mismatch, including a suite listed in two groups.

A suite cannot be grouped when:

- no existing group has its exact mock set — leave it ungrouped, or start a group
  once a second suite shares that set;
- it mocks a **relative** specifier (`jest.mock( '../use-location-views' )`), which
  resolves against the mocking file and so means a different module for each
  member. These suites always run alone.

Keep groups at ten members or fewer. Everything in a group shares one jsdom and
one module registry, so one member's leaked state can break the rest; a smaller
group keeps that blast radius readable.

Members must also clean up after themselves in `beforeEach` — typically
`queryClient.clear()` (the data package's query client is a module-level
singleton) and resetting their own mocks.

## When a grouped run fails confusingly

Re-run that suite on its own first:

```bash
pnpm exec jest --config=tests/jest.config.cjs widgets/<name>
```

If it passes alone but fails in its group, the cause is shared state, not the
assertion — look for a missing reset in `beforeEach`, or state left in the DOM,
the query cache, or module-level variables by an earlier member.
