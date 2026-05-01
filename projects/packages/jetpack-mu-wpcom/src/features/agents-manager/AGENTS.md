# Agents Manager (Jetpack Backend)

Backend for the Agents Manager in `jetpack-mu-wpcom`. Handles script enqueueing, feature gating, and UI state persistence.

The frontend code lives in the Calypso repo (`packages/agents-manager/` and `apps/agents-manager/`). This feature only handles loading those bundles and backend concerns.

## Cross-Repo Relationship

- All JS/CSS bundles are fetched from `widgets.wp.com/agents-manager/`, built by the Calypso `apps/agents-manager/` app.
- Asset metadata (`.asset.json`) is fetched via HTTP on Atomic sites or read from disk on Simple sites, then cached in a transient for 1 hour.
- The REST endpoint proxies to `/agents-manager/state` on wpcom via `Jetpack\Connection\Client::wpcom_json_api_request_as_user()`.

## Key Filters

These filters control behavior and are used by other plugins (like Big Sky) to integrate:

| Filter | Purpose | Default |
|--------|---------|---------|
| `agents_manager_agent_providers` | Register extension provider module URLs | `[]` |
| `agents_manager_use_unified_experience` | Enable unified experience UI | `false` |
| `agents_manager_enabled_in_ciab` | Enable/disable in CIAB | `true` |
| `agents_manager_enabled_in_block_editor` | Enable/disable in block editor | `false` |

## Pitfalls

- **Enqueue priority matters**: Scripts enqueue at priority 101 (after Help Center at 100) so the Agents Manager can dequeue Help Center. Changing priority breaks this.
- **Feature gating is multi-layered**: `is_enabled()` checks CIAB, unified experience, and block editor filters in order. The first match wins. This is not a simple on/off.
- **Router history cleanup**: The `calypso_preferences_update` filter silently limits history to 50 entries. If debugging missing history state, check this.

## Development

Follow the standard [`jetpack-mu-wpcom` development process](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/jetpack-mu-wpcom/README.md). For frontend-only changes, work in the Calypso repo instead.
