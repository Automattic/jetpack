import { needsReportDateParamsSeed } from '@jetpack-premium-analytics/data';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { route } from './route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
	needsReportDateParamsSeed: jest.fn( () => false ),
	// Carries incoming params through, as the real normalizer keeps the detail scopes.
	normalizeReportParams: jest.fn( ( search: Record< string, string | undefined > ) => ( {
		from: '2026-06-01T00:00:00',
		to: '2026-06-16T23:59:59',
		...search,
	} ) ),
} ) );

jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
} ) );

jest.mock( './registry', () => ( {
	getReportDefinition: jest.fn( ( report?: string ) => ( report === 'authors' ? {} : undefined ) ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

const beforeLoad = ( params?: object, search?: object ) =>
	route.beforeLoad( { params, search } as Parameters< typeof route.beforeLoad >[ 0 ] );

describe( 'report route.beforeLoad', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'redirects to /connect when the site is not connected', async () => {
		( isPremiumAnalyticsSiteConnected as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( { report: 'authors' } ) ).rejects.toMatchObject( {
			to: '/connect',
		} );
	} );

	it.each( [ undefined, 'unknown' ] )(
		'redirects home for an unknown report (%p)',
		async report => {
			await expect( beforeLoad( { report } ) ).rejects.toMatchObject( { to: '/' } );
		}
	);

	it( 'passes through a settled URL without redirecting', async () => {
		await expect(
			beforeLoad( { report: 'authors' }, { from: '2026-06-01', to: '2026-06-16' } )
		).resolves.toBeUndefined();
	} );

	it( 'drops the detail-page scopes that arrived on the URL while seeding', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await beforeLoad( { report: 'authors' }, { post_id: '42', author_id: '7' } );
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown?.search ).toMatchObject( { from: expect.any( String ) } );
		expect( thrown?.search ).not.toHaveProperty( 'post_id' );
		expect( thrown?.search ).not.toHaveProperty( 'author_id' );
	} );
} );
