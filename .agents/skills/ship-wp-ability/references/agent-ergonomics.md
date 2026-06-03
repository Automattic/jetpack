# Agent ergonomics — writing abilities agents actually want to call

Source: Anthropic's ["Writing tools for agents"](https://www.anthropic.com/engineering/writing-tools-for-agents) guidance, applied to the WP Abilities API surface. Abilities are tools. Agents read them token-by-token from a single context window, pick one, call it, and spend more tokens parsing the response. Every byte costs.

Use this alongside `consolidation-heuristic.md` — that file answers *how many abilities*; this one answers *what goes inside each one*.

## Think in workflows, not REST endpoints

> **Anti-pattern:** *"tools that merely wrap existing software functionality or API endpoints — whether or not the tools are appropriate for agents."*

Before spec'ing an ability, ask: **what task is the agent trying to accomplish?** If the answer requires chaining `get-X`, `list-Y`, `get-Z`, and then `do-thing`, you haven't built an ability — you've built a REST client binding. Build the high-leverage compound:

- `schedule-event` (find availability + create event) beats `list-users` + `list-events` + `create-event`.
- `get-customer-context` (recent orders + open tickets + last contact) beats `get-customer` + `list-orders` + `list-tickets`.
- `set-module-status` (check current + transition if needed + return change) beats `get-module` + `activate-module` + `deactivate-module`.

Wrap the agent's *intent*, not the *REST controller*.

## Descriptions are specs, not labels

> *"Write as if explaining to a new team member, making implicit context explicit."*

- Bad: `'description' => __( 'Activate a module.', ... )`.
- Good: `'description' => __( 'Activate a Jetpack module by slug. Returns { slug, active, changed }. Idempotent — already-active modules return changed=false. Requires a Jetpack connection; modules that require a paid plan will fail with jetpack_modules_activate_failed and should be retried only after the plan is upgraded.', ... )`.

Include:
- **Return shape** in words (fields, types, when empty).
- **Idempotency / side-effect** language (even if also in `meta.annotations`).
- **Required preconditions** (connection, plan, capability, setting).
- **Relationship hints** — what other abilities are typically called before or after.
- **Vocabulary definitions** — if the ability uses a term of art (`slug`, `feature tag`, `response status`), define it inline the first time.

Descriptions are what the agent reads at decision time. The agent has no docs.

## Parameter names are contracts

- **Semantic over generic.** `module_slug` or just `slug` in a `jetpack-modules/*` namespace is fine; `value` or `name` is not.
- **No overloading.** A parameter called `filter` that accepts both a string and an array, or means "filter" sometimes and "search" others, is a trap. Split it.
- **`additionalProperties: false`** on every input schema. Typos become errors with actionable messages instead of silent no-ops.
- **Required only what's truly required.** Optional filters should be optional. Don't force the agent to pass `{ include: null }`.

## Response shapes: high signal, semantic IDs, stable contract

> *"Return only high signal information back to agents."* + *"Merely resolving arbitrary alphanumeric UUIDs to more semantically meaningful and interpretable language... significantly improves Claude's precision."*

Rules:

- **High-signal only.** Cut `mime_type`, internal `_meta`, numeric DB ids agents can't act on, and every field the agent's next likely call won't consume. Every field costs context.
- **Prefer human-readable identifiers.** Module `slug` beats `term_id`. Post `slug` beats `post->ID` when both are stable.
- **Same shape every call.** Never return a summary when called one way and a detail object when called another. Use an optional filter param for verbosity (below), not input-dependent shape-shifting.
- **Sort deterministically.** Agents do diff-based reasoning; unstable ordering forces them to sort client-side or re-query.

### The `response_format` pattern

When there's genuine demand for both concise and detailed output, expose the choice — don't branch on unrelated inputs:

```php
'response_format' => array(
    'type'        => 'string',
    'enum'        => array( 'concise', 'detailed' ),
    'default'     => 'concise',
    'description' => __( 'concise returns slug, name, active. detailed adds plan requirements, feature tags, connection state.', 'jetpack' ),
),
```

The execute callback branches on this; the output_schema documents both shapes via `oneOf`. Agents pick what they need.

## Pagination and token ceilings

> *"Implement pagination, range selection, filtering with sensible default parameter values."* + Claude Code defaults to 25,000 token response limits.

Even if the underlying data is small today, it won't stay small. On every list-shaped read:

- Accept `page` + `per_page`, or a `limit` + `cursor` pair.
- Set `per_page` `default` to ~20 and `maximum` to 100. Document both in the schema.
- In the callback, enforce the maximum — never trust schema validation alone.
- When the response is truncated, include `{ has_more: true, next_cursor: '...' }` or `{ total: N, returned: M }` so the agent knows to paginate.

For modules specifically (~30 items), full lists are fine today. For Forms responses, Stats, Subscribers — paginate from day one.

## Errors that guide the next call

> *"Clearly communicate specific and actionable improvements."* Errors are how you steer the agent away from dead-ends.

- **Code** uses the shared vocabulary (`<plugin>_missing_<field>`, `<plugin>_invalid_<field>`, `<plugin>_not_initialized`, `<plugin>_<resource>_data_unavailable`) — see `wp-abilities-api/references/error-code-vocabulary.md`.
- **Message** tells the agent *what to do next*. Not `"Invalid input."` → `"Unknown Jetpack module slug. Call jetpack-modules/get-modules to enumerate available slugs."` Note the cross-ability hint.
- **Never return stack traces or PHP warnings** — they're noise that crowds out actionable signal.
- **For transient failures** (network, rate limit, plan-upgrade-in-progress), say so — agents can retry with backoff when they know it's transient.

## Anti-patterns specific to WP Abilities

1. **Returning `$mod` verbatim from `Jetpack::get_module()`** — it's a dump of internal fields (`module_tags`, `changelog URL`, plan classes) most agents ignore. Summarize.
2. **Returning full `WP_Post` objects** — `post_content_filtered`, `post_password`, `to_ping`, `guid` are noise. Build a summary.
3. **Exposing raw option keys** (`jetpack_options[registered]`) — opaque and schema-less.
4. **Letting REST schema leak through** — the Abilities input schema should be tailored to agent intent, not a copy of the backing controller's schema. Rename, drop, and default aggressively.
5. **UUID-shaped IDs when a slug works** — `a1b2c3d4-...` is three times the tokens of `contact-form`.
6. **Two abilities that differ only by verb** (activate/deactivate, enable/disable) — consolidate into one `set-<attribute>` with a required state param (see `consolidation-heuristic.md`).
7. **Abilities named after REST endpoints** (`get-jp-v2-modules`) instead of agent intent (`get-modules`).
8. **Optional parameters that behave differently when absent vs `null` vs empty string** — the Abilities API doesn't inject defaults; normalize at the top of every execute callback.

## Checklist before you finalize each ability

- [ ] The description reads like onboarding docs for a new engineer — return shape, idempotency, preconditions, related abilities.
- [ ] Parameter names are semantic within the namespace and unambiguous across abilities.
- [ ] `additionalProperties: false` on the input schema.
- [ ] Output is high-signal — every field answers a question the agent will ask.
- [ ] Identifiers are human-readable (slug, name) over opaque (UUID, numeric DB id) where both are stable.
- [ ] Lists paginate by default or are provably bounded forever.
- [ ] Error codes follow the shared vocabulary and error messages tell the agent what to do next, not just what went wrong.
- [ ] No REST controller response shape leaks through unadapted.
- [ ] The ability wraps the agent's intent, not an underlying API method.
