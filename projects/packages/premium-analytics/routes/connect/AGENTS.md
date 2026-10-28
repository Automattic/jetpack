# Connect Route — Agent Guide

Companion to `README.md`. The mental model for how this route relates to Jetpack
connectivity.

## Scope: the plan choice connects the site

The route owns the pre-connection flow: the plan choice, site registration, and the hand-off to authorization or checkout (`use-plan-choice.ts`). It builds on `@automattic/jetpack-connection`'s store and `useConnection`, not on its `ConnectScreen`.

## Where connection state comes from

`getScriptData().connection` is populated server-side by the `jetpack-connection`
package itself: `Initial_State::set_connection_script_data()` auto-hooks onto the
`jetpack_admin_js_script_data` filter (via `Connection_Assets::configure()` on
`plugins_loaded`). Because premium-analytics requires `automattic/jetpack-connection`
in Composer, this happens for free — no wiring in this package. If it returns
`undefined` at runtime, the connection package's assets did not boot, or
`JetpackScriptData` was not emitted on the page (see
`Analytics::ensure_script_data()`).

The underlying field is `connection.connectionStatus.isRegistered`. Full shape:
the connection package's
[`types.ts`](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/connection/types.ts).

## Gotchas

- **Route guards are synchronous** — they cannot fetch. Use
  `isPremiumAnalyticsSiteConnected()` rather than reading the field directly;
  the helper also treats WordPress.com Simple as connected.
