import { needsReportDateParamsSeed } from '@jetpack-premium-analytics/data';
import {
	isDashboardSectionInPreviewScope,
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
	isVideoPressAvailable: jest.fn( () => true ),
	isDashboardSectionInPreviewScope: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

// A search that needs no seeding at all for author 7: dates present (the seed
// check is mocked false) and the author scope matches.
const settledSearch = {
	from: '2026-06-01T00:00:00',
	to: '2026-06-16T23:59:59',
	author_id: '7',
};

const beforeLoad = ( params?: object, search?: object ) =>
	route.beforeLoad( { params, search } as Parameters< typeof route.beforeLoad >[ 0 ] );

describe( 'author detail route.beforeLoad', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'redirects to /connect when the site is not connected', async () => {
		( isPremiumAnalyticsSiteConnected as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( { authorId: '7' } ) ).rejects.toMatchObject( { to: '/connect' } );
	} );

	it.each( [ undefined, '', 'abc', '-3', '0', '1.5' ] )(
		'redirects home for an invalid authorId (%p)',
		async authorId => {
			await expect( beforeLoad( { authorId }, settledSearch ) ).rejects.toMatchObject( {
				to: '/',
			} );
		}
	);

	it( 'redirects home when the Authors report is behind a hidden tab', async () => {
		( isDashboardSectionInPreviewScope as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( { authorId: '7' }, settledSearch ) ).rejects.toMatchObject( {
			to: '/',
		} );
	} );

	it( 'passes through a settled URL without redirecting', async () => {
		await expect( beforeLoad( { authorId: '7' }, settledSearch ) ).resolves.toBeUndefined();
	} );

	it( 'seeds the author scope into the URL when it does not match the path', async () => {
		await expect(
			beforeLoad( { authorId: '7' }, { ...settledSearch, author_id: '9' } )
		).rejects.toMatchObject( {
			to: '/author/$authorId',
			replace: true,
			params: { authorId: '7' },
			search: expect.objectContaining( { author_id: '7' } ),
		} );
	} );

	it( 'seeds when the date params are missing', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );

		await expect( beforeLoad( { authorId: '7' }, { author_id: '7' } ) ).rejects.toMatchObject( {
			to: '/author/$authorId',
			search: expect.objectContaining( { from: expect.any( String ), author_id: '7' } ),
		} );
	} );

	it( 'drops a post scope that arrived on the URL while seeding', async () => {
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await beforeLoad( { authorId: '7' }, { ...settledSearch, author_id: '9', post_id: '42' } );
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown?.search ).toMatchObject( { author_id: '7' } );
		expect( thrown?.search ).not.toHaveProperty( 'post_id' );
	} );
} );
