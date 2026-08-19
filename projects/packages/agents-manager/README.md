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

### Jetpack AI JWT

**Namespace:** `jetpack/v4`
**Route:** `/jetpack-ai-jwt`

#### POST `/wp-json/jetpack/v4/jetpack-ai-jwt`

Requests a JWT token from WordPress.com that AI assistants use to authenticate OpenAI completion requests. This endpoint is required by plugins that embed AI assistants (such as Woo AI), so it is registered here to make it available independently of the Jetpack or My Jetpack plugins.

If the endpoint is already registered (for example, by the Jetpack plugin), the Agents Manager will not register it again to avoid duplicate registration.

**Permissions:** The user must have a connected Jetpack user account and the `edit_posts` capability.

**Response:**
```json
{
  "token": "...",
  "blog_id": 12345
}
```

## Router History Cleanup

The Agents Manager automatically limits router history entries to 50 via the `calypso_preferences_update` filter. When the limit is exceeded, it keeps the last 49 entries and prepends a root entry to ensure the back button always works.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

agents-manager is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
