# Capability-Gate Tracing

How to resolve the actual capability (or capabilities) a plugin's REST
controllers gate on. The audit's `capability_gate` field and each ability's
`permission.resolves_to` field need to reflect reality, not what the
controller docblock says.

Validation runs against multiple plugins surfaced two common mechanisms —
document both explicitly so the auditor doesn't hard-code single-cap-style
assumptions.

## Mechanism A — Direct (`check_permission()` returning a single cap)

The base REST controller declares a `check_permission()` (or
`permissions_check()`) method that calls `current_user_can('<some_cap>')`
once. Every route in the controller uses that method as
`permission_callback`.

### Identifying signs

- The base controller has a method like:
  ```php
  public function check_permission() {
      return current_user_can( 'manage_options' );
  }
  ```
- Controllers extend the plugin's own base, not a WordPress core or
  third-party post-type-backed class.
- The grep `grep -n 'current_user_can' <base-controller>.php` yields one hit.

### How to trace

```bash
# Locate the base controller (usually the parent of every REST controller).
grep -rn 'extends .*REST_Controller' includes/ | head

# Read its permission_callback implementation.
grep -n 'check_permission\|permissions_check' <base-controller>.php
```

Trace once: the single `current_user_can()` call is the plugin's gate.

### How to represent in the audit

```yaml
capability_gate: manage_options  # confirmed at includes/admin/class-<plugin>-rest-controller.php line 64
```

Worked example: a plugin where every controller inherits a
`<Plugin>_REST_Controller::check_permission()` method that resolves to a
single `current_user_can('<cap>')` call. One gate, one trace, one record.

## Mechanism B — Post-type-backed (CPT permission helpers)

The controller extends a WordPress core or in-house base class that
dispatches to the post-type capability map. There is no local
`check_permission()` — the permission callback resolves dynamically at
request time based on the request context (read vs write) and the post
type's `cap` object.

### Identifying signs

- The controller's base class is one of:
  - `WP_REST_Posts_Controller` (WordPress core)
  - `WP_REST_Controller` with a CPT-driven `permission_callback`
  - A plugin-specific base extending one of the above.
- No local `check_permission()` — permission callbacks are inherited.
- The post type is registered with `capability_type => '<cpt-base>'` and
  meta caps are mapped (usually by `map_meta_cap` in core).

### How to trace

```bash
# Find the post-type registration.
grep -rn "register_post_type\s*(\s*['\"]<cpt-slug>['\"]" .

# Check the capability_type and meta caps configuration.
# The caps bag typically looks like:
#   capability_type => '<cpt-base>'
# which means the post type's caps map to read_private_<cpt-base>s /
# edit_<cpt-base>s via core's map_meta_cap (or a plugin filter that
# customizes the mapping).
```

Dynamic resolution typically lands at:

- **Read context** (GET list / GET item): `current_user_can('read_private_<type>s')` or `current_user_can('read_<type>', $id)`.
- **Write context** (POST / PUT / DELETE): `current_user_can('edit_<type>s')` or `current_user_can('delete_<type>s', $id)`.

The two often differ — post-type-backed plugins routinely have distinct read
and write caps.

### How to represent in the audit

Use the structured `{read, write}` form from `audit-schema.md`:

```yaml
capability_gate:
  read: read_private_<cpt-base>s
  write: edit_<cpt-base>s
  confirmed: true
  verified_at: "<cpt-slug> capability_type='<cpt-base>' → core map_meta_cap()"
```

In each ability's `permission` block, spell out both calls:

```yaml
permission:
  callback: get_items_permissions_check
  resolves_to: "permission helper for '<cpt-slug>', 'read' → current_user_can('read_private_<cpt-base>s')"
  confirmed: true
```

Worked example: a plugin that registers a CPT (`<cpt-slug>`) with a
`capability_type='<cpt-base>'`, so reads gate on `read_private_<cpt-base>s`
and writes gate on `edit_<cpt-base>s`. The audit captures both.

## Compound-string form (accepted, not preferred)

Some earlier audits encoded compound gates as a single string with a `/`
separator:

```yaml
capability_gate: read_private_<cpt-base>s / edit_<cpt-base>s
```

This is accepted for backwards compatibility, but:

- Downstream consumers have to heuristically split on `/`.
- YAML comments after the string are silently dropped by strict parsers, so
  provenance gets lost.
- The `{read, write}` object form is machine-parseable and carries
  `confirmed` and `verified_at` in-band.

Prefer the structured form for any new audit.

## Procedure — trace every route you'll back

For each proposed ability, walk the chain once:

1. Find the route's `permission_callback` in the controller.
2. Determine whether it's Mechanism A (local method, single cap) or
   Mechanism B (inherited, post-type-backed, dynamic).
3. Resolve to the actual `current_user_can()` call(s). For B, resolve BOTH
   read and write if the ability crosses contexts.
4. Record in the ability's `permission.resolves_to` field verbatim — the
   string should read as an actual trace, not a best-guess summary.
5. If every route in the plugin resolves to the same cap (or same
   `{read, write}` pair), hoist it into the top-level `capability_gate`. If
   any route diverges, record the divergence in "Notes and Surprises".

## Common pitfall — `permission_callback => '__return_true'`

Zero-arg public endpoints sometimes declare `permission_callback =>
'__return_true'` at the REST layer (e.g. status lookups, enumerated lists
that are safe to expose). The audit still needs a gate:

- Record the REST-layer value as-is (`resolves_to:
  "__return_true (public)"`) so the auditor isn't hiding reality.
- Add a risk note: the **ability** registration must NOT copy
  `'__return_true'` — the ability's own `permission_callback` must match the
  plugin's admin gate (e.g. `manage_options`, `edit_pages`). The ability
  layer is the agent-facing surface and needs that gate even when the
  underlying REST route is public.
