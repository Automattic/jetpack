import { getProductsWithActivePlugin } from '../mark-plugins-active';

describe( 'getProductsWithActivePlugin', () => {
	it.each( [
		[ 'a product whose plugin is active', 'videopress', 'active', [ 'videopress' ] ],
		[ 'not one whose plugin is off', 'videopress', 'inactive', [] ],
		[ 'not a feature with no product', '', 'active', [] ],
	] )( 'lists %s', ( _, product, pluginStatus, slugs ) => {
		const state = {
			jetpack: 'inactive',
			features: [ { product, plugin_status: pluginStatus } ],
		} as unknown as MainFeaturesState;

		expect( getProductsWithActivePlugin( state ) ).toEqual( slugs );
	} );
} );
