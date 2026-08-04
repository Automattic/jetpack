import { needsReportDateParamsSeed } from '@jetpack-premium-analytics/data';
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
} from '../site-readiness';
import { route } from './route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
	needsReportDateParamsSeed: jest.fn( () => false ),
	// Mirrors the real normalizer's relevant behavior: carries incoming params
	// through and adds a default comparison preset on top.
	normalizeReportParams: jest.fn( ( search: Record< string, string | undefined > ) => ( {
		from: '2026-06-01T00:00:00',
		to: '2026-06-16T23:59:59',
		...search,
		comp: search.comp ?? 'previous_period',
	} ) ),
} ) );

jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
	isPremiumAnalyticsInitialSyncFinished: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

const mockGetEntityConfig = jest.fn( () => ( {} ) );
const mockAddEntities = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	select: () => ( { getEntityConfig: mockGetEntityConfig } ),
	dispatch: () => ( { addEntities: mockAddEntities } ),
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

// A search that needs no seeding at all for video 42: dates present (the seed
// check is mocked false), the post scope matches, and no comparison params.
const settledSearch = {
	from: '2026-06-01T00:00:00',
	to: '2026-06-16T23:59:59',
	post_id: '42',
};

const beforeLoad = ( params?: object, search?: object ) =>
	route.beforeLoad( { params, search } as Parameters< typeof route.beforeLoad >[ 0 ] );

describe( 'video detail route.beforeLoad', () => {
	afterEach( () => {
		jest.clearAllMocks();
		mockGetEntityConfig.mockReturnValue( {} );
	} );

	it( 'redirects to /connect when the site is not connected', async () => {
		( isPremiumAnalyticsSiteConnected as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( { videoId: '42' } ) ).rejects.toMatchObject( { to: '/connect' } );
	} );

	it( 'redirects to /syncing before the initial sync finishes', async () => {
		( isPremiumAnalyticsInitialSyncFinished as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( { videoId: '42' } ) ).rejects.toMatchObject( { to: '/syncing' } );
	} );

	it.each( [ undefined, '', 'abc', '-3', '0', '1.5' ] )(
		'redirects home for an invalid videoId (%p)',
		async videoId => {
			await expect( beforeLoad( { videoId }, settledSearch ) ).rejects.toMatchObject( {
				to: '/',
			} );
		}
	);

	it( 'passes through a settled URL without redirecting', async () => {
		await expect( beforeLoad( { videoId: '42' }, settledSearch ) ).resolves.toBeUndefined();
	} );

	it( 'seeds the post scope into the URL when it does not match the path', async () => {
		await expect(
			beforeLoad( { videoId: '42' }, { ...settledSearch, post_id: '7' } )
		).rejects.toMatchObject( {
			to: '/video/$videoId',
			replace: true,
			params: { videoId: '42' },
			search: expect.objectContaining( { post_id: '42' } ),
		} );
	} );

	it( 'seeds when the date params are missing', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );

		await expect( beforeLoad( { videoId: '42' }, { post_id: '42' } ) ).rejects.toMatchObject( {
			to: '/video/$videoId',
			search: expect.objectContaining( { from: expect.any( String ), post_id: '42' } ),
		} );
	} );

	// The page renders no comparison, but the dashboard link carries the URL
	// state back out — stripping the params would lose the user's comparison
	// settings on a Dashboard → Video → Dashboard round trip.
	it( 'passes through comparison params without redirecting on a settled URL', async () => {
		await expect(
			beforeLoad( { videoId: '42' }, { ...settledSearch, comp: 'previous_period' } )
		).resolves.toBeUndefined();
	} );

	it( 'carries comparison params through the seeded URL untouched', async () => {
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await beforeLoad(
				{ videoId: '42' },
				{
					...settledSearch,
					post_id: '7',
					comp: 'previous_period',
					compare_from: '2026-05-01T00:00:00',
				}
			);
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown ).toMatchObject( { to: '/video/$videoId' } );
		expect( thrown?.search ).toMatchObject( {
			post_id: '42',
			comp: 'previous_period',
			compare_from: '2026-05-01T00:00:00',
		} );
	} );

	it( 'registers the widget-module entity exactly once', async () => {
		mockGetEntityConfig.mockReturnValueOnce( undefined as unknown as object );

		await beforeLoad( { videoId: '42' }, settledSearch );
		expect( mockAddEntities ).toHaveBeenCalledTimes( 1 );

		// Registered now, so the next pass skips.
		await beforeLoad( { videoId: '42' }, settledSearch );
		expect( mockAddEntities ).toHaveBeenCalledTimes( 1 );
	} );
} );
