# Test groups

A file in this directory imports suites that can share one Jest module registry.
This avoids repeatedly loading the same dependency graph.

```tsx
import '../../widgets/top-posts/__tests__/top-posts.test';
import '../../widgets/clicks/__tests__/clicks.test';
```

A group is named `<area>-<what its members mock>`, because membership is decided
by the mocks, not by where the suites live.

A group file holds nothing but those imports and comments, each import written on
one line exactly as above. The Jest config reads the same lines to keep a member
out of the ungrouped run, so a line it cannot parse would leave that suite running
twice. `tests/js/test-groups.test.ts` fails on anything else in the file, and on
any other file in this directory.

## Running

Grouping is opt-in, via `PA_TEST_GROUPS=1`. `pnpm run test` sets it, unless a
test filter is passed.

```bash
pnpm run test                        # grouped
PA_NO_GROUPS=1 pnpm run test         # ungrouped
pnpm run test -- widgets/clicks      # one suite
```

A test filter is any argument not starting with `-`, so pass flag values with an
equals sign: `--maxWorkers 2` leaves `2` looking like a filter and drops the run
to ungrouped, while `--maxWorkers=2` keeps grouping on. The run stays correct
either way, and the config prints which argument it read as a filter.

CI only ever runs the grouped mode, so the ungrouped fallback is covered by hand.
Run both after changing what the config ignores; a break there shows up as every
suite counted twice, once standalone and once inside its group.

## Adding a suite to a group

Members must declare the same `jest.mock()` calls. The registry is shared, so
only the factory of the first member that loads a module ever runs; every later
member gets that same instance, however its own `jest.mock()` reads.

That makes identical mock text necessary but not sufficient. A factory that
closes over a variable declared in the suite — the way `email-breakdown` drives
`useResizeObserver` from a `let mockResizeObserverWidth` — is wired to the first
member's variable alone, and the other members' copies are never read. Group only
suites whose mocks are self-contained; the guard test compares the mock text and
cannot see this difference.

Do not list a suite in multiple groups. Leave suites with relative module mocks
ungrouped because those mocks resolve from the suite's directory.

Leave suites that pin their own environment ungrouped too. Jest reads the
`@jest-environment` docblock of the file it collects, which for a member is the
group file, so a member asking for `node` silently gets the group's jsdom and
fails on whatever it wanted `node` for. The guard test reports this.

A suite that declares no `jest.mock()` at all is compatible with every other
such suite, whatever it covers — `mixed-no-mocks` collects the ones from areas
too small for a group of their own.

Keep groups at ten members or fewer and reset shared state in `beforeEach`.

## When a grouped run fails confusingly

Re-run that suite on its own first:

```bash
pnpm exec jest --config=tests/jest.config.cjs <path/to/suite>
```

If it passes alone, check for state left in the DOM, query cache, mocks, or
module-level variables by another member.
