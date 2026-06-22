# Gutenberg RTC (Real-Time Collaboration) — WordPress.com gating

## Overview

Real-Time Collaboration (RTC) lets multiple people edit the same post in the
block editor at once (Google-Docs-style presence, cursors, and live sync). The
**Interface** (avatars/presence/lock messaging) and **Engine** (Yjs/CRDT
conflict resolution) ship in Core/Gutenberg. The **Transport** (how edits move
between collaborators) is the differentiated piece:

- `http-polling` — Gutenberg's built-in default. Works everywhere, heavier on
  the server.
- `pinghub` — WordPress.com WebSockets via the PingHub service. Faster, lighter.
  Implemented in the `automattic/jetpack-rtc` package (`projects/packages/rtc/`).

**This directory does not implement RTC.** It only decides, for WordPress.com
Simple and Atomic sites, *whether* RTC is allowed and *which transport* it uses,
by hooking the filters exposed by the `jetpack-rtc` package.

`gutenberg-rtc.php` is loaded by `Jetpack_Mu_Wpcom::load_wpcom_sites_features()`
(`../../class-jetpack-mu-wpcom.php`), which runs on every Simple and Atomic site
(skipped only for fully-managed agency sites). Its last line calls
`\Automattic\Jetpack\RTC::init()`, which boots the package.

## Files

| File                  | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `gutenberg-rtc.php`   | WP.com gating: hooks `jetpack_rtc_enabled` and `jetpack_rtc_providers`. |

Related code (outside this directory):

- `projects/packages/rtc/` — the `automattic/jetpack-rtc` package. Transport
  (PingHub WebSocket provider), the `wp_collaboration_enabled` option handling,
  the Writing-settings field, REST endpoints, and notices. **The runtime gate
  `RTC::is_enabled()` lives here.**
- `wpcom` repo `wp-content/mu-plugins/wpcom-gutenberg-rtc.php` — the operational
  layer (disallow list, P2 force-enable, PingHub allowlist). See "The wpcom
  layer" below. This file is **not** in the Jetpack monorepo.

## The two gates

A site has RTC running only when **both** are true:

1. **Allowed** — `RTC::is_allowed()` → `apply_filters( 'jetpack_rtc_enabled', false )`.
2. **Turned on** — the `wp_collaboration_enabled` option is truthy
   (Settings → Writing → "Enable real-time collaboration").

`RTC::is_enabled()` (`projects/packages/rtc/src/class-rtc.php`) = `is_allowed()`
**AND** `get_option( 'wp_collaboration_enabled' )` **AND** not in the Site Editor.

The option **defaults to OFF**. When a site is *not* allowed, the Writing field
is unregistered (hidden) and the option value is forced to `0`. So a missing
"Enable real-time collaboration" checkbox means the site is not allowed — not
that the admin forgot to check it.

> Gotcha — super admins who are **not members** of the blog get the option
> forced off everywhere except the Writing settings page (`pre_rtc_option`),
> so HEs/support don't silently broadcast presence on customer sites.

## Layer 1 — this directory (`wpcom_enable_rtc`, priority 10)

`wpcom_enable_rtc()` returns true only when **all** of these hold, and then the
site falls into a rollout:

1. Not the WordPress.com desktop app (UA contains `WordPressDesktop` → disabled;
   known incompatibility).
2. Site has `WPCOM_Features::REAL_TIME_COLLABORATION` — gated to
   **`WPCOM_PERSONAL_AND_HIGHER_PLANS`** (Personal plan and up).
3. `GUTENBERG_VERSION >= 22.7.0`.
4. Site is in a rollout:
   - **Simple** (`IS_WPCOM`) → `wpcom_is_rtc_websocket_rollout()` → allowed, `pinghub`.
   - **Atomic** (`IS_ATOMIC`) without the `wpcom-features-edge` sticker →
     `wpcom_is_rtc_http_polling_rollout()` → allowed, `http-polling`.
   - Any site with the **`wpcom-features-edge`** sticker → allowed, `pinghub`.

`wpcom_rtc_providers()` then forces `['http-polling']` for the Atomic-without-
sticker rollout; everything else keeps the package default `['pinghub']`.

`jetpack_rtc_enable_limit_notices` is forced to `false` on WP.com (the
collaborator-limit upsell notices are off here).

## Layer 2 — the wpcom layer (priority 20)

`wpcom`'s `wp-content/mu-plugins/wpcom-gutenberg-rtc.php` hooks the **same**
filters at priority 20, so it runs **after** Layer 1 and gets the last word:

- **Disallow list** — a hardcoded array of blog IDs. Hard `false` for
  `jetpack_rtc_enabled` and `[]` for providers. Overrides everything, including
  P2s and feature/plan eligibility. This is how a misbehaving site gets RTC
  killed without a deploy of this package.
- **P2 / WP-for-Teams force-enable** — sites whose stylesheet contains `pub/p2`,
  or `\WPForTeams\is_wpforteams_site()`, are allowed via `http-polling`
  regardless of plan/feature. (P2s don't carry the `real-time-collaboration`
  feature, so without this they'd never be allowed.)
- **PingHub allowlist** — a short array of individual blog IDs force-routed to
  `pinghub` for WebSocket testing.
- Otherwise it passes Layer 1's decision through unchanged.

## Behavior by site type

| Site type            | Allowed when…                                                            | Default transport |
| -------------------- | ----------------------------------------------------------------------- | ----------------- |
| **P2 / WP-for-Teams**| Not in the disallow list (force-enabled by the wpcom layer)             | `http-polling`    |
| **Simple** (`IS_WPCOM`) | Has `real-time-collaboration` feature (Personal+) + Gutenberg ≥ 22.7 | `pinghub`         |
| **Atomic** (`IS_ATOMIC`)| Same feature + Gutenberg ≥ 22.7; sticker switches transport          | `http-polling`, or `pinghub` with `wpcom-features-edge` |
| **Self-hosted Jetpack** | Not gated here. `jetpack_rtc_enabled` is `false` unless a plugin opts in | n/a            |

In every case the admin still has to turn the option on, and the disallow list
still wins.

## Runbook — enable / disable RTC for one site

**Enable on a P2** (the common request): confirm the blog ID is **not** in the
disallow list in `wpcom-gutenberg-rtc.php` (remove it if it is), then turn on
Settings → Writing → "Enable real-time collaboration" on the site. (For a quick
WP-CLI nudge of the option, set `wp_collaboration_enabled` to `1`.)

**Enable on a Simple/Atomic site:** make sure the site has a Personal+ plan
(grants `real-time-collaboration`) and is on Gutenberg ≥ 22.7.0; it's then
allowed by rollout, and the admin opts in via Settings → Writing. To put an
Atomic site on WebSockets instead of polling, add the `wpcom-features-edge`
sticker.

**Disable on a specific site:** add its blog ID to `$disallowed_blog_ids` in
`wpcom-gutenberg-rtc.php`. This hides the setting and forces the option off.

**"Is this site blocked?" checklist** (mirrors the most common report — the
Writing setting is missing):

1. Blog ID in the disallow list in `wpcom-gutenberg-rtc.php`? → blocked.
2. P2/WP-for-Teams? → should be allowed unless disallowed.
3. Simple/Atomic without a Personal+ plan? → no `real-time-collaboration`
   feature → not allowed.
4. Gutenberg < 22.7.0 on the site? → not allowed.
5. Super admin not a member of the blog? → option forced off off the Writing page.

## REST endpoints (from the `jetpack-rtc` package)

| Route                                   | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| `POST /wpcom/v2/rtc/pinghub-token`      | Short-lived JWT for the PingHub WebSocket.         |
| `POST /wpcom/v2/rtc-notices/join-request` | Record a blocked non-admin (collaborator limit). |
| `GET  /wpcom/v2/rtc-notices/join-requests` | Admin reads pending join requests.              |
| `POST /wpcom/v2/rtc-notices/join-requests/clear` | Clear join requests.                      |

Max collaborators per room: `jetpack_rtc_max_peers_per_room` (default 3).

## Tests

- `../../../tests/php/features/gutenberg-rtc/Gutenberg_RTC_Test.php` — the gating
  logic in this directory.
- `projects/packages/rtc/tests/php/` — `RTC_Test.php` (option/runtime gate),
  `RTC_Notices_Test.php`, `REST_Pinghub_Token_Test.php`.

## Development

- PHP changes in this directory require a `jetpack-mu-plugin` deploy to reach
  WP.com (it is vendored into the wpcom repo under
  `wp-content/mu-plugins/jetpack-mu-wpcom-plugin/`).
- The **disallow list / P2 force-enable / PingHub allowlist live in the wpcom
  repo**, not here — edit `wp-content/mu-plugins/wpcom-gutenberg-rtc.php` and
  deploy through wpcom for per-site changes (no Jetpack release needed).
- Ownership: Hosting Platform (T-Rex). Coordination in `#collaborative-editing`
  and `#jetpack-rtc-enablement`.
