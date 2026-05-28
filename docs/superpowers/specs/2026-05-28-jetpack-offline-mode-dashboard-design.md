# Jetpack Offline Mode Dashboard Design

## Summary

Jetpack should provide a better local-development experience when Offline Mode is active. Today, developers see a notice saying that Jetpack is in Offline Mode and that some features are disabled, but they do not get a clear path to the Jetpack features that can be used without a WordPress.com connection.

This design adds a main Jetpack navigation tab for Offline Mode. The tab opens a developer dashboard that helps local developers activate and manage features that work fully offline, plus a curated first set of partially offline-capable features.

## Goals

- Show a dedicated Offline Mode dashboard whenever Jetpack Offline Mode is active.
- Make the dashboard available from the main Jetpack nav beside At a Glance.
- List all modules marked `Requires Connection: No`.
- Include a curated first-version list of partial offline features, starting with Newsletter.
- Let developers manually activate features and optionally activate a recommended local-development starter set.
- Use normal Jetpack module activation state so enabled features remain active if the site is later connected.
- Keep connected-only behavior guarded by existing connection checks.

## Non-Goals

- Do not build a general non-offline feature manager.
- Do not auto-enable features when the developer first lands on the screen.
- Do not audit every Jetpack block and feature for partial offline support in the first version.
- Do not make connected-only services work without a connection.
- Do not add a changelog entry for this design-only work.

## Current Context

Offline Mode is already a first-class status in `projects/packages/status/src/class-status.php`. It can be active because of local URLs, `JETPACK_DEV_DEBUG`, `WP_LOCAL_DEV`, the `jetpack_offline_mode` filter, or the `jetpack_offline_mode` option.

Jetpack module metadata already declares whether a module requires a site connection or a user connection. The module system blocks connection-required modules in Offline Mode, and the admin client already exposes module connection requirements to React.

The gap is the product experience: the current notice tells developers that some features are disabled, but it does not guide them toward local-safe Jetpack features they can use while building plugins or themes.

## Product Decisions

- Eligibility: treat any active Jetpack Offline Mode as eligible for this dashboard, regardless of which trigger activated Offline Mode.
- Entry point: add an Offline Mode tab in the main Jetpack navigation beside At a Glance.
- Screen shape: use a developer dashboard, not the legacy module-list table and not only a notice action.
- Activation model: use normal module activation and deactivation.
- Connection transition: features activated through the dashboard remain active as normal Jetpack modules after a later WordPress.com connection.
- First-version partials: use a curated list, expanded over time.
- Recommended action: provide a prominent **Enable recommended local features** button, but do not auto-run it.

## Recommended Starter Set

The first version's recommended action should activate this smaller local-development starter set when each item is available and inactive:

- Forms
- Blocks
- Shortcode Embeds
- Tiled Galleries
- Carousel
- Extra Sidebar Widgets
- Widget Visibility
- Markdown
- Copy Post
- Sharing
- Sitemaps
- SEO Tools

The dashboard should still list other offline-safe modules for manual activation.

## Architecture

Add a small Offline Features registry in the Jetpack plugin. The registry is the source of truth for the dashboard and should expose:

- Fully offline modules derived from existing module metadata where `requires_connection` is false.
- Curated partial offline features.
- Recommended feature slugs.
- Developer-oriented grouping metadata.
- Display notes for connection limitations and partial support.

Add a Jetpack REST endpoint that returns grouped, display-ready dashboard data:

- Feature slug.
- Feature name and description.
- Feature type: `module` or `partial`.
- Group.
- Active state.
- Availability state.
- Recommendation flag.
- Limitation note.
- Underlying module slug for partial features.

The React dashboard should consume this endpoint and stay mostly presentational. It should use existing module activation and deactivation actions wherever possible.

## Dashboard UI

The Offline Mode dashboard opens with a concise status area explaining that Jetpack is in Offline Mode and that local-safe Jetpack features can be enabled. It should avoid marketing copy and focus on developer tasks.

The dashboard includes:

- Counts for offline-safe, enabled, and partial features.
- A primary **Enable recommended local features** action.
- Grouped feature cards organized by developer task.
- Standard toggles for fully offline modules.
- A “Partial offline support” badge and limitation note for partial features.

Suggested groups:

- Content and editor.
- Audience and engagement.
- Media.
- Traffic and discovery.
- Theme enhancements.

## Partial Feature Rules

Partial features activate the underlying module only when the registry explicitly allows it. A partial cannot appear without a limitation note.

Newsletter should be the initial partial. Its note should communicate that local editor, theme, and plugin integration can be enabled, while delivery, subscriber sync, and WordPress.com-backed flows still require a connection.

Connected-only behavior must remain guarded by existing connection checks. The dashboard should not bypass service calls, authentication requirements, sync requirements, or WordPress.com-only flows.

## Error Handling

If Offline Mode is inactive:

- Hide the Offline Mode nav tab.
- Redirect the `/offline-mode` route back to At a Glance if reached directly.
- Block the REST endpoint or return an appropriate permission/error response.

If activation fails:

- Show the existing module activation error.
- Leave the card state unchanged until module state is refreshed.

If no eligible features are available:

- Show a plain empty state explaining that no offline-capable features are available in this build.

## Testing

Backend tests should cover:

- Registry output for fully offline modules.
- Curated partial feature output.
- Recommended set membership.
- Offline Mode eligibility.
- REST endpoint behavior when Offline Mode is active and inactive.
- Activation rules for fully offline modules and curated partial features.

JavaScript tests should cover:

- Main nav tab visibility in Offline Mode.
- Route redirect behavior outside Offline Mode.
- Dashboard counts.
- Manual feature toggles.
- Recommended bulk activation.
- Partial support badges and notes.
- Activation failure display.

## Documentation

Update developer-facing Offline Mode documentation to mention the new dashboard and explain that it is meant for local development workflows. The documentation should clarify the difference between fully offline modules and curated partial features.
