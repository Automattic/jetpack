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

	it( 'keeps Search on its own admin page', () => {
		expect( getProductDescriptionUrl( state, 'search' ) ).toBe(
			'https://example.com/wp-admin/admin.php?page=jetpack-search'
		);
	} );
} );
