# Premium Analytics Dashboard Context

## Domain Language

- **Dashboard**: the Premium Analytics admin surface registered as `jetpack-premium-analytics_dashboard`.
- **Flat dashboard layout**: the `dashboardLayout` preference consumed by the shared dashboard layout hook and by the reset-to-default REST route.
- **Dashboard section**: one of the tabbed dashboard areas: `traffic`, `insights`, `subscribers`, or `store`.
- **Section layouts**: the `dashboardSectionLayouts` preference, a map of section ID to widget layout array.
- **Preference defaults**: server-provided defaults injected through the WordPress `persisted_preferences` user meta read so the React preferences store sees bundled defaults on first load.

## Rules

- The PHP preference scope and keys must mirror `routes/dashboard/hooks/constants.ts` and the section layout hook.
- A missing section layout falls back to the flat dashboard layout on the client.
- A present section layout with an empty array renders the dashboard's empty state instead of falling back to the flat default.
- Resetting a section restores that section's server-provided default layout.
- Section IDs are mirrored from `routes/dashboard/config/sections.ts`.
