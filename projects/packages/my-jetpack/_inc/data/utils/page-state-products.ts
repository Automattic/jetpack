import { getMyJetpackWindowInitialState } from './get-my-jetpack-window-state';

type ProductItems = Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ];

/**
 * The page state's products, with these products' plugins set active or inactive.
 *
 * @param items        - The page state's products.
 * @param productSlugs - The products whose plugin was switched.
 * @param isActive     - Whether their plugin is now active.
 * @return The updated products, leaving `items` untouched.
 */
export function withPluginActiveState(
	items: ProductItems,
	productSlugs: string[],
	isActive: boolean
): ProductItems {
	return productSlugs.reduce( ( updated, slug ) => {
		if ( ! updated[ slug ] ) {
			return updated;
		}

		return { ...updated, [ slug ]: { ...updated[ slug ], is_plugin_active: isActive } };
	}, items );
}

/**
 * Replace the page state's products, so its readers see a switch without a reload.
 *
 * @param items - The products to store.
 */
function setPageStateProductItems( items: ProductItems ) {
	if ( window.myJetpackInitialState?.products ) {
		window.myJetpackInitialState.products.items = items;
	}
}

/**
 * Record in the page state whether these products' plugins are active.
 *
 * @param productSlugs - The products whose plugin was switched.
 * @param isActive     - Whether their plugin is now active.
 */
function setPluginActiveStateInPageState( productSlugs: string[], isActive: boolean ) {
	const items = getMyJetpackWindowInitialState( 'products' )?.items ?? {};
	const updatedItems = withPluginActiveState( items, productSlugs, isActive );
	setPageStateProductItems( updatedItems );
}

/**
 * Record in the page state that these products' plugins are now active.
 *
 * @param productSlugs - The products whose plugin was switched on.
 */
export function setPluginsActiveInPageState( productSlugs: string[] ) {
	setPluginActiveStateInPageState( productSlugs, true );
}

/**
 * Make the page state's plugins follow the Features tab's state, as a switch returns it.
 *
 * @param state - The Features tab's state.
 */
export function syncPageStateWithFeatures( state: MainFeaturesState ) {
	setPluginActiveStateInPageState( getProductSlugsWithActivePlugin( state ), true );

	// With Jetpack active, products it also provides keep `is_plugin_active` whatever their own plugin does.
	if ( state.jetpack !== 'active' ) {
		setPluginActiveStateInPageState( getProductSlugsWithInactivePlugin( state ), false );
	}
}

/**
 * The slugs of the products whose plugin the Features tab's state reports as active.
 *
 * @param state          - The Features tab's state, as a switch returns it.
 * @param state.features - Its features, each with its product and plugin status.
 * @return The product slugs.
 */
function getProductSlugsWithActivePlugin( { features }: MainFeaturesState ): string[] {
	return features
		.filter( ( { product, plugin_status } ) => product && plugin_status === 'active' )
		.map( ( { product } ) => product );
}

/**
 * The slugs of the products whose plugin the Features tab's state reports as inactive or not installed.
 *
 * @param state          - The Features tab's state, as a switch returns it.
 * @param state.features - Its features, each with its product and plugin status.
 * @return The product slugs.
 */
function getProductSlugsWithInactivePlugin( { features }: MainFeaturesState ): string[] {
	return features
		.filter( ( { product, plugin_status } ) => product && plugin_status !== 'active' )
		.map( ( { product } ) => product );
}
