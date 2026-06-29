/**
 * Identifiers shared by the dashboard hooks and mirrored on the server.
 *
 * Centralized so the preferences scope, keys, dashboard name, and REST
 * namespace can be renamed in one place — e.g. to fully isolate Premium
 * Analytics' stored preferences from the core dashboard's. The values
 * here must match the constants in `src/dashboard-layout.php`.
 */

/**
 * Identifier of the Premium Analytics dashboard, formatted as
 * `<plugin>_<page>` to mirror the underscore form produced by the
 * wp-build pipeline. Used as the `{name}` segment of the default-layout
 * REST route.
 */
export const DASHBOARD_NAME = 'jetpack-premium-analytics_dashboard';

/**
 * Preferences scope under which the dashboard layout and grid settings
 * are stored. Mirrors the scope the server-side default injection writes
 * to.
 */
export const DASHBOARD_PREFERENCES_SCOPE = 'jetpack-premium-analytics/dashboard';

/** Preferences key holding the dashboard layout array. */
export const DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

/** Preferences key holding the dashboard grid settings. */
export const DASHBOARD_GRID_SETTINGS_KEY = 'dashboardGridSettings';

/** REST namespace that exposes the dashboard's default layout. */
export const DASHBOARD_REST_NAMESPACE = 'jetpack/v4';
