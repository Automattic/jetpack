import { getProductDescriptionUrl } from '../utils';

const state = { jetpack: { initialState: { adminUrl: 'https://example.com/wp-admin/' } } };

describe( 'getProductDescriptionUrl', () => {
	it( 'links Security to its My Jetpack interstitial', () => {
		expect( getProductDescriptionUrl( state, 'security' ) ).toBe(
			'https://example.com/wp-admin/admin.php?page=my-jetpack#/add-security'
		);
	} );

	it( 'falls back to My Jetpack for a product without an interstitial', () => {
		expect( getProductDescriptionUrl( state, 'unknown' ) ).toBe(
			'https://example.com/wp-admin/admin.php?page=my-jetpack'
		);
	} );

	it( 'sends sites without My Jetpack to the pricing page', () => {
		const withoutMyJetpack = {
			jetpack: {
				initialState: {
					...state.jetpack.initialState,
					rawUrl: 'example.com',
					siteData: { showMyJetpack: false },
				},
			},
		};

		expect( getProductDescriptionUrl( withoutMyJetpack, 'security' ) ).toBe(
			'https://jetpack.com/redirect/?source=jetpack-plans&site=example.com'
		);
	} );

	it( 'keeps Search on its own admin page', () => {
		expect( getProductDescriptionUrl( state, 'search' ) ).toBe(
			'https://example.com/wp-admin/admin.php?page=jetpack-search'
		);
	} );
} );
