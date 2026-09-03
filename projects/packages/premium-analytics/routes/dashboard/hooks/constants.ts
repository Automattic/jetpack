/**
 * Preferences identifiers shared by the dashboard hooks and mirrored on the
 * server.
 *
 * Centralized so the preferences scope and keys can be renamed in one place —
 * e.g. to fully isolate Premium Analytics' stored preferences from the core
 * dashboard's. The values here must match the constants in
 * `src/dashboard-layout.php`.
 */

/**
 * Preferences scope under which the dashboard layout and grid settings
 * are stored. Mirrors the scope the server-side default injection writes
 * to.
 */
export const DASHBOARD_PREFERENCES_SCOPE = 'jetpack-premium-analytics/dashboard';

/** Preferences key holding the dashboard grid settings. */
export const DASHBOARD_GRID_SETTINGS_KEY = 'dashboardGridSettings';
