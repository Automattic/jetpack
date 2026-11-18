/**
 * External dependencies
 */
import { ensureDashboardEntities } from '@jetpack-premium-analytics/data';
import { registerFieldTypes } from '@jetpack-premium-analytics/fields';
import { resolveWidgetIcon } from '@jetpack-premium-analytics/icons';
import { registerIconResolver } from '@wordpress/widget-primitives';

/**
 * Runs what a page registers once before it mounts a widget dashboard: the field types
 * widget attributes name, the icon resolver, and the dashboard's core-data entities.
 *
 * Call it after the page's translation catalogs load: the entity labels are built with `__()`.
 *
 * @param dashboardName - Dashboard the page renders. Defaults to the package's own dashboard.
 */
export function registerDashboardHost( dashboardName?: string ): void {
	registerFieldTypes();
	registerIconResolver( resolveWidgetIcon );
	ensureDashboardEntities( dashboardName );
}
