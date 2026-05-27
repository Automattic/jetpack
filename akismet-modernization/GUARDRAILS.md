# Guardrails — what the prototype is and is not allowed to do

**Status:** Authoritative. Every plan in this directory must conform. Any agent executing a plan must read this first.

**Last updated:** 2026-05-27

This exploration runs against `Automattic/wpcom` (`wp-content/mu-plugins/akismet-3.0/`). That repo also drives production WPCOM, which hosts millions of Akismet integrations. Guardrails exist so that nothing in this prototype branch can touch production data, even by accident.

---

## Layer 1 — Code-level guardrails (what the running prototype is allowed to do)

The prototype has **three independent wp-config constants**, each defaulting to off. All must be on for the corresponding capability to be enabled.

| Constant | Default | Enables |
| --- | --- | --- |
| `AKISMET_EXPERIMENTAL_UI` | off | **Read-only surfaces.** Admin page, dashboard widget, block, REST read endpoints. Touches no writes. |
| `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` | off | **Comment moderation writes** ("Not spam" / "Delete permanently" in the Activity log). When off, the buttons render and show a "Preview mode — action disabled" notice on click. |
| `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` | off | **Real calls to `blackbox-api.wp.com`.** When off, the PHP handlers return deterministic mocks regardless of whether `AKISMET_BLACKBOX_API_KEY` is defined. |

**Strict rule:** on production WPCOM, none of the three constants is ever defined. The class file is only `require_once`'d when `AKISMET_EXPERIMENTAL_UI` is true (Plan 0 Task 7 Step 2). With no constant defined, the prototype is dead code with zero PHP runtime cost.

### What is allowed (when `AKISMET_EXPERIMENTAL_UI` is on)

| Operation | Endpoint / surface | Why it's safe |
| --- | --- | --- |
| Read existing Akismet config | `apply_filters` / `get_option` | Read-only |
| Read existing Akismet stats from `tools.akismet.com` | `Akismet::http_post( …, 'get-stats' )` | Read-only; no Akismet account mutation |
| Query spam comments | `WP_Comment_Query` with `status = 'spam'` | Read-only SELECT |
| Read comment meta (`_akismet_score`, `akismet_history`) | `get_comment_meta` | Read-only |
| Query WooCommerce orders | `wc_get_orders` | Read-only |
| Read WC fraud meta (`_woofraud_score` etc.) | `get_post_meta` on orders | Read-only |
| Return mocked Blackbox aggregates | local PHP function | Deterministic; never leaves the site |
| Return mocked Blackbox per-session verdicts | local PHP function | Deterministic; never leaves the site |

### What is forbidden (regardless of constants)

| Operation | Why forbidden |
| --- | --- |
| **Writing to the `comments` table** outside the explicit moderation actions in the Activity log, AND only when `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` is on | Production comment data is real user content |
| **Writing comment meta** (`_blackbox_session_id`, anything else) | Mutates real comment records; capturing session IDs at comment time is out of scope and belongs to a separate coordination with `cfinke` |
| **Writing to `wp_options`** (no new options without explicit per-PR review) | Production option table |
| **Writing to WooCommerce orders or order meta** | Production financial / customer data |
| **Calling real `blackbox-api.wp.com` `/v1/verify`, `/v1/report`, or `/v1/collect` endpoints** when `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is off | Each verify call counts against Blackbox quotas + may produce telemetry rows on the Blackbox side |
| **Submitting reports to Blackbox** (`/v1/report`) | Affects Blackbox training data |
| **Modifying `class.akismet-admin.php`, `class.akismet-widget.php`, `class.akismet-rest-api.php`, or the existing `akismet.php` bootstrap** | These are the production Akismet code paths |
| **Adding hooks that fire on production-relevant actions** (`comment_post`, `wp_login`, `woocommerce_checkout_*`) | Risk of side effects on live flows. New hooks may only run inside endpoints gated by the constant set above. |
| **Cron jobs, scheduled actions, transient invalidation** | Background side effects |
| **Sending email, push notifications, slack messages, or analytics events** | External side effects |
| **Logging to anything but `error_log`** with a clear `[akismet-experimental]` prefix | No mixing with production observability |

### Enforcement mechanisms in code

Every plan implements these checks. Reviewers verify them before merge:

1. **REST routes** registered under `akismet/v1/blackbox/*`, `akismet/v1/activity`, `akismet/v1/woocommerce/*`, `akismet/v1/stats/timeseries`:
   - `permission_callback` requires `manage_options`.
   - Class file is only loaded when `AKISMET_EXPERIMENTAL_UI` is true.
   - Mutation handlers reject the request with a `403 preview_mode_active` if `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` is off.
   - Blackbox API proxy handlers short-circuit to the deterministic-mock branch if `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is off, **even if `AKISMET_BLACKBOX_API_KEY` is defined**.
2. **`Akismet_Experimental::allow_mutations()`** and **`Akismet_Experimental::allow_blackbox_api()`** are the single read-points for those two flags. No other code reads the constants directly. A grep for `AKISMET_EXPERIMENTAL_ALLOW_` should match only those two methods.
3. **`Akismet_Experimental::is_enabled()`** is the single read-point for the UI flag. Same grep rule.
4. **Front-end mutation guards**: the Activity log mutation buttons (`useActions`) check `window.akismetExperimental.allowMutations` (localized from PHP). When false, the click renders a `<Notice>` and returns without firing `apiFetch`.
5. **No new `add_action` calls** outside `Akismet_Experimental::init()` and the new Activity class — the experimental code lives in its own namespace, never sprinkled across other Akismet files.
6. **`wp_localize_script` payload audit**: only the public-key Blackbox `clientId` may be exposed to the browser. The Bearer key (`AKISMET_BLACKBOX_API_KEY`) lives in PHP only.

### Tripwire tests

Each plan ships at least one test that confirms a guardrail. Reviewers MUST run these locally before merging:

- `Test_REST_Activity::test_mutation_endpoint_returns_403_when_mutations_off` (Plan 3): hits the mark-as-ham flow with the mutations constant undefined; asserts 403.
- `Test_REST_Blackbox::test_aggregates_returns_mock_when_api_disabled` (Plan 2): defines `AKISMET_BLACKBOX_API_KEY` but leaves `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` off; asserts the response shape is the deterministic mock.
- `Test_Localize::test_bearer_key_not_in_payload` (Plan 0): verifies `wp_localize_script` payload doesn't include the Bearer key under any combination of constants.

---

## Layer 2 — Workflow guardrails (review gates before anything goes public)

**Default: nothing leaves this worktree until you (Devin) preview a running prototype and explicitly approve.**

| Action | Allowed when |
| --- | --- |
| **Commit to this feature branch** (`akismet/experimental-ui-*`) | Always |
| **Push the branch to `github.a8c.com/Automattic/wpcom`** | Always — the branch is a8c-internal and is never deployed to production unless someone explicitly merges to a deploy target |
| **Run the prototype on the user's own sandbox** (Studio, local Docker, internal staging) | Always, with the constants explicitly set |
| **Open a draft PR for code review** | Only after the user confirms the prototype works end-to-end on their machine |
| **File the Linear umbrella issue** | Only after the user explicitly signs off on the prototype + framing |
| **File the time-series endpoint ticket on AKISMET** | Same: only after explicit sign-off |
| **Post anything to akismetp2 / designomattic / blackboxp2 / any other P2** | **Only after the user explicitly says "post to P2"** — and after they've reviewed the draft post |
| **Slack `#akismet` / `#project-blackbox` / `#woo-fraud-protection`** with prototype links or framing | Same as P2 — explicit sign-off |
| **Cross-team review crit** (Akismet + Blackbox + Woo + Jetpack design) | Same |
| **Tag the prototype in any cross-referencing artifact** (Field Guide, OneAutomattic, internal docs) | Same |

In short: **the worktree and the user's machine are the safe zone. Everything outside requires explicit approval.**

### The preview-before-publish workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Spec is approved (you're here, you've signed off)       │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Plan 0 is implemented in a wpcom feature branch          │
│     Commits stay in the branch. Nothing leaves it.           │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Plans 1–4 implemented in the same branch                 │
│     (or split into stacked PRs against the feature branch)   │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. PREVIEW: user spins up sandbox WP site with              │
│     `AKISMET_EXPERIMENTAL_UI` true, walks every screen        │
│     ┌─ Mutations flag stays OFF for this pass                │
│     ┌─ Blackbox API flag stays OFF for this pass             │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
                   ┌───────┴────────┐
                   ↓                ↓
        ┌──────────────────┐  ┌─────────────────────────┐
        │ Needs changes    │  │ Approved for next step  │
        │                  │  │                         │
        │ Iterate in       │  │ User says: "file linear │
        │ branch; back to  │  │ now" / "post to P2 now" │
        │ step 4.          │  │                         │
        └──────────────────┘  └────────────┬────────────┘
                                           ↓
                              ┌────────────────────────────┐
                              │ 5. External publishing      │
                              │    (Linear, P2, Slack,      │
                              │    cross-team review)       │
                              │                             │
                              │    Each external action     │
                              │    requires its own         │
                              │    explicit go-ahead.       │
                              └─────────────────────────────┘
```

### What I (the assistant) will not do unprompted

- Will not call `mcp__ContextA8C__context-a8c-execute-tool` with `linear / create-issue` until the user says "file the umbrella" (or similar explicit go).
- Will not draft or publish P2 posts via the wpcom MCP tools.
- Will not post to Slack via the slack MCP tools.
- Will not push the branch from a worktree to remote without an explicit ask.
- Will not message reviewers (`cfinke`, `bluefuton`, `@dtbecher`, `@luizfreis`, etc.) without explicit ask.

### What I (the assistant) **will** do

- Implement plans, commit to the local feature branch.
- Run tests + report results.
- Draft P2 / Linear bodies (in this worktree, as `.md` files) so the user can review before publishing them.
- Stand up a preview workflow doc that the user can follow step-by-step.

---

## Sandbox setup the user runs locally

When the user wants to preview the prototype, they:

1. Clone the wpcom feature branch into a local Studio / Docker WordPress site:

   ```bash
   git clone -b akismet/experimental-ui-foundation git@github.a8c.com:Automattic/wpcom.git ~/Code/wpcom-akismet-preview
   ```

2. Build the React assets:

   ```bash
   cd ~/Code/wpcom-akismet-preview/wp-content/mu-plugins/akismet-3.0
   npm install
   npm run build
   ```

3. Symlink (or mount) the mu-plugin into a sandbox WP install (Studio, wp-env, local Docker).

4. Add to that sandbox's `wp-config.php`:

   ```php
   // Preview-mode: read-only.
   define( 'AKISMET_EXPERIMENTAL_UI', true );
   // Leave these undefined until ready to test mutations / live Blackbox.
   // define( 'AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS', true );
   // define( 'AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API', true );
   ```

5. Visit `?page=akismet-experimental` and walk through each tab.

**Critically: this sandbox should not be a production WPCOM clone with real customer data.** A fresh sandbox or an explicitly sanitized snapshot is the only acceptable preview environment.

---

## Quick reference

- **Code default**: nothing-mutates, mocked-Blackbox, no-real-API-calls.
- **Workflow default**: nothing publishes externally without explicit user approval per channel.
- **The user's machine + feature branch**: safe zone, no approval required.
- **Anywhere else**: ask first.
