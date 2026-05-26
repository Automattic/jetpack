# Help Center Backend

## Overview

This is the backend for the Help Center. It lives in `jetpack-mu-wpcom` and is deployed as part of the `jetpack-mu-plugin` package. It is responsible for:

1. **Loading the Help Center UI** — enqueues the webpack bundles (built in `wp-calypso/apps/help-center/`) from `widgets.wp.com` into wp-admin, the block editor, the customizer, CIAB, `/support`, and `/forums`.
2. **Registering REST API endpoints** — all under the `/help-center/` namespace. These are used by the frontend on Atomic sites when `canAccessWpcomApis()` returns `false`. Every endpoint proxies to a WPcom REST API via `Client::wpcom_json_api_request_as_user()`.

The frontend code lives in a separate repo: `wp-calypso/packages/help-center/`.

## Files

| File                               | Purpose                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `help-center.php`                  | Entry point; loads `class-help-center.php`                                                                            |
| `class-help-center.php`            | Main class — variant selection, script enqueuing, admin bar icon, inline `helpCenterData`, REST endpoint registration |
| `class-help-center-menu-panel.php` | Adds Help Center menu items to the admin bar (chat, history, guides, courses, product updates)                        |
| `class-wp-rest-help-center-*.php`  | Individual REST API endpoint controllers (see table below)                                                            |

## How the UI Gets Loaded

`Help_Center::enqueue_wp_admin_scripts()` picks a **variant** based on the current context:

| Context                             | Variant                                  |
| ----------------------------------- | ---------------------------------------- |
| CIAB (`next_admin_init`)            | `ciab-admin` / `ciab-admin-disconnected` |
| `/support` or `/forums`, logged out | `logged-out`                             |
| `/support` or `/forums`, logged in  | `wp-admin` / `wp-admin-disconnected`     |
| Site frontend (non-admin)           | `wp-admin-disconnected`                  |
| Block editor                        | `gutenberg` / `gutenberg-disconnected`   |
| wp-admin                            | `wp-admin` / `wp-admin-disconnected`     |
| Customizer                          | `customizer` / `wp-admin-disconnected`   |

It then fetches `widgets.wp.com/help-center/help-center-{variant}.asset.json` (cached 1 hour via transient), and enqueues the corresponding JS bundle and CSS.

For connected variants, it injects `helpCenterData` as inline JS containing user info, site info, locale, and flags (proxy, SU, SSP).

## REST API Endpoints

All routes are registered under the `help-center` namespace (`/wp-json/help-center/...`). Every endpoint proxies to a WPcom REST API.

| Route                                                 | Method | Controller              | Proxies to                                    | Description                          |
| ----------------------------------------------------- | ------ | ----------------------- | --------------------------------------------- | ------------------------------------ |
| `/authenticate/chat`                                  | POST   | `Authenticate`          | `POST /help/authenticate/chat`                | Zendesk/messaging chat auth          |
| `/support-availability/email`                         | GET    | `Email_Support_Enabled` | `GET /help/eligibility/email/mine`            | Check email support eligibility      |
| `/fetch-post`                                         | GET    | `Fetch_Post`            | `GET /help/article/{blog_id}/{post_id}`       | Fetch a single support article       |
| `/articles`                                           | GET    | `Fetch_Post`            | `GET /help/articles?blog_id=...&post_ids=...` | Fetch multiple support articles      |
| `/forum/new`                                          | POST   | `Forum`                 | `POST /help/forum/new`                        | Create a forum topic                 |
| `/jetpack-search/ai/search`                           | GET    | `Jetpack_Search_AI`     | `GET /sites/{site}/jetpack-search/ai/search`  | AI-powered article search            |
| `/odie/chat/{bot_id}`                                 | POST   | `Odie`                  | `POST /odie/chat/{bot_id}/`                   | Start a new Odie chat                |
| `/odie/chat/{bot_id}/{chat_id}`                       | GET    | `Odie`                  | `GET /odie/chat/{bot_id}/{chat_id}`           | Get an Odie chat conversation        |
| `/odie/chat/{bot_id}/{chat_id}`                       | POST   | `Odie`                  | `POST /odie/chat/{bot_id}/{chat_id}`          | Send a message to an Odie chat       |
| `/odie/chat/{bot_id}/{chat_id}/{message_id}/feedback` | POST   | `Odie`                  | `POST /odie/chat/.../feedback`                | Rate an Odie message                 |
| `/odie/conversations/{bot_ids}`                       | GET    | `Odie`                  | `GET /odie/conversations/{bot_ids}`           | List recent Odie conversations       |
| `/open-state`                                         | GET    | `Persisted_Open_State`  | `GET /me/preferences`                         | Get Help Center open/minimized state |
| `/open-state`                                         | PUT    | `Persisted_Open_State`  | `POST /me/preferences`                        | Set Help Center open/minimized state |
| `/search`                                             | GET    | `Search`                | `GET /help/search`                            | Search help articles                 |
| `/sibyl`                                              | GET    | `Sibyl`                 | `GET /help/sibyl`                             | AI-suggested support articles        |
| `/support-activity`                                   | GET    | `Support_Activity`      | `GET /support-activity`                       | Active support tickets               |
| `/support-interactions`                               | GET    | `Support_Interactions`  | `GET /support-interactions/`                  | List support interactions            |
| `/support-interactions/{id}`                          | GET    | `Support_Interactions`  | `GET /support-interactions/{id}`              | Get a single interaction             |
| `/support-interactions`                               | POST   | `Support_Interactions`  | `POST /support-interactions`                  | Create a support interaction         |
| `/support-interactions/{id}/events`                   | POST   | `Support_Interactions`  | `POST /support-interactions/{id}/events`      | Add event to interaction             |
| `/support-interactions/{id}/status`                   | PUT    | `Support_Interactions`  | `PUT /support-interactions/{id}/status`       | Update interaction status            |
| `/support-status`                                     | GET    | `Support_Status`        | `GET /help/support-status`                    | Support eligibility/tier             |
| `/support-status/messaging`                           | GET    | `Support_Status`        | `GET /help/support-status/messaging`          | Messaging support availability       |
| `/csat`                                               | POST   | `Ticket_CSAT`           | `POST /help/csat`                             | Submit ticket CSAT rating            |
| `/ticket/new`                                         | POST   | `Ticket`                | `POST /help/ticket/new`                       | Create a support ticket              |
| `/zendesk/user-fields`                                | POST   | `User_Fields`           | `POST /help/zendesk/update-user-fields`       | Update Zendesk user fields           |

## Other Behaviors

- **Router history cap**: `calypso_preferences_update` limits `help_center_router_history` entries to 50 to prevent unbounded growth.
- **Admin bar icon**: The `wp-admin` and `wp-admin-disconnected` variants add a Help Center icon to the WordPress admin bar with a notification dot SVG.
- **Menu panel**: Behind an ExPlat experiment (`calypso_help_center_menu_popover_increase_exposure`), adds a menu panel with links to chat, chat history, support guides, courses, and product updates.
- **Logged-out support**: On support sites, logged-out users see the Help Center.
- **Disconnected fallback**: When the user is not connected via Jetpack, the Help Center icon links to `wordpress.com/help` instead of opening the in-app experience.

## Development

- PHP changes here require a `jetpack-mu-plugin` deploy.
- Frontend JS/CSS changes are made in `wp-calypso` and deployed to `widgets.wp.com` — no deploy of this package needed for those.
- See `wp-calypso/packages/help-center/AGENTS.md` for the frontend documentation.

### Testing Changes

#### On an Atomic site

1. Add the following constants to `wp-config.php` on the target site:

```php
define( 'JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN', true );
define( 'JETPACK_AUTOLOAD_DEV', true );
```

2. Rsync the plugin to the Atomic site:

```bash
jetpack rsync mu-wpcom-plugin <atomic-site-url>@ssh.wp.com:htdocs/wp-content/plugins/jetpack-mu-wpcom-plugin-dev
```

Replace `<atomic-site-url>` with the site's SSH-accessible URL.

#### On a Simple site

Use the [Jetpack Beta Plugin](https://github.com/Automattic/jetpack-beta) to load the development version of `jetpack-mu-wpcom`.

### Updating CIAB after deploy

After your Jetpack PR is merged and deployed, you must update the CIAB Help Center manifest. From the `ciab-admin` repo:

1. Ensure you are on `trunk` with no pending changes (`git checkout trunk && git pull`).
2. Run the manifest updater:

```bash
node bin/environment/manifest-update-checker.js --update=plugins/help-center
```

3. Commit the manifest changes and open a PR in `ciab-admin`.

After creating a PR for Jetpack, tell the user they can come back and ask you to update CIAB and you will handle it (checkout trunk, pull, run the manifest updater, and commit).
