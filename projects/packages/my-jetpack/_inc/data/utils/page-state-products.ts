type ProductItems = Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ];

/**
 * The page state's products, with these products' plugins active.
 *
 * @param items        - The page state's products.
 * @param productSlugs - The products whose plugin was switched on.
 * @return The updated products, leaving `items` untouched.
 */
export function withPluginsActive( items: ProductItems, productSlugs: string[] ): ProductItems {
	return productSlugs.reduce( ( updated, slug ) => {
		if ( ! updated[ slug ] ) {
			return updated;
		}

		return { ...updated, [ slug ]: { ...updated[ slug ], is_plugin_active: true } };
	}, items );
}

/**
 * Replace the page state's products, so its readers see a switch without a reload.
 *
 * @param items - The products to store.
 */
export function setPageStateProductItems( items: ProductItems ) {
	if ( window.myJetpackInitialState?.products ) {
		window.myJetpackInitialState.products.items = items;
	}
}

/**
 * The slugs of the products whose plugin the Features tab's state reports as active.
 *
 * @param state          - The Features tab's state, as a switch returns it.
 * @param state.features - Its features, each with its product and plugin status.
 * @return The product slugs.
 */
export function getProductSlugsWithActivePlugin( { features }: MainFeaturesState ): string[] {
	return features
		.filter( ( { product, plugin_status } ) => product && plugin_status === 'active' )
		.map( ( { product } ) => product );
}
