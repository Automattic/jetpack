export const statsProxyPath = '/jetpack-premium-analytics/v1/proxy';

/**
 * Identifier of the Premium Analytics dashboard, formatted as
 * `<plugin>_<page>` to mirror the underscore form produced by the
 * wp-build pipeline. Used as the `{name}` segment of the default-layout
 * REST route.
 */
export const DASHBOARD_NAME = 'jetpack-premium-analytics_dashboard';

/**
 * REST namespace that exposes Premium Analytics dashboard endpoints.
 * Must match `DASHBOARD_REST_NAMESPACE` in `src/rest-namespace.php`.
 */
export const DASHBOARD_REST_NAMESPACE = 'wpcom/v2';
