import { jest } from '@jest/globals';
import type { UserConnectionUrlOptions } from '../get-user-connection-url';

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getJetpackAdminPageUrl: () => 'https://example.org/wp-admin/admin.php?page=jetpack',
	getMyJetpackUrl: () => 'https://example.org/wp-admin/admin.php?page=my-jetpack',
} ) );

const RETURN_URL = 'https://example.org/wp-admin/admin.php?page=jetpack-backup';

let getUserConnectionUrl: ( options?: UserConnectionUrlOptions ) => string;

// Each warning fires once per page, so every test needs a fresh module.
beforeEach( async () => {
	jest.resetModules();
	( { getUserConnectionUrl } = await import( '../get-user-connection-url' ) );
} );

const queryOf = ( url: string ) => Object.fromEntries( new URL( url ).searchParams );
// eslint-disable-next-line no-console -- reads the calls the shared console guard recorded.
const warnings = () => jest.mocked( console.warn ).mock.calls.map( ( [ message ] ) => message );

describe( 'getUserConnectionUrl', () => {
	it( 'keeps its deprecated defaults', () => {
		expect( queryOf( getUserConnectionUrl() ) ).toEqual( {
			page: 'jetpack',
			connect_url_redirect: '1',
			redirect_after_auth: 'https://example.org/wp-admin/admin.php?page=my-jetpack',
			from: 'my-jetpack',
			skip_pricing: 'true',
		} );
		expect( console ).toHaveWarned();
	} );

	it.each( [ 'my_jetpack_header', 'jetpack-connector' ] )(
		'does not warn for %p with a return URL',
		from => {
			getUserConnectionUrl( { from, redirect_url: RETURN_URL } );

			expect( console ).not.toHaveWarned();
		}
	);

	it.each( [
		[ 'no `from`', { redirect_url: RETURN_URL }, 'without `from`' ],
		[
			'a legacy `from`',
			{ from: 'jetpack-newsletter', redirect_url: RETURN_URL },
			'"jetpack-newsletter"',
		],
		[ 'no return URL', { from: 'my_jetpack_header' }, 'without `redirect_url`' ],
	] )( 'warns once per page about %s', ( _, options, phrase ) => {
		getUserConnectionUrl( options );
		getUserConnectionUrl( options );

		expect( console ).toHaveWarned();
		expect( warnings() ).toEqual( [ expect.stringContaining( phrase ) ] );
	} );

	it( 'does not warn in production', () => {
		const nodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		try {
			getUserConnectionUrl();
		} finally {
			process.env.NODE_ENV = nodeEnv;
		}

		expect( console ).not.toHaveWarned();
	} );
} );
