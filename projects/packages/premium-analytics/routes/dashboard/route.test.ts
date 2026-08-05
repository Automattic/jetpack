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

	it( 'redirects to /syncing before the initial sync finishes', async () => {
		( isPremiumAnalyticsInitialSyncFinished as jest.Mock ).mockReturnValueOnce( false );

		await expect( beforeLoad( settledSearch ) ).rejects.toMatchObject( { to: '/syncing' } );
	} );

	it( 're-seeds the date params when they are missing', async () => {
		( needsReportDateParamsSeed as jest.Mock ).mockReturnValueOnce( true );

		await expect( beforeLoad( {} ) ).rejects.toMatchObject( { to: '/', replace: true } );
	} );

	it( 'registers both dashboard entities on a fresh store', async () => {
		mockGetEntityConfig.mockReturnValue( undefined );

		await beforeLoad( settledSearch );

		expect( registeredNames() ).toEqual( [ 'widgetModule', 'dashboardSection' ] );
	} );

	it( 'registers dashboardSection even when a detail-page entry already registered widgetModule', async () => {
		// Regression for the empty edit-mode dashboard: reloading on a detail
		// page registered `widgetModule` alone, and the dashboard's old guard
		// then skipped `dashboardSection` entirely, so the stage resolved zero
		// sections and force-opened an empty edit-mode canvas.
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
