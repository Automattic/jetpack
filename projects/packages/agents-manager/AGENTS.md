# Agents Manager (Jetpack Backend)

Backend for the Agents Manager. Handles script enqueueing, feature gating, and UI state persistence.

The frontend code lives in the Calypso repo (`packages/agents-manager/` and `apps/agents-manager/`). This feature only handles loading those bundles and backend concerns.

## Concepts

- **Block-editor mode** = Agents Manager replaces Big Sky's native block-editor UI. Gated by `agents_manager_enabled_in_block_editor` (hooked by Big Sky). Help Center remains available independently.
- **Requested shell** = An integration can load Agents Manager outside the block editor with `agents_manager_should_load`.

## Cross-Repo Relationship

- All JS/CSS bundles are fetched from `widgets.wp.com/agents-manager/`, built by the Calypso `apps/agents-manager/` app.
- Translations are loaded from `widgets.wp.com/agents-manager/languages/{locale}-v1.js` (the same directory Image Studio uses, since it ships from the same Calypso app). The locale is normalised to an ISO 639 code by `determine_iso_639_locale()`. Skipped for English and for disconnected variants, mirroring Help Center.
- Asset metadata (`.asset.json`) is fetched via HTTP on Atomic sites or read from disk on Simple sites, then cached in a transient for 1 hour.

## Key Filters

These filters control behavior and are used by other plugins (like Big Sky) to integrate:

| Filter | Purpose | Default |
|--------|---------|---------|
| `agents_manager_agent_providers` | Register extension provider module URLs | `[]` |
| `agents_manager_enabled_in_block_editor` | Enable in the block editor | `false` |
| `agents_manager_should_load` | Request the Agents Manager shell for another integration | `false` |
| `jetpack_ai_sidebar_agents_manager_data` | Add host-specific data to `agentsManagerData` | `current inline data` |

## Pitfalls

- **Admin bar nodes are independent of the enqueue hooks**: they are hooked on `admin_bar_menu` from the constructor, so the admin-bar REST endpoints get them too. Eligibility belongs in `add_admin_bar_nodes()`, never in the registration, and the priority must stay above Help Center's `admin_bar_menu` callback so disconnected variants can replace its node.
- **Node presence is the eligibility signal**: `add_admin_bar_nodes()` bails when `get_active_context()` is `null`, so a client that receives these nodes is already eligible. Consumers should not re-check the rollout — a second gate can only drift from this one.
- **Node `meta` is a client contract**: `menu_title` is the label, because `title` is wp-admin markup — keep it unescaped, since core escapes it again for the group `aria-label`. `icon` is a glyph *name*, the same key `get_icon()` uses. `html` is wp-admin only.
- **Feature gating has two entry points**: `is_enabled()` accepts either block-editor enablement or an explicit shell request.
- **Router history cleanup**: The `calypso_preferences_update` filter silently limits history to 50 entries. If debugging missing history state, check this.
