# Consolidation heuristic — fewer, more powerful abilities

The default temptation when shipping abilities is to mirror the REST or admin surface one-to-one: one ability per CRUD verb, one per state transition, one per filter. Resist it. Agents benefit from **fewer, more capable abilities** over many atomic ones.

## Why consolidate

- **Fewer slugs to remember.** Every ability is a name and a shape the agent has to know. Halving the count halves the mental overhead.
- **One call, multiple filters.** Combining filters in a single ability avoids list-then-filter round-trips over REST.
- **Declarative writes beat verb pairs.** `set-module-status` with `{slug, active}` is symmetric, idempotent, and self-documenting. `activate-module` + `deactivate-module` is two slugs for the same state concept.
- **Consistent return shapes.** One shape per ability makes the agent's downstream reasoning tractable. Shape-changing based on input is a trap.

## The two consolidation moves

### Move 1: Collapse list + detail into a filtered read

If you have `list-<objects>` and `get-<object>` as separate abilities, merge them.

- Name the merged ability `get-<objects>` (plural).
- Add `slug` (or `id`) as an **optional** filter. Present → return a 0- or 1-element array. Absent → return the full filtered list.
- Add the other useful filters in the same schema: `active`, `status`, `feature`, `search`, `parent`, date ranges.
- **Always return an array of the same object shape.** Don't switch between "summary" and "detail" shapes based on input — that's the shape-changing trap.

If agents genuinely need a richer "detail" shape (headers, plan requirements, diagnostics), add an `expand` or `include` input param; don't split into a second ability.

### Move 2: Replace verb pairs with declarative state-setters

If you have `<verb>-<object>` + `<anti-verb>-<object>` (activate/deactivate, publish/unpublish, enable/disable, open/close), merge them.

- Name the merged ability `set-<object>-<attribute>` (e.g. `set-module-status`, `set-post-visibility`, `set-subscription-state`).
- Make the state param **required** (`active: bool`, `status: 'published'|'draft'`, `visibility: 'public'|'private'`).
- Make it **idempotent**: compare desired vs current. If equal, return `changed: false` with the current state. If different, transition and return `changed: true`.
- Output shape is the same whether or not a change happened.

## Worked example — `Modules_Abilities`

**Before: 4 abilities**

```
jetpack-modules/list-modules       input: { active_only?: bool }
jetpack-modules/get-module         input: { slug: string (required) }
jetpack-modules/activate-module    input: { slug: string (required) }
jetpack-modules/deactivate-module  input: { slug: string (required) }
```

Problems:
- `list-modules` only filters on one boolean. If the agent wants "active Security-tagged modules matching 'share'", it takes three round-trips.
- `get-module` duplicates the list's object shape but for N=1.
- `activate` + `deactivate` are a classic verb pair; agents have to branch on intent instead of describing the desired state.

**After: 2 abilities**

```
jetpack-modules/get-modules        input: { slug?, active?, feature?, search? }
                                   output: array of module objects (0..N)

jetpack-modules/set-module-status  input: { slug: required, active: required }
                                   output: { slug, active, changed }
```

Gains:
- 50% fewer slugs.
- Any combination of filters in one call.
- Declarative, idempotent writes: `set-module-status({slug: 'stats', active: true})` is a no-op if already active, a transition otherwise.
- Same return shape on every call.

Lose nothing except the bespoke detail-shape for `get-module` (which was already misaligned with its declared schema anyway).

## When NOT to consolidate

- **Different permission contracts.** Read and write have different `permission_callback`s — never merge them into one ability with a `mode` switch; you'll violate the `meta.annotations.readonly` contract.
- **Different side-effect classes.** Don't merge a cache-invalidation trigger with a data write; one is destructive, one isn't, and `meta.annotations.destructive` has to match.
- **Unrelated domains.** `set-module-status` and `set-module-config` are both writes on modules, but they touch different state — keep them separate.
- **Genuinely different shapes.** If the "detail" variant returns fundamentally different fields (not just a superset), separate abilities are honest. The Modules case didn't meet this bar.

## Checklist before you finalize `get_abilities()`

- [ ] Did you combine `list-X` and `get-X` into `get-Xs` with optional slug/id?
- [ ] Did you combine `<verb>` + `<anti-verb>` pairs into `set-X-<attribute>`?
- [ ] Is every read's return shape the same regardless of which filter is present?
- [ ] Is every write idempotent (no-op when desired == current)?
- [ ] Could a downstream agent answer 80% of its questions in one call per ability?

If the answer to any of the first four is "no" and you don't have a listed exception above, merge further.
