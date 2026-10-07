import {
	ensureCoreSettingsReady,
	getStatsStartDate,
	needsReportDateParamsSeed,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { getReportDefinition } from './registry';
import { route } from './route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
	getStatsStartDate: jest.fn( () => undefined ),
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

	it( 'redirects home for an unknown report', async () => {
		await expect( beforeLoad( { report: 'unknown' } ) ).rejects.toMatchObject( { to: '/' } );
	} );

	it( 'passes through a settled URL without redirecting', async () => {
		await expect(
			beforeLoad( { report: 'authors' }, { from: '2026-06-01', to: '2026-06-16' } )
		).resolves.toBeUndefined();
	} );

	describe( 'on a report with sections', () => {
		beforeEach( () => {
			( getReportDefinition as jest.Mock ).mockReturnValueOnce( {
				resolveSection: ( value?: string ) => ( value === 'b' ? 'b' : 'a' ),
			} );
		} );

		it( 'replaces a section the report does not own with its default', async () => {
			await expect(
				beforeLoad( { report: 'authors' }, { section: 'bogus' } )
			).rejects.toMatchObject( { search: { section: 'a' }, replace: true } );
		} );

		it( 'passes through a section the report owns', async () => {
			await expect(
				beforeLoad( { report: 'authors' }, { section: 'b' } )
			).resolves.toBeUndefined();
		} );
	} );

	describe( 'on an all-time window', () => {
		beforeEach( () => {
			( getStatsStartDate as jest.Mock ).mockReturnValue( toLocalTZ( '2012-03-04', 'UTC' ) );
		} );

		afterEach( () => {
			( getStatsStartDate as jest.Mock ).mockReturnValue( undefined );
		} );

		const yearSurfaceLink = {
			preset: 'all-time',
			from: '2021-01-01T00:00:00.000+00:00',
			to: '2026-06-16T00:00:00.000+00:00',
		};

		it( 'moves a linked start to the day Stats start', async () => {
			await expect( beforeLoad( { report: 'authors' }, yearSurfaceLink ) ).rejects.toMatchObject( {
				search: { preset: 'all-time', from: expect.stringMatching( /^2012-03-04T00:00:00/ ) },
				replace: true,
			} );
		} );

		it( 'passes through a start already on that day', async () => {
			let thrown: { search: Record< string, string > } | undefined;
			try {
				await beforeLoad( { report: 'authors' }, yearSurfaceLink );
			} catch ( error ) {
				thrown = error as { search: Record< string, string > };
			}

			await expect( beforeLoad( { report: 'authors' }, thrown?.search ) ).resolves.toBeUndefined();
		} );
	} );

	it( 'still seeds the URL when the site settings fail to load', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );
		( ensureCoreSettingsReady as jest.Mock ).mockRejectedValueOnce( new Error( 'offline' ) );

		await expect( beforeLoad( { report: 'authors' } ) ).rejects.toMatchObject( {
			to: '/reports/$report',
		} );
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

	it( 'keeps the dashboard origin through the seeding redirect', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );
		// The real normalizer drops params it does not own, so the seed has to add `ds` back.
		( normalizeReportParams as jest.Mock ).mockImplementationOnce( () => ( {
			from: '2026-06-01',
		} ) );

		await expect( beforeLoad( { report: 'authors' }, { ds: 'insights' } ) ).rejects.toMatchObject( {
			search: { ds: 'insights' },
		} );
	} );
} );
