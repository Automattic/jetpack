import { getProductSlugsWithActivePlugin, markPluginsActive } from '../mark-plugins-active';

describe( 'markPluginsActive', () => {
	it( 'marks the listed products in a copy, leaving the given items untouched', () => {
		const items = {
			videopress: { is_plugin_active: false },
			social: { is_plugin_active: false },
		} as unknown as Parameters< typeof markPluginsActive >[ 0 ];

		expect( markPluginsActive( items, [ 'videopress', 'unknown' ] ) ).toEqual( {
			videopress: { is_plugin_active: true },
			social: { is_plugin_active: false },
		} );
		expect( items.videopress.is_plugin_active ).toBe( false );
	} );
} );

describe( 'getProductSlugsWithActivePlugin', () => {
	it.each( [
		[ 'a product whose plugin is active', 'videopress', 'active', [ 'videopress' ] ],
		[ 'not one whose plugin is off', 'videopress', 'inactive', [] ],
		[ 'not a feature with no product', '', 'active', [] ],
	] )( 'lists %s', ( _, product, pluginStatus, slugs ) => {
		const state = {
			jetpack: 'inactive',
			features: [ { product, plugin_status: pluginStatus } ],
		} as unknown as MainFeaturesState;

		expect( getProductSlugsWithActivePlugin( state ) ).toEqual( slugs );
	} );
} );
