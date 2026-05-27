# Akismet UI Exploration — "What if Akismet were the WordPress Trust Layer?"

**Owner:** Devin Walker (devin.walker@a8c.com) — owner of the [Jetpack Experience Unification](https://linear.app/a8c/initiative/jetpack-experience-unification-2c58a9bef240) initiative.

**Status:** Internal R&D / exploration. **No production ship target.** Read-only by default. Nothing publishes to P2 / Linear / Slack until explicit owner sign-off — see [**GUARDRAILS.md**](./GUARDRAILS.md).

---

## ⚠️ Read first

1. [**GUARDRAILS.md**](./GUARDRAILS.md) — what the prototype is and isn't allowed to do, plus the review-gate workflow that defers external publishing until you preview and approve. Every plan in this directory conforms to these rules.
2. [**strategy.md**](./strategy.md) — the thesis the prototype is in service of.

---

## Start here

Read [**strategy.md**](./strategy.md) first. It articulates the thesis the rest of this directory is in service of:

> Akismet's brand, distribution, and trust position in WordPress are bigger than its product surface area. **Blackbox is the technology that lets Akismet expand from "comment spam filter" to "WordPress trust layer" — protecting against the full spectrum of bad-actor traffic, with WooCommerce fraud as the wedge market.**

The prototype's job is to make that thesis legible. If reviewers can see the unified-threat picture in 60 seconds and immediately understand that "of course Akismet handles logins / checkouts / forms / bots, because Akismet is what protects the site" — the IA works. If they have to be told, the IA is wrong and we iterate.

## What the prototype shows

The exploration delivers a new admin page (`?page=akismet-experimental`) gated by a wp-config constant. Inside it:

- **A unified threat dashboard** ([Plan 2](./02-dashboard-charts.md)) with **six category cards**: Comments · Forms · Logins · Checkouts/Fraud · Bots · Brute-force. Each card shows blocked / challenged / passed counts and degrades gracefully when its data source isn't wired up or its upstream integration (e.g., WooCommerce) isn't installed. Comment spam is one card of six.
- **A dedicated WooCommerce panel** below the cards (when WC is detected). Orders challenged, blocked checkouts, top fraud signals, chargebacks-averted estimate. The most product-meaningful demo of the pivot because it's measurable in dollars.
- **A unified Activity log** ([Plan 3](./03-dataviews-moderation.md)) with category filter — one table for every blocked or challenged event regardless of source. Comment spam, blocked checkout attempts, challenged logins all share the same row shape. Clicking through shows the Akismet content rules and/or Blackbox signals that fired.
- **A modernized wp-admin dashboard widget + Gutenberg block** ([Plan 4](./04-dashboard-widget.md)). Widget shows the unified "threats handled" number, not a comment-only count. Block keeps the original purpose: a public-facing spam counter.
- **A modernized account + settings flow** ([Plan 1](./01-settings-connect.md)).
- **All of it built on the Jetpack Experience Unification stack** ([Plan 0](./00-foundation.md)): `@wordpress/admin-ui`, `@wordpress/ui` Tabs, `@wordpress/dataviews`, `@automattic/charts`, TanStack React Query.

What this prototype is **not** trying to do, on purpose:

- Ship to wp.org. That's a later decision after the prototype is reviewed.
- Replace any existing security plugin. That's a market choice for the production track.
- Cover every category exhaustively. Six categories with real-or-clearly-mocked data is enough to test the IA; production data wiring is the production team's problem.
- Lock in pricing, packaging, or brand. Out of scope.

## What's real vs mocked in the prototype

| Category | Data source | State in prototype |
| --- | --- | --- |
| **Comments** | `akismet/v1/stats/{interval}` (real today) + new `akismet/v1/stats/timeseries` ([endpoint spec](./endpoint-spec-stats-timeseries.md)) | **Real** for totals; mocked for time-series until the new endpoint ships |
| **Forms** | TBD with AKISMET eng (Akismet currently scores some form submissions; no unified view) | **Mocked** with "preview data" badge |
| **Logins** | Blackbox at `wp-login.php` — live on ~7% of WPCOM login traffic; new `akismet/v1/blackbox/aggregates` (proxy) | **Mocked** for the prototype's site-level aggregates; real on wpcom-routed traffic |
| **Checkouts/Fraud** | WooCommerce Fraud Protection v0.1.x (in WC 10.6 alpha) | **Real** if WC + WFP installed; mocked otherwise with "preview data" badge |
| **Bots** | Blackbox edge + `X-Edge-Blackbox-Score` header | **Mocked** for aggregates; signal source live at the CDN |
| **Brute-force** | Login behavioral biometrics + velocity rules | **Mocked** for aggregates |

Every mocked surface is **visibly labeled** in the UI (small "preview data" badge or "not active here" empty state) so reviewers never confuse mocks with real numbers. The strategy is: real-or-honest-mock, never silent-fake.

## Where the code lives

Decisive finding: **there is no single "Akismet plugin" git repo.** Development happens in two coupled internal repos:

1. **Primary dev location:** `github.a8c.com/Automattic/wpcom` at `wp-content/mu-plugins/akismet-3.0/`. (Example PR: `Automattic/wpcom#170796`.) New work lands here first.
2. **Plugin source repo:** `github.a8c.com/Akismet/akismet` (separate `Akismet` GHE org). Diffs are backported here from wpcom, then SVN-synced to `https://plugins.svn.wordpress.org/akismet/`.
3. **Public read-only mirror:** `common-repository/akismet` (auto-mirror of WP.org SVN).

The wpcom path is the right home for this exploration: it's a8c-internal, where the active Akismet engineers operate (`cfinke`, `bluefuton`, `derekspringer`, `andyperdomo`), and where Blackbox server code (`blackbox.api/`) already lives so we can cross-call without repo gymnastics.

## Internal-only access (three independent gates)

The prototype registers a **separate admin page** (`?page=akismet-experimental`), not a toggle on the existing settings page. The legacy `?page=akismet-key-config` page, `class.akismet-admin.php`, `class.akismet-widget.php`, and `akismet.php` bootstrap are **never touched**.

Three independent wp-config constants gate the prototype, each defaulting to OFF. See [GUARDRAILS.md](./GUARDRAILS.md) for the full enforcement story.

| Constant | Default | Enables |
| --- | --- | --- |
| `AKISMET_EXPERIMENTAL_UI` | off | Read-only surfaces. Admin page, dashboard widget, block, REST read endpoints. |
| `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` | off | Comment moderation writes ("Not spam" / "Delete permanently"). With it off, the buttons render and click-results-in "Preview mode — action disabled." |
| `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` | off | Real calls to `blackbox-api.wp.com`. With it off, the PHP handlers return deterministic mocks regardless of whether a Bearer key is defined. |

**Production WPCOM must never define any of these.** With no constant defined, the experimental class file isn't even `require_once`'d — zero PHP runtime cost.

Production users shouldn't even *find* this UI. If the prototype graduates from exploration to product, a different opt-in mechanism (Jetpack experiments flag, %-rollout gate) gets layered on top; the exploration code remains as a reference.

## Current Akismet UI (the thing we're not touching)

Surveyed via `common-repository/akismet` (auto-mirror of WP.org SVN, plugin version `5.4.0a5`).

| Surface | File(s) today |
| --- | --- |
| Top-level entry / router | `class.akismet-admin.php:1025` (`display_page()`) |
| Settings + snapshot stats | `class.akismet-admin.php:1084` → `views/config.php` (iframe + tiles) |
| Full stats | `views/stats.php` (iframe only) |
| Start / connect (no key) | `views/{start, connect-jp, enter, setup, get}.php` |
| Spam comments list | core `edit-comments.php?comment_status=spam` |
| Dashboard "At a Glance" | `class.akismet-admin.php:364, 384` |
| Sidebar widget | `class.akismet-widget.php` (classic, no block) |
| REST API (already exists, unused by UI) | `class.akismet-rest-api.php` |

`akismet/v1/stats/<interval>` returns `{ spam, ham, missed_spam, false_positives, accuracy, time_saved }` for intervals `all`, `60-days`, `6-months`. No time-series, no per-category breakdown, no Blackbox.

## Target stack

| Concern | Package | Notes |
| --- | --- | --- |
| Page shell | `@wordpress/admin-ui` `<Page>` | `.admin-ui-page` scroll container |
| Tabs | `@wordpress/ui` `Tabs.Root` (v0.11.0+) | sticky tab row, Boost/Social precedent |
| Theme tokens | `@wordpress/theme` `ThemeProvider` | WPDS tokens |
| Forms / inputs | `@wordpress/components` + `@wordpress/ui` | |
| Charts | `@automattic/charts` | WPDS-tokenized |
| Tables | `@wordpress/dataviews` | exemplar in `projects/packages/activity-log/src/js/components/ActivityLog/index.tsx` |
| Data fetching | `@tanstack/react-query` ^5.90 | exemplar in `projects/packages/backup/src/js/index.js` |
| REST client | `@wordpress/api-fetch` | |
| Footer | `<JetpackFooter>` from `@automattic/jetpack-components` | only when Jetpack is present |
| Build | `@wordpress/scripts` | standard WP plugin toolchain |
| Blackbox SDK | `blackbox-js` (a8c-internal `github.a8c.com/Automattic/blackbox-js`) | for any client-side Blackbox surfaces |
| Blackbox verify | `POST https://blackbox-api.wp.com/v1/verify/{sessionId}` (Bearer) | server-to-server only; Bearer key never sent to browser |

### Why not the full wp-build chassis from JETPACK-1616?

`@automattic/jetpack-wp-build-polyfills` is in-tree at jetpack-monorepo and unpublished. Pulling it into `Automattic/wpcom` requires extracting it first. The visible UX is identical without it. We use `@wordpress/scripts` and reproduce the page-shell pattern by direct composition of `<Page>` + `Tabs.Root` + `<JetpackFooter>`. Revisit when the polyfill is published.

## Reference implementations to study

| Pattern | Path (in `Automattic/jetpack` monorepo) |
| --- | --- |
| Page shell (`<Page>` from `@wordpress/admin-ui`) | `projects/packages/backup/src/dashboard/components/dashboard-layout/index.tsx` |
| Query client setup | `projects/packages/backup/src/js/index.js` |
| DataViews (fields, filters, persistent views) | `projects/packages/activity-log/src/js/components/ActivityLog/index.tsx` |
| `@automattic/charts` integration | `projects/packages/my-jetpack/_inc/components/stats-section/chart.tsx` |
| Tab routing (`?tab=`) | `projects/plugins/boost/_inc/components/boost-page.tsx` |

## The plans

| # | Plan | Description |
| --- | --- | --- |
| 0 | [Foundation](./00-foundation.md) | Build pipeline, `?page=akismet-experimental` gated by `AKISMET_EXPERIMENTAL_UI`, React shell, REST adapter, Blackbox client adapter shell |
| 1 | [Settings + Connect](./01-settings-connect.md) | Account tab (API-key entry, connect-via-Jetpack) + Settings tab |
| 2 | [**Unified Threat Dashboard**](./02-dashboard-charts.md) | Six category cards (Comments, Forms, Logins, Checkouts, Bots, Brute-force) + dedicated WooCommerce panel. **The most important plan for the thesis.** |
| 3 | [**Activity Log**](./03-dataviews-moderation.md) | `@wordpress/dataviews`-powered table covering every category. Comment spam is one row shape among many. |
| 4 | [Dashboard widget + Block](./04-dashboard-widget.md) | Unified-threat wp-admin dashboard widget; `akismet/spam-counter` block (public-facing) |

Plan 0 must land first; 1–4 can run in parallel.

Supporting docs:

- [strategy.md](./strategy.md) — thesis + market frame + open product questions
- [GUARDRAILS.md](./GUARDRAILS.md) — code-level + workflow guardrails (read first)
- [react-query-conventions.md](./react-query-conventions.md) — canonical React Query patterns (query keys, mutations, error handling, testing). Mandatory reading for Plans 1–4.
- [blackbox-notes.md](./blackbox-notes.md) — Blackbox architecture + API + privacy posture
- [endpoint-spec-stats-timeseries.md](./endpoint-spec-stats-timeseries.md) — proposed `akismet/v1/stats/timeseries` REST contract

## Linear (deferred — review gate)

**Nothing is filed in Linear yet.** Per [GUARDRAILS.md](./GUARDRAILS.md) §"Workflow guardrails," the umbrella issue is filed only after the owner previews a running prototype and explicitly says "file the umbrella."

When that go-ahead comes, the issue lives under the **AKISMET** team, project **Ongoing UI/IA Alignment – Jetpack**, owner devin.walker. Cross-linked to:

- Initiative: [Jetpack Experience Unification](https://linear.app/a8c/initiative/jetpack-experience-unification-2c58a9bef240)
- Project: [Project Blackbox](https://linear.app/a8c/project/project-blackbox-a7417d3a2e82) (lead `@dtbecher`)
- Folded-in tickets: [AKISMET-95](https://linear.app/a8c/issue/AKISMET-95) (line chart), [AKISMET-96](https://linear.app/a8c/issue/AKISMET-96) (block to replace widget)
- Reference: [JETPACK-1616](https://linear.app/a8c/issue/JETPACK-1616) (wp-build chassis consolidation)

The time-series endpoint ticket ([endpoint-spec-stats-timeseries.md](./endpoint-spec-stats-timeseries.md)) is filed separately on the same go-ahead.

## Coordination & open questions (all deferred behind the review gate)

Per [GUARDRAILS.md](./GUARDRAILS.md), every cross-team conversation below is **paused** until you preview the prototype and explicitly green-light the outreach. Drafts are prepared in this worktree; nothing leaves it until then.

1. **Endpoint sign-off:** the new `akismet/v1/stats/timeseries` proposal in [endpoint-spec-stats-timeseries.md](./endpoint-spec-stats-timeseries.md) needs AKISMET buy-in (`cfinke`, `bluefuton`). Draft body lives in that file's bottom section, ready to file.
2. **Blackbox sandbox client for the prototype:** the prototype works on deterministic mocks today. A sandbox Bearer key from `@dtbecher` is only needed if/when you want to exercise the `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` path.
3. **Comment-time `_blackbox_session_id` capture** for the Activity log's Blackbox-enriched comment rows: coordinate with Akismet eng (`cfinke`) and Blackbox eng (`@dtbecher`). Out of scope for this prototype; flagged for the production track.
4. **WooCommerce Fraud Protection data shape:** what the WC 10.6 alpha exposes and how the prototype reads it. Coordinate with `@luizfreis`, `@tautvidas`. Until then, the WooCommerce panel reads from `wc_get_orders` (read-only) with a TODO for the real `_woofraud_score` integration.
5. **Cross-team review crit:** single combined Akismet + Blackbox + Woo + Jetpack-design session, scheduled only after Plans 0–3 are running locally and you've signed off on the framing.

## What I want from reviewers of this exploration

Same questions as [strategy.md](./strategy.md) §"What I want from reviewers of this thesis," plus:

- Does the unified-threat dashboard read as obvious-extension-of-Akismet, or as bolt-on-confusion?
- Is the WooCommerce panel the right shape, or does it want to be its own tab / page / plugin?
- Where does the prototype's IA break? Specific tab / row / card that doesn't carry its weight?
