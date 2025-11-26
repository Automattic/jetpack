# Agents Manager

The Agents Manager provides REST API endpoints for managing AI agent-related state and preferences for WordPress.com users.

## Features

- Persisted open state management via REST API
- Router history cleanup to prevent preference bloat

## REST API Endpoints

### Open State

**Namespace:** `agents-manager`
**Route:** `/open-state`

#### GET `/wp-json/agents-manager/open-state`

Retrieves the current agents manager state from user preferences.

**Response:**
```json
{
  "calypso_preferences": {
    "agents_manager_open": true,
    "agents_manager_docked": false,
    "agents_manager_floating_position": "right",
    "agents_manager_router_history": { ... }
  }
}
```

#### POST `/wp-json/agents-manager/open-state`

Updates the agents manager state in user preferences.

**Request body:**
```json
{
  "agents_manager_open": true,
  "agents_manager_docked": false,
  "agents_manager_floating_position": "left",
  "agents_manager_router_history": { ... }
}
```

All parameters are optional; only provided parameters will be updated.

## Router History Cleanup

The Agents Manager automatically limits router history entries to 50 via the `calypso_preferences_update` filter. When the limit is exceeded, it keeps the last 49 entries and prepends a root entry to ensure the back button always works.

## Development

This feature is loaded for WordPress.com-connected users via the `load_wpcom_user_features()` method in `Jetpack_Mu_Wpcom`.

To develop this feature, follow the standard [`jetpack-mu-wpcom` development process](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/jetpack-mu-wpcom/README.md).

### How to develop the Help Center

This currently gets loaded via the help-center Calypso app.

#### In Calypso

Follow the classic Calypso development setup. Run `yarn start` and edit away. Nothing else should be needed.

#### In Simple sites

0. Go to Calypso repository root.
1. cd into `apps/help-center` (note: This currently gets loaded via `help-center`).
2. run `yarn dev --sync`.
3. Sandbox your site and `widgets.wp.com`.
4. Your changes should be reflected on the site live.


## Deployment

After every change to the Agents Manager PHP files, deploy `jetpack-mu-wpcom`.
