/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, DASHBOARD_REST_NAMESPACE } from './dashboard/hooks/constants';

/**
 * The core-data entities the analytics routes read dashboard metadata from.
 */
export type DashboardEntityName = 'widgetModule' | 'dashboardSection';

/**
 * Build the core-data configuration for one dashboard entity.
 *
 * Built at call time (not module scope) so `__()` reads translations after
 * the locale data has loaded.
 *
 * @param name - The entity to configure.
 * @return The entity configuration for `addEntities`.
 */
function buildEntityConfig( name: DashboardEntityName ): object {
	if ( name === 'widgetModule' ) {
		return {
			name: 'widgetModule',
			kind: 'root',
			key: 'name',
			baseURL: `/${ DASHBOARD_REST_NAMESPACE }/widget-modules`,
			plural: 'widgetModules',
			label: __( 'Widget modules', 'jetpack-premium-analytics-pkg' ),
			supportsPagination: false,
		};
	}

	return {
		name: 'dashboardSection',
		kind: 'root',
		key: 'slug',
		baseURL: `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ DASHBOARD_NAME }/sections`,
		plural: 'dashboardSections',
		label: __( 'Dashboard sections', 'jetpack-premium-analytics-pkg' ),
		supportsPagination: false,
	};
}

/**
 * Register the given dashboard core-data entities, skipping any already
 * registered.
 *
 * Routes call this from `beforeLoad`, which re-runs on every navigation and
 * preload, so each entity is guarded individually. The guard must stay
 * per-entity: the detail routes register only `widgetModule`, so a dashboard
 * `beforeLoad` that treats "widgetModule exists" as "everything exists" never
 * registers `dashboardSection` when a detail page loaded first, and the
 * dashboard then resolves zero sections and force-opens an empty edit-mode
 * canvas.
 *
 * @param names - The entities the calling route needs.
 */
export function ensureDashboardEntities( names: readonly DashboardEntityName[] ): void {
	const coreSelect = select( coreStore ) as unknown as {
		getEntityConfig: ( kind: string, name: string ) => unknown;
	};
	const missing = names.filter( name => ! coreSelect.getEntityConfig( 'root', name ) );
	if ( missing.length === 0 ) {
		return;
	}

	const coreDispatch = dispatch( coreStore ) as unknown as {
		addEntities: ( entities: object[] ) => void;
	};
	coreDispatch.addEntities( missing.map( buildEntityConfig ) );
}
