import { hasJetpackPlugin, hasWooPlugin, toConnectedPlugins } from '../site-words';

describe( 'site words', () => {
	it.each( [
		[ [ 'jetpack' ], true, false ],
		[ [ 'jetpack-boost' ], true, false ],
		[ [ 'jetpackish' ], false, false ],
		[ [ 'woocommerce-payments' ], false, true ],
		[ [ 'woocommerce', 'jetpack-social' ], true, true ],
		[ [], false, false ],
	] )( '%j: Jetpack %s, Woo %s', ( slugs, jetpack, woo ) => {
		const plugins = slugs.map( slug => ( { slug, name: slug } ) );

		expect( hasJetpackPlugin( plugins ) ).toBe( jetpack );
		expect( hasWooPlugin( plugins ) ).toBe( woo );
	} );

	it.each( [
		[ { errors: {} }, [] ],
		[
			[ { slug: 'jetpack' }, { name: 'No slug' }, { slug: 'woocommerce', name: 'Woo' } ],
			[
				{ slug: 'jetpack', name: 'jetpack' },
				{ slug: 'woocommerce', name: 'Woo' },
			],
		],
	] )( 'reads %j from the store', ( value, plugins ) => {
		expect( toConnectedPlugins( value ) ).toEqual( plugins );
	} );
} );
