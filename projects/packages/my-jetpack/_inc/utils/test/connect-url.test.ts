import { connectionScreenRoute, getConnectUrl, productsFrom } from '../connect-url';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getJetpackAdminPageUrl: () => 'https://example.org/wp-admin/admin.php?page=jetpack',
	getMyJetpackUrl: () => 'https://example.org/wp-admin/admin.php?page=my-jetpack',
} ) );

const queryOf = ( url: string ) => Object.fromEntries( new URL( url ).searchParams );

describe( 'getConnectUrl', () => {
	it( 'sends the name and returns to the current page without the plans page', () => {
		expect( queryOf( getConnectUrl( 'my_jetpack_header' ) ) ).toEqual( {
			page: 'jetpack',
			connect_url_redirect: '1',
			from: 'my_jetpack_header',
			redirect_after_auth: window.location.href,
			skip_pricing: 'true',
		} );
	} );

	it( 'returns to the given URL', () => {
		const returnTo = 'https://example.org/wp-admin/admin.php?page=my-jetpack#/add-license';

		expect( queryOf( getConnectUrl( 'my_jetpack_plans', returnTo ) ).redirect_after_auth ).toBe(
			returnTo
		);
	} );
} );

describe( 'productsFrom', () => {
	it( "is the product's name, with My Jetpack's slug overrides", () => {
		expect( productsFrom( 'backup' ) ).toBe( 'my_jetpack_products_backup' );
		expect( productsFrom( 'jetpack-ai' ) ).toBe( 'my_jetpack_products_ai' );
	} );
} );

describe( 'connectionScreenRoute', () => {
	it( 'is the connection route with the name in its query', () => {
		expect( connectionScreenRoute( 'my_jetpack_products_backup' ) ).toBe(
			'/connection?from=my_jetpack_products_backup'
		);
	} );

	it( 'encodes the name', () => {
		expect( connectionScreenRoute( 'a&b' ) ).toBe( '/connection?from=a%26b' );
	} );
} );
