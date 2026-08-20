# Widget test groups

A file in this directory imports widget suites that can share one Jest module
registry. This avoids repeatedly loading the same dependency graph.

```tsx
import '../top-posts/__tests__/top-posts.test';
import '../clicks/__tests__/clicks.test';
```

## Running

Grouping is opt-in, via `PA_TEST_GROUPS=1`. `pnpm run test` sets it, unless a
test filter is passed.

```bash
pnpm run test                        # grouped
PA_NO_GROUPS=1 pnpm run test         # ungrouped
pnpm run test -- widgets/clicks      # one suite
```

## Adding a widget suite to a group

Members must declare the same `jest.mock()` calls because a mock registered by
one member applies to the whole group. Do not list a suite in multiple groups.
Leave suites with relative module mocks ungrouped because those mocks resolve
from the suite's directory.

Keep groups at ten members or fewer and reset shared state in `beforeEach`.

## When a grouped run fails confusingly

Re-run that suite on its own first:

```bash
pnpm exec jest --config=tests/jest.config.cjs widgets/<name>
```

If it passes alone, check for state left in the DOM, query cache, mocks, or
module-level variables by another member.
