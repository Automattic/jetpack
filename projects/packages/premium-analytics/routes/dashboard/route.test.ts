import { needsReportDateParamsSeed } from '@jetpack-premium-analytics/data';
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
} from '../site-readiness';
import { route } from './route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
	needsReportDateParamsSeed: jest.fn( () => false ),
	normalizeReportParams: jest.fn( ( search: Record< string, string | undefined > ) => ( {
		from: '2026-06-01T00:00:00',
		to: '2026-06-16T23:59:59',
		...search,
	} ) ),
	// Real semantics, without pulling the data barrel: the seed's comparison
	// stripping is under test here.
	hasComparisonEnabled: ( params: {
		comp?: unknown;
		compare_from?: string;
		compare_to?: string;
	} ) => String( params.comp ) === '1' && !! params.compare_from && !! params.compare_to,
	withoutComparison: ( params: Record< string, unknown > ) => {
		const next = { ...params };
		delete next.comp;
		delete next.compare_from;
		delete next.compare_to;
		delete next.compare_preset;
		return next;
	},
} ) );

jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
	isPremiumAnalyticsInitialSyncFinished: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

const mockGetEntityConfig = jest.fn();
const mockAddEntities = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	select: () => ( { getEntityConfig: mockGetEntityConfig } ),
	dispatch: () => ( { addEntities: mockAddEntities } ),
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

// A search that needs no seeding: the seed check is mocked false.
const settledSearch = {
	from: '2026-06-01T00:00:00',
	to: '2026-06-16T23:59:59',
	interval: 'day',
};

const beforeLoad = ( search?: object ) =>
	route.beforeLoad( { search } as Parameters< typeof route.beforeLoad >[ 0 ] );

/**
 * The names registered across all `addEntities` calls.
 *
 * @return The registered entity names.
 */
function registeredNames(): string[] {
	return mockAddEntities.mock.calls.flatMap( ( [ entities ] ) =>
		( entities as { name: string }[] ).map( entity => entity.name )
	);
}

describe( 'dashboard route.beforeLoad', () => {
	afterEach( () => {
		jest.clearAllMocks();
		mockGetEntityConfig.mockReset();
	} );

	it( 'redirects to /connect when the site is not connected', async () => {
		( isPremiumAnalyticsSiteConnected as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( settledSearch ) ).rejects.toMatchObject( { to: '/connect' } );
	} );

	// Only the store section's data waits on the analytics sync, so an unfinished
	// sync must not hold back the site sections.
	it( 'loads the dashboard before the initial sync finishes', async () => {
		( isPremiumAnalyticsInitialSyncFinished as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( settledSearch ) ).resolves.toBeUndefined();
	} );

	it( 're-seeds the date params when they are missing', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );

		await expect( beforeLoad( {} ) ).rejects.toMatchObject( { to: '/', replace: true } );
	} );

	/**
	 * Run the seed for a search and return the search the redirect writes.
	 *
	 * @param search - The URL search params the route loads with.
	 * @return The seeded search params.
	 */
	async function seededSearch( search: object ): Promise< Record< string, unknown > > {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );

		const thrown = ( await beforeLoad( search ).then(
			() => null,
			( redirectResult: unknown ) => redirectResult
		) ) as { search: Record< string, unknown > } | null;

		if ( ! thrown ) {
			throw new Error( 'expected the seed to redirect' );
		}

		return thrown.search;
	}

	// A hand-edited bare `comp=1` (no compare dates) must not ride through the
	// seed into the URL it writes.
	it( 'drops stray comparison params from the seed', async () => {
		const search = await seededSearch( {
			comp: '1',
			compare_preset: 'previous-period',
			section: 'store',
		} );

		expect( search ).toMatchObject( { section: 'store' } );
		expect( search ).not.toHaveProperty( 'comp' );
		expect( search ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'keeps a complete comparison through the seed', async () => {
		const search = await seededSearch( {
			comp: '1',
			compare_from: '2026-05-01T00:00:00',
			compare_to: '2026-05-16T23:59:59',
			compare_preset: 'previous-period',
		} );

		expect( search ).toMatchObject( { comp: '1', compare_preset: 'previous-period' } );
	} );

	it( 'registers both dashboard entities on a fresh store', async () => {
		mockGetEntityConfig.mockReturnValue( undefined );

		await beforeLoad( settledSearch );

		expect( registeredNames() ).toEqual( [ 'widgetModule', 'dashboardSection' ] );
	} );

	it( 'registers dashboardSection even when a detail-page entry already registered widgetModule', async () => {
		// Regression: reloading on a detail page had registered `widgetModule` alone,
		// so the old guard skipped `dashboardSection`, force-opening an empty canvas.
		mockGetEntityConfig.mockImplementation( ( _kind: string, name: string ) =>
			name === 'widgetModule' ? {} : undefined
		);

		await beforeLoad( settledSearch );

		expect( registeredNames() ).toEqual( [ 'dashboardSection' ] );
	} );

	it( 'does not re-register entities that already exist', async () => {
		mockGetEntityConfig.mockReturnValue( {} );

		await beforeLoad( settledSearch );

		expect( mockAddEntities ).not.toHaveBeenCalled();
	} );
} );
