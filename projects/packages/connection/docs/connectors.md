# Connectors screen card

WordPress 7.0 introduces a core **Connectors** screen (`wp-admin/options-connectors.php`) where sites manage their connections to external cloud services. The Connection package registers a Jetpack card on that screen so users can view and manage their WordPress.com connection from a single, native location.

The relevant class is `Automattic\Jetpack\Connection\Jetpack_Connector`.

> **Requirements:** The Connectors registry (`wp_connectors_init` / `WP_Connector_Registry`) ships with WordPress 7.0+. On older versions the registration hook never fires and the script module is never enqueued, so everything below is a safe no-op. The card also works with the Connectors screen provided by the Gutenberg plugin.

## How it works

`Jetpack_Connector::init()` is called automatically when you configure the connection package (it runs from `Manager::configure()`), so no extra setup is required in your plugin. Initialization wires up three things:

1. **Connector registration** — on `wp_connectors_init`, registers a `wordpress_com` connector (a `cloud_service` type with `authentication.method = none`) in the core registry.
2. **Script module** — on the Connectors admin screen, enqueues the `@automattic/jetpack-connection-connectors` script module (and its stylesheet), which provides a custom render function for the card.
3. **Auth error capture** — on `jetpack_client_authorize_error`, stores the error so it can be surfaced in the card after an authorization attempt.

## What the card shows

The card's render function receives data via the `script_module_data_@automattic/jetpack-connection-connectors` filter. Depending on connection state, it surfaces:

- **Connection / registration status** — `isRegistered` (site has a blog token), `isConnected` (registered *and* has a connected owner), and `isOfflineMode`.
- **Site details** — blog id, site URL, and home URL once registered.
- **Connection owner and current user** — display name, login, email, and avatar, sourced from WordPress.com data where available, plus whether the current user is the owner.
- **Connected plugins** — the plugins currently sharing the connection.
- **SSO status** — when the Jetpack plugin is connected.
- **Safe Mode / Identity Crisis** — when the site is in Safe Mode, the status badge swaps to "Safe Mode" and the card renders the resolution options (migrate / start fresh / stay in safe mode).
- **Hosting context** — `isWoaSite` and `isVipSite` flags.
- **Auth errors** — any error captured from the last authorization attempt.

Connect and disconnect actions performed from the card go through the package's existing connection REST endpoints. Connecting and disconnecting are disabled while the site is in offline mode.

## Customization

The card data is assembled server-side in `Jetpack_Connector::get_connector_data()` and passed through the `script_module_data_@automattic/jetpack-connection-connectors` filter, so consumers can adjust the payload by hooking that filter if needed.

The Safe Mode / Identity Crisis data mirrors what `\Automattic\Jetpack\IdentityCrisis\UI::get_initial_state_data()` provides, and is only added when the `Identity_Crisis` class is available and the site is actually in Safe Mode.
