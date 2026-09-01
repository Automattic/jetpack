// JETPACK-2322: behind the no-plan upsell the Overview kept reading — and polling —
// WordPress.com for answers nothing there could act on. Each negative below is an
// `apiFetch` call count paired with a positive that proves the screen rendered, since
// "no request was made" is also true of a tree that threw first.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( {} ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, screen } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';
import { BACKUPS_POLL_INTERVAL_MS } from '../src/dashboard/hooks/use-backups';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SETTLE = { timeout: 10000 };

const NO_PLAN = "This site doesn't have an active Backup plan";
const UPSELL_CTA = /^Get VaultPress Backup$/;

const CAPABILITIES_PATH = '/jetpack/v4/site/capabilities';
const BACKUPS_PATH = '/jetpack/v4/backups';
const ACTIVITY_PATH = '/jetpack/v4/site/rewindable-activity';
const SITE_SIZE_PATH = '/jetpack/v4/site/backup/size';

/**
 * A backup still running, so `useBackups` wants the poll — without it the polling
 * negative below would hold on a site that never asked for one.
 */
const RUNNING_BACKUP = {
	id: '1',
	started: '2026-08-14 17:25:46',
	last_updated: '2026-08-14 17:36:04',
	status: 'started',
	period: '1786644532',
	percent: '50',
	is_backup: '1',
	is_scan: '0',
};

/** Flipped per test; the only difference between the negatives and their control. */
let hasBackupPlan = false;

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

/**
 * How many times `apiFetch` has been asked for a route, ignoring query args.
 *
 * @param route - The fully-qualified path, without query args.
 * @return The call count.
 */
function asked( route: string ): number {
	return mockApiFetch.mock.calls.filter( ( [ options ] ) => {
		const path = String( options?.path ?? '' );
		return path === route || path.startsWith( `${ route }?` );
	} ).length;
}

/**
 * Run `count` poll intervals and let everything they trigger settle, so a
 * count read afterwards is final rather than mid-flight.
 *
 * @param count - How many intervals to advance.
 */
async function pollTicks( count: number ): Promise< void > {
	for ( let i = 0; i < count; i++ ) {
		await act( async () => {
			await jest.advanceTimersByTimeAsync( BACKUPS_POLL_INTERVAL_MS );
		} );
	}
	await act( async () => {
		await jest.advanceTimersByTimeAsync( 0 );
	} );
}

beforeEach( () => {
	jest.useFakeTimers();
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	hasBackupPlan = false;
	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.startsWith( CAPABILITIES_PATH ) ) {
			return Promise.resolve( { hasBackupPlan, hasScan: false } );
		}
		if ( path.startsWith( ACTIVITY_PATH ) ) {
			return Promise.resolve( { current: { orderedItems: [] }, totalItems: 0, totalPages: 1 } );
		}
		if ( path.startsWith( SITE_SIZE_PATH ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path === BACKUPS_PATH ) {
			return Promise.resolve( [ RUNNING_BACKUP ] );
		}
		// The promoted-product catalogue the upsell prices itself from.
		return Promise.resolve( null );
	} );

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'A connected site with no Backup plan', () => {
	it( 'asks WordPress.com only what the upsell itself can act on', async () => {
		render( <OverviewStage /> );

		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();
		await pollTicks( 1 );

		// The gate's own read: the positive that says this screen came from a real answer.
		expect( asked( CAPABILITIES_PATH ) ).toBe( 1 );

		// Reported together so a failure names every route still being read,
		// not just the first one.
		expect( {
			activity: asked( ACTIVITY_PATH ),
			backups: asked( BACKUPS_PATH ),
			siteSize: asked( SITE_SIZE_PATH ),
		} ).toEqual( { activity: 0, backups: 0, siteSize: 0 } );
	} );

	it( 'offers no header action, so nothing reads the site size on its behalf', async () => {
		render( <OverviewStage /> );

		// `/site/backup/size` is the header button's read alone, so the absence
		// above is only meaningful next to the absence of the button.
		await expect(
			screen.findByRole( 'link', { name: UPSELL_CTA }, SETTLE )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /Back up now|Backup in progress/ } )
		).not.toBeInTheDocument();
	} );

	it( 'never starts the backup poll', async () => {
		render( <OverviewStage /> );
		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();

		await pollTicks( 4 );

		expect( asked( BACKUPS_PATH ) ).toBe( 0 );
	} );
} );

describe( 'The same site once it has a plan', () => {
	// The control for the three negatives above: same fixtures, same timers, same tree,
	// only the entitlement differs — without it a harness that never fetches would pass.
	it( 'reads all three, and keeps polling the running backup', async () => {
		hasBackupPlan = true;

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: 'Backup in progress' }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( NO_PLAN ) ).not.toBeInTheDocument();

		const before = asked( BACKUPS_PATH );
		expect( {
			activity: asked( ACTIVITY_PATH ) > 0,
			backups: before > 0,
			siteSize: asked( SITE_SIZE_PATH ) > 0,
		} ).toEqual( { activity: true, backups: true, siteSize: true } );

		await pollTicks( 2 );
		expect( asked( BACKUPS_PATH ) ).toBeGreaterThan( before );
	} );
} );
