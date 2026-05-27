# Agents Manager

The Agents Manager provides REST API endpoints for managing AI agent-related state and preferences for WordPress.com users.

This feature is loaded for WordPress.com-connected users via the `load_wpcom_user_features()` method in `Jetpack_Mu_Wpcom`.

Otherwise, you can load it by installing the `@automattic/jetpack-agents-manager` Composer package and instantiate it by calling the `Agents_Manager::init()` method. Example:

```php
use Automattic\Jetpack\Agents_Manager\Agents_Manager;

add_action( 'plugins_loaded', array( Agents_Manager::class, 'init' ) );
```

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
