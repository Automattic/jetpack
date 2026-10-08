import { getMyJetpackWindowInitialState } from './get-my-jetpack-window-state';

/**
 * Record in the page state that these products' plugins are now active, so its readers see the switch without a reload.
 *
 * @param productSlugs - The products whose plugin was switched on.
 */
export function markPluginsActive( productSlugs: string[] ) {
	const items = getMyJetpackWindowInitialState( 'products' )?.items;

	productSlugs.forEach( slug => {
		if ( items?.[ slug ] ) {
			items[ slug ].is_plugin_active = true;
		}
	} );
}

/**
 * The products whose plugin the Features tab's state reports as active.
 *
 * @param state - The Features tab's state, as a switch returns it.
 * @return The product slugs.
 */
export function getProductsWithActivePlugin( state: MainFeaturesState ): string[] {
	return state.features
		.filter( feature => feature.product && feature.plugin_status === 'active' )
		.map( feature => feature.product );
}
