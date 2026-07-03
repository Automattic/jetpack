# Agents Manager (Jetpack Backend)

Backend for the Agents Manager. Handles script enqueueing, feature gating, and UI state persistence.

The frontend code lives in the Calypso repo (`packages/agents-manager/` and `apps/agents-manager/`). This feature only handles loading those bundles and backend concerns.

## Concepts

- **Unified experience** = the **Help Center takeover**. When active, Agents Manager replaces the Help Center UI, unifying Odie and Dolly (the orchestrator) into a single chat experience. Gated by `agents_manager_use_unified_experience`; read everywhere via the `is_unified_experience()` helper. This is the *only* mode in which Help Center is dequeued.
- **Block-editor-only mode** = Agents Manager replaces Big Sky's *native* block-editor UI, but does **not** take over the Help Center. Gated by `agents_manager_enabled_in_block_editor` (hooked by Big Sky, e.g. via `?flags=unified-big-sky`). Help Center must stay available here — do not dequeue it.

These two are independent: block-editor enablement does not imply the unified experience. They were briefly conflated (the dequeue keyed on "are we in Gutenberg?") until the block-editor filter was split out in #47277; see AI-1013.

## Cross-Repo Relationship

- All JS/CSS bundles are fetched from `widgets.wp.com/agents-manager/`, built by the Calypso `apps/agents-manager/` app.
- Translations are loaded from `widgets.wp.com/agents-manager/languages/{locale}-v1.js` (the same directory Image Studio uses, since it ships from the same Calypso app). The locale is normalised to an ISO 639 code by `determine_iso_639_locale()`. Skipped for English and for disconnected variants, mirroring Help Center.
- Asset metadata (`.asset.json`) is fetched via HTTP on Atomic sites or read from disk on Simple sites, then cached in a transient for 1 hour.
- The REST endpoint proxies to `/agents-manager/state` on wpcom via `Jetpack\Connection\Client::wpcom_json_api_request_as_user()`.

## Key Filters

These filters control behavior and are used by other plugins (like Big Sky) to integrate:

| Filter | Purpose | Default |
|--------|---------|---------|
| `agents_manager_agent_providers` | Register extension provider module URLs | `[]` |
| `agents_manager_use_unified_experience` | Enable the unified experience (Help Center takeover; see Concepts). Read via `is_unified_experience()` | `false` |
| `agents_manager_enabled_in_ciab` | Enable/disable in CIAB | `true` |
| `agents_manager_enabled_in_block_editor` | Enable in the block editor without the Help Center takeover (block-editor-only mode; see Concepts) | `false` |
| `jetpack_ai_sidebar_agents_manager_data` | Add host-specific data to `agentsManagerData` | `current inline data` |

## Pitfalls

- **Enqueue priority matters**: Scripts enqueue at priority 101 (after Help Center at 100) so the Agents Manager can dequeue Help Center. Changing priority breaks this. Note the dequeue only runs in the unified experience (see Concepts) — block-editor-only mode leaves Help Center alone.
- **Feature gating is multi-layered**: `is_enabled()` checks CIAB, unified experience, and block editor filters in order. The first match wins. This is not a simple on/off.
- **Router history cleanup**: The `calypso_preferences_update` filter silently limits history to 50 entries. If debugging missing history state, check this.
