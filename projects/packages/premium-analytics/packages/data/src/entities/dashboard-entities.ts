/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, DASHBOARD_REST_NAMESPACE } from '../api/constants';

/**
 * The core-data entities the analytics dashboard reads its metadata from.
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
 * Always registers the complete set: registering a subset seeds the guard, so
 * a later caller skips the entities it left out. That is how `dashboardSection`
 * went missing once and the dashboard force-opened an empty edit-mode canvas.
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
