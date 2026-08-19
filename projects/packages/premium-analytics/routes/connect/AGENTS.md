# Connect Route — Agent Guide

Companion to `README.md`. The mental model for how this route relates to Jetpack
connectivity.

## Scope: detect, don't connect

This route does **not** implement a connection flow. It reads the connection
state from script data and, when the site is not connected, renders the
`SiteNotConnected` screen. Actually connecting the site is the consumer's job
(the Premium Analytics plugin, or Jetpack), built on
`@automattic/jetpack-connection` (`ConnectScreen` / `useConnection`).

If you are tempted to add an authorize button, registration call, or
offline-mode handling here, stop — that belongs to the consumer. The package
exists to avoid each consumer rebuilding the dashboard, not to own the connect
UX.

## Where connection state comes from

`getScriptData().connection` is populated server-side by the `jetpack-connection`
package itself: `Initial_State::set_connection_script_data()` auto-hooks onto the
`jetpack_admin_js_script_data` filter (via `Connection_Assets::configure()` on
`plugins_loaded`). Because premium-analytics requires `automattic/jetpack-connection`
in Composer, this happens for free — no wiring in this package. If it returns
`undefined` at runtime, the connection package's assets did not boot, or
`JetpackScriptData` was not emitted on the page (see
`Analytics::ensure_script_data()`).

The field the guards key off is
`connection.connectionStatus.isRegistered`. Full shape: the connection package's
[`types.ts`](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/connection/types.ts).

## Gotchas

- **Route guards are synchronous** — they cannot fetch. They rely entirely on the
  inlined `getScriptData().connection.connectionStatus`.
- **Don't reintroduce a custom connect screen.** A custom design was used in the
  standalone Woo Analytics app; under Jetpack we defer to the shared connection
  components instead.
