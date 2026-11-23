/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { ensureDashboardEntities } from '../dashboard-entities';

// The dashboard's own paths `preload_dashboard_rest_responses()` in src/widget-modules.php preloads
// (core's `/wp/v2/settings` aside). The preload only helps while they match the client's reads.
const PRELOADED_PATHS = {
	dashboardSection:
		'/wpcom/v2/dashboards/jetpack-premium-analytics_dashboard/sections?per_page=100&_locale=user',
	widgetModule: '/wpcom/v2/widget-modules?per_page=100&_locale=user',
};

describe( 'dashboard REST preload', () => {
	it.each( Object.entries( PRELOADED_PATHS ) )(
		'preloads the %s entity at the route the client reads it from',
		( name, path ) => {
			ensureDashboardEntities();
			const config = (
				select( coreStore ) as unknown as {
					getEntityConfig: ( kind: string, name: string ) => { baseURL: string } | undefined;
				}
			 ).getEntityConfig( 'root', name );

			expect( config?.baseURL ).toBe( path.split( '?' )[ 0 ] );
		}
	);
} );
