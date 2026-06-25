# ADR 0001: Seed Dashboard Preferences Via Shared Defaults Filter

## Status

Accepted.

## Context

Premium Analytics needs bundled defaults for more than one dashboard preference. The existing first-load PHP seeding only handled the flat `dashboardLayout` key. Dashboard sections also need a `dashboardSectionLayouts` preference so each section can have a tailored initial layout.

If each preference key owned its own `get_user_metadata` filter, every new default would need another copy of the same persisted-preferences lookup and recursion guard. A single early return for a customized layout could also prevent another preference default from being added.

## Decision

Use one `get_user_metadata` injection point and one shared `jetpack_premium_analytics_dashboard_preference_defaults` filter. Defaults are returned as `preference key => default value`, and each key is checked independently before it is seeded into the dashboard preference scope.

The flat dashboard layout remains exposed through the existing `jetpack_premium_analytics_dashboard_default_layout` filter and default-layout REST route. The layout default is also added to the shared preference-defaults filter so first-load seeding can keep using the same flat layout source.

Section reset actions use a section-aware default-layout REST route. That route returns the registered section layout when the section key exists, including intentionally empty arrays, and falls back to the flat dashboard default only for unknown sections.

## Consequences

- Customizing `dashboardLayout` does not suppress the bundled `dashboardSectionLayouts` default.
- New dashboard preference defaults can be added without duplicating the user-meta injection.
- The section-layout default can deliberately seed empty arrays for not-yet-built sections, preventing those sections from falling back to the flat dashboard default.
- Resetting a section restores that section's bundled default instead of the flat dashboard default.
