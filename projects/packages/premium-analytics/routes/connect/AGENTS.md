# Connect Route — Agent Guide

Companion to `README.md`. Focuses on the mental model and debugging playbook for Jetpack connectivity issues. When something breaks, always ask: _is it our wiring or the upstream package?_

## Upstream (source of truth)

The connection machinery is not ours — we consume `@automattic/jetpack-connection`. Read the real code before theorizing:

| What                                                         | Where                                                                                                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useConnection` hook                                         | [js-packages/connection/components/use-connection/index.ts](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/connection/components/use-connection/index.ts) |
| Redux store (actions, reducers, controls)                    | [js-packages/connection/state/](https://github.com/Automattic/jetpack/tree/trunk/projects/js-packages/connection/state)                                                          |
| Script data types                                            | [js-packages/connection/types.ts](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/connection/types.ts)                                                     |
| REST routes + permission callbacks                           | [packages/connection/src/class-rest-connector.php](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/connection/src/class-rest-connector.php)                   |
| Capability map (where offline mode blocks `jetpack_connect`) | [packages/connection/src/class-manager.php](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/connection/src/class-manager.php)                                 |

## `useConnection` contract

Call site: `components/connect/connect.tsx`.

We pass `apiNonce`, `apiRoot`, `registrationNonce` from `getScriptData().connection`, plus `redirectUri`, `from: 'jetpack-premium-analytics'`, and `skipUserConnection: true`.

**Why `skipUserConnection: true`:** we only need the site-level blog token to sync aggregated data. No per-user WP.com identity. The flow ends after site registration (`POST /jetpack/v4/connection/register`).

Today we only render `registrationError`. The hook also exposes `isOfflineMode`, `isRegistered`, and `connectionErrors` — these are the building blocks for the WOOA7S-1327 fix.

## Script data

`getScriptData().connection` is populated server-side by the `jetpack-connection` package itself: `Initial_State::set_connection_script_data()` auto-hooks onto the `jetpack_admin_js_script_data` filter (via `Connection_Assets::configure()` on `plugins_loaded`). Because premium-analytics requires `automattic/jetpack-connection` in Composer, this happens for free — no wiring in this package. If it returns `undefined` at runtime, the connection package's assets did not boot, or `JetpackScriptData` was not emitted on the page.

The field that matters most for UX is **`connectionStatus.offlineMode.isActive`**. When true, `permissions.connect` is also false regardless of user role, because `Manager::jetpack_connection_custom_caps()` forces `jetpack_connect` → `do_not_allow`. Full shape: see `types.ts` link above.

## Error channels (don't confuse them)

There are two separate error surfaces:

1. **`registrationError`** — hook-level, populated when `/connection/register` rejects. Shape: `{ message, response: { code } }`. This is all we render today.
2. **`connectionErrors`** — server-side state errors surfaced via script data. Structured with an `action`/`action_url` contract for recovery buttons. **We currently ignore this.**

Known `registrationError` codes:

| Code                                        | Cause                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `invalid_user_permission_jetpack_connect`   | Site in offline/staging mode — **not a real permission issue**. See README Troubleshooting. |
| `invalid_registration_nonce`                | Nonce expired. Hard reload.                                                                 |
| `invalid_blog_token` / `blog_token_invalid` | Stale token in DB. `wp option delete jetpack_options jetpack_private_options`.              |
| `connection_unavailable`                    | Outbound HTTPS to WP.com failed. Check Jurassic Tube / firewall.                            |

## Debugging checklist

Walk in order, stop at the first red flag:

1. **Network tab** → filter `register`. Status code + response `code` field.
2. **`pnpm wp -- jetpack status`** → look for "Offline Mode" banner or `blog token validation failed`.
3. **`pnpm wp -- option get jetpack_options --format=json`** → is `blog_token` present?
4. **Outbound check** → `pnpm wp -- eval 'var_dump( wp_remote_get( "https://jetpack.wordpress.com/" ) );'`. A `WP_Error` here is a container/proxy issue, not our bug.
5. **Clean slate** → `pnpm wp -- jetpack disconnect && pnpm wp -- option delete jetpack_options jetpack_private_options && pnpm wp -- cache flush`.

## Gotchas

- **Offline mode is a capability block, not a network block.** The endpoint responds fast with 403. Don't hunt for network issues when you see `invalid_user_permission_jetpack_connect`.
- **`skipUserConnection: true` means `isUserConnected` stays `false` forever.** Do not use it as a failure signal.
- **Route guards are synchronous** — they cannot fetch. They must rely on the inlined `getScriptData().connection.connectionStatus`.
- **`registrationNonce` is single-use.** Do not cache it across page loads.

## Related

- **WOOA7S-1327** — gate the authorize button on `offlineMode.isActive` so users see an unavailable state instead of a button that always 403s.
- **WOOA7S-1224** — README troubleshooting for the offline-mode 403 (done in the old standalone project).
