import { syncPageStateWithFeatures, withPluginActiveState } from '../page-state-products';

describe( 'withPluginActiveState', () => {
	it.each( [ true, false ] )(
		'sets the listed products to %s in a copy, leaving the given items untouched',
		isActive => {
			const items = {
				videopress: { is_plugin_active: ! isActive },
				social: { is_plugin_active: ! isActive },
			} as unknown as Parameters< typeof withPluginActiveState >[ 0 ];

			expect( withPluginActiveState( items, [ 'videopress', 'unknown' ], isActive ) ).toEqual( {
				videopress: { is_plugin_active: isActive },
				social: { is_plugin_active: ! isActive },
			} );
			expect( items.videopress.is_plugin_active ).toBe( ! isActive );
		}
	);
} );

describe( 'syncPageStateWithFeatures', () => {
	it.each( [
		[ 'marks a plugin switched on', 'inactive', 'videopress', false, 'active', true ],
		[ 'clears a plugin switched off', 'inactive', 'videopress', true, 'inactive', false ],
		[
			'clears a plugin no longer installed',
			'inactive',
			'videopress',
			true,
			'not-installed',
			false,
		],
		[ 'keeps a plugin Jetpack also provides', 'active', 'videopress', true, 'inactive', true ],
		[ 'ignores a feature with no product', 'inactive', '', true, 'inactive', true ],
	] )( '%s', ( _, jetpack, product, wasActive, pluginStatus, isActive ) => {
		window.myJetpackInitialState = {
			products: { items: { videopress: { is_plugin_active: wasActive } } },
		} as unknown as Window[ 'myJetpackInitialState' ];

		syncPageStateWithFeatures( {
			jetpack,
			features: [ { product, plugin_status: pluginStatus } ],
		} as unknown as MainFeaturesState );

		expect( window.myJetpackInitialState.products.items.videopress.is_plugin_active ).toBe(
			isActive
		);
	} );
} );
