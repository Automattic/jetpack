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
const DASHBOARD_ENTITY_NAMES = [ 'widgetModule', 'dashboardSection' ] as const;

type DashboardEntityName = ( typeof DASHBOARD_ENTITY_NAMES )[ number ];

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
 * Register the dashboard core-data entities, skipping any already registered.
 *
 * Routes call this from `beforeLoad`, which re-runs on every navigation and
 * preload, so each entity is guarded individually. The helper owns the
 * complete entity set on purpose: registration is config-only (no request is
 * made until something reads the entity), so registering an entity a route
 * never reads costs nothing, while letting callers pick a subset restores the
 * route-level invariant that caused the original regression — a detail route
 * registering `widgetModule` alone made the dashboard's guard treat the store
 * as fully seeded, `dashboardSection` was never registered, and the dashboard
 * resolved zero sections and force-opened an empty edit-mode canvas.
 */
export function ensureDashboardEntities(): void {
	const coreSelect = select( coreStore ) as unknown as {
		getEntityConfig: ( kind: string, name: string ) => unknown;
	};
	const missing = DASHBOARD_ENTITY_NAMES.filter(
		name => ! coreSelect.getEntityConfig( 'root', name )
	);
	if ( missing.length === 0 ) {
		return;
	}

	const coreDispatch = dispatch( coreStore ) as unknown as {
		addEntities: ( entities: object[] ) => void;
	};
	coreDispatch.addEntities( missing.map( buildEntityConfig ) );
}
