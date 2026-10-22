# Connectors screen card

WordPress 7.0 introduces a core **Connectors** screen (`wp-admin/options-connectors.php`) where sites manage their connections to external cloud services. The Connection package registers a Jetpack card on that screen so users can view and manage their WordPress.com connection from a single, native location.

The relevant class is `Automattic\Jetpack\Connection\Jetpack_Connector`.

> **Requirements:** The Connectors registry (`wp_connectors_init` / `WP_Connector_Registry`) ships with WordPress 7.0+. On older versions the registration hook never fires and the script module is never enqueued, so everything below is a safe no-op. The card also works with the Connectors screen provided by the Gutenberg plugin.

## How it works

`Jetpack_Connector::init()` is called automatically when you configure the connection package (it runs from `Manager::configure()`), so no extra setup is required in your plugin. Initialization wires up three things:

1. **Connector registration** — on `wp_connectors_init`, registers a `wordpress_com` connector (a `cloud_service` type with `authentication.method = none`) in the core registry.
2. **Script module** — on the Connectors admin screen, enqueues the `@automattic/jetpack-connection-connectors` script module (and its stylesheet), which provides a custom render function for the card. The module is built by webpack into `dist/connectors/`, and its `connectors-card.asset.php` lists the script modules (`module_dependencies`) and classic scripts (`dependencies`) it imports; the classic scripts are enqueued beside it. If either built file is missing, the card is skipped. The Tracks script (`jp-tracks`, w.js) is enqueued too when tracking is allowed (`Tracking::should_enable_tracking()`, as on My Jetpack), so the shared components' events are recorded. The card identifies the viewer to Tracks by their WordPress.com account (`initializeTracksIdentity()`), so dialogs that don't do it themselves still attribute their events.
3. **Auth error capture** — on `jetpack_client_authorize_error`, stores the error so it can be surfaced in the card after an authorization attempt.

## What the card shows

Depending on connection state, the card surfaces:

- **Connection / registration status** — whether the site is registered (has a blog token) and connected (registered _and_ has a connected owner), and whether it is in offline mode.
- **Site details** — blog ID, site URL, and home URL once registered.
- **Your account** — the viewer's WordPress.com name, login, email, and avatar, and whether they own the connection.
- **Connection owner** — name and avatar, linked to their profile when the viewer can edit that user.
- **Connected plugins** — the plugins currently sharing the connection.
- **SSO status** — when the Jetpack plugin is connected.
- **Safe Mode / Identity Crisis** — when the site is in Safe Mode, the status badge swaps to "Safe Mode" and the card renders the resolution options (migrate / start fresh / stay in safe mode).
- **Hosting context** — `isWoaSite` and `isVipSite` flags.
- **Auth errors** — any error captured from the last authorization attempt.

Connect and disconnect actions performed from the card go through the package's existing connection REST endpoints. Connecting and disconnecting are disabled while the site is in offline mode.

**Disconnect site** opens the package's shared `DisconnectDialog`, the same one My Jetpack shows: it lists the connected plugins and links to help. The card leaves out the dialog's disconnect survey by not passing `connectedSiteId`. Its Tracks events carry `context: connectors`. The Safe Mode panel's disconnect keeps its own confirmation, which explains that only this site's stale connection is cleared.

## Where the card's data comes from

The card reads connection state from the `jetpack-connection` store, which `Initial_State` fills, so it shows the same facts as the package's own components on the screen (the transfer and protected-owner dialogs):

| Card shows                | Store source                                                                                                                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registered / connected    | `getConnectionStatus()` — `isRegistered`, `hasConnectedOwner`                                                                                                                                                                                                                             |
| Safe Mode                 | `getConnectionStatus()` — `isInSafeMode`                                                                                                                                                                                                                                                  |
| Offline mode              | `getIsOfflineMode()`                                                                                                                                                                                                                                                                      |
| Blog ID, first connection | `getBlogId()`, with `isRegistered`                                                                                                                                                                                                                                                        |
| Your account              | `getUserConnectionData().currentUser`, with `isUserConnected` from the status. Its local `displayName` and `email` fill in when the WordPress.com lookup fails                                                                                                                            |
| Connection owner          | `getConnectionOwner()` — only for users with `jetpack_connect`. It comes from the `master_user` option, so the card shows it, and your account, only while the owner's token works (`hasConnectedOwner`). Other viewers get the name alone from `getUserConnectionData().connectionOwner` |
| Connected plugins         | `getConnectedPlugins()`                                                                                                                                                                                                                                                                   |

Everything else is card-only and comes from `Jetpack_Connector::get_connector_data()` through the `script_module_data_@automattic/jetpack-connection-connectors` filter. Some of it stays there because the store has no equivalent:

- `connectionOwnerEditUrl` — the owner's profile URL, or null when the viewer may not open it (no `jetpack_connect` outside offline mode, or no `edit_user`, as for multisite site admins).
- `pluginLogos` — logo URLs by plugin slug, which third parties add through the `jetpack_connection_plugin_logos` filter.
- `apiRoot` / `apiNonce` — the store drops these from its initial state and has no selector for them.

The rest — site and home URLs, SSO status, Safe Mode details, protected-owner state, hosting flags, auth errors, the connector's name, description, and logo, the redirect path, and the connected users link — is specific to the card. Card-only data is not added to `Initial_State`, which every consumer of the connection package receives.

Actions that change only store data update the card in place, such as a non-owner disconnecting their own account. Actions that also change card-only data reload the page.

## Customization

Consumers can adjust the card-only payload by hooking the `script_module_data_@automattic/jetpack-connection-connectors` filter.

The Safe Mode / Identity Crisis data mirrors what `\Automattic\Jetpack\IdentityCrisis\UI::get_initial_state_data()` provides, and is only added when the `Identity_Crisis` class is available and the site is actually in Safe Mode.
