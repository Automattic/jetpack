// JETPACK-2301 (H1b) — the modernized dashboard fired none of the legacy
// dashboard's 12 Tracks events. #51403 put the Tracks *script* on the page
// by moving `Tracking::register_tracks_functions_scripts()` above an early
// return; it recorded nothing. These are the two events that are portable
// without a host surface that does not exist yet.
//
// The identity assertions are the point of the file as much as the events
// are. `jetpackAnalytics.initialize()` is skipped when the user id is
// missing, and every later `recordEvent` then reports nothing — a failure
// indistinguishable, in Tracks, from a dashboard nobody opened. The key is
// `ID`; WordPress.com's `/me` does not return `Id`.

const mockRecordEvent = jest.fn();
const mockInitialize = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: ( ...args: unknown[] ) => mockInitialize( ...args ),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

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
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { queryClient } from '../src/dashboard/data/query-client';
import { resetAnalyticsForTesting, useAnalytics } from '../src/dashboard/hooks/use-analytics';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

/**
 * Replace the connection global's wpcom user for one test.
 *
 * @param wpcomUser - The identity object, or undefined to remove it.
 */
function setWpcomUser( wpcomUser: unknown ) {
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
		userConnectionData: { currentUser: { wpcomUser } },
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
}

/**
 * Answer the endpoints `<BackupNowButton>` gates itself on.
 *
 * It returns null without a plan, so a bare mock renders nothing and a
 * click test would pass by never finding the button.
 */
function mockEndpointsForButton() {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path.includes( '/backups' ) ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * Answer the two routes `<NextScheduledBackup>` reads before it renders.
 *
 * It renders nothing without a readable hour, and nothing while WordPress.com
 * says backups have stopped — so a bare mock leaves no link to click and the
 * test would pass by finding neither the link nor the event.
 */
function mockEndpointsForSchedule() {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/backup/schedule' ) ) {
			return Promise.resolve( { ok: true, scheduled_hour: 10 } );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		return Promise.resolve( {} );
	} );
}

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const ORIGINAL_STATE = window.JP_CONNECTION_INITIAL_STATE;

beforeEach( () => {
	mockRecordEvent.mockReset();
	mockInitialize.mockReset();
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( null );
	queryClient.clear();
	resetAnalyticsForTesting();
	window.JP_CONNECTION_INITIAL_STATE = {
		...ORIGINAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'useAnalytics', () => {
	it( 'identifies the reader with the id WordPress.com actually sends', async () => {
		// Verified against a live connected site: the object carries `ID`,
		// `login`, `email`, `display_name` and eight more. The ambient type
		// declares only three of them, so this is the assertion standing in
		// for a type that cannot check it.
		renderHook( () => useAnalytics() );

		await waitFor( () => expect( mockInitialize ).toHaveBeenCalledWith( 99999, 'bobsacramento' ) );
	} );

	it( 'identifies the reader once per page load, not once per consumer', async () => {
		// `OverviewScreen` and its descendant `BackupNowButton` both call
		// this hook, so an unlatched effect would push a duplicate
		// `identifyUser` onto `_tkq` for every consumer — twice per mount,
		// four times under StrictMode.
		renderHook( () => useAnalytics() );
		renderHook( () => useAnalytics() );

		await waitFor( () => expect( mockInitialize ).toHaveBeenCalled() );
		expect( mockInitialize ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not identify anyone when the site has no connected WordPress.com user', async () => {
		// Recording still has to work — the events just carry no identity,
		// which is what legacy does and why the page view fires on an
		// unconnected site at all.
		setWpcomUser( undefined );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );

	it( 'refuses the lowercase id rather than reporting a phantom reader', async () => {
		// `Id` is the shape this package's own test fixture used to assert.
		// WordPress.com never sends it, so treating it as an identity would
		// mean initializing with `undefined` and silently losing every
		// event.
		setWpcomUser( { Id: 99999, login: 'bobsacramento' } );

		renderHook( () => useAnalytics() );

		expect( mockInitialize ).not.toHaveBeenCalled();
	} );
} );

describe( 'Overview page view', () => {
	/**
	 * Render the Overview screen inside the dashboard's query client.
	 *
	 * @return The Testing Library render result, whose `unmount` stands in
	 * for a client-side transition away from this route.
	 */
	async function renderOverview() {
		const mod = await import( '../src/dashboard/screens/overview' );
		const OverviewScreen = mod.default;

		return render(
			<QueryClientProvider>
				<OverviewScreen />
			</QueryClientProvider>
		);
	}

	beforeEach( async () => {
		( await import( '../src/dashboard/screens/overview' ) ).resetPageViewForTesting();
	} );

	it( 'records one page view per visit', async () => {
		await renderOverview();

		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_admin_page_view' )
		);
		expect(
			mockRecordEvent.mock.calls.filter( c => c[ 0 ] === 'jetpack_backup_admin_page_view' )
		).toHaveLength( 1 );
	} );

	it( 'records once across a client-side round trip to another route', async () => {
		// The three routes share one admin page — each `package.json`
		// declares `"page": "jetpack-backup-dashboard"` — so Overview →
		// Download → back is a client-side transition that unmounts and
		// remounts this screen. A per-component latch resets with it and
		// records a second view for the same visit, which is exactly the
		// over-counting the Overview-only decision exists to prevent.
		const { unmount } = await renderOverview();
		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_admin_page_view' )
		);

		unmount();
		await renderOverview();

		expect(
			mockRecordEvent.mock.calls.filter( c => c[ 0 ] === 'jetpack_backup_admin_page_view' )
		).toHaveLength( 1 );
	} );

	it( 'identifies the reader before recording the view', async () => {
		// Ordering, not coincidence: an event recorded before
		// `initialize()` carries no identity, so the hook is called ahead
		// of the page-view effect on purpose.
		await renderOverview();

		await waitFor( () => expect( mockRecordEvent ).toHaveBeenCalled() );
		expect( mockInitialize.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockRecordEvent.mock.invocationCallOrder[ 0 ]
		);
	} );
} );

describe( 'Back up now', () => {
	it( 'records the ask, and records it before the request goes out', async () => {
		// Legacy records on the click, not on a successful enqueue
		// (`back-up-now/index.jsx:25-26`). The event measures the reader
		// asking for a backup, so a WordPress.com refusal still counts as
		// an ask — recording on success would drop exactly the failures
		// worth knowing about.
		mockEndpointsForButton();
		const BackupNowButton = ( await import( '../src/dashboard/components/backup-now-button' ) )
			.default;

		render(
			<QueryClientProvider>
				<BackupNowButton />
			</QueryClientProvider>
		);

		const button = await screen.findByRole( 'button', { name: /back up now/i } );
		mockApiFetch.mockClear();
		await userEvent.click( button );

		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_plugin_backup_now' )
		);

		// Asserting both happened is not enough — it passes just as well
		// when the event is recorded on a successful enqueue, because the
		// mocked enqueue resolves. Only the ordering distinguishes them.
		const enqueueCall = mockApiFetch.mock.calls.findIndex( ( [ opts ] ) =>
			String( opts?.path ?? '' ).includes( '/site/backup/enqueue' )
		);
		expect( enqueueCall ).toBeGreaterThanOrEqual( 0 );
		expect( mockRecordEvent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			mockApiFetch.mock.invocationCallOrder[ enqueueCall ]
		);
	} );

	it( 'records nothing until the reader actually clicks', async () => {
		mockEndpointsForButton();
		const BackupNowButton = ( await import( '../src/dashboard/components/backup-now-button' ) )
			.default;

		render(
			<QueryClientProvider>
				<BackupNowButton />
			</QueryClientProvider>
		);

		await expect(
			screen.findByRole( 'button', { name: /back up now/i } )
		).resolves.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );

describe( 'Modify schedule', () => {
	/**
	 * Render the next-backup line inside the dashboard's query client.
	 *
	 * @return The Testing Library render result.
	 */
	async function renderScheduleLine() {
		mockEndpointsForSchedule();
		const NextScheduledBackup = (
			await import( '../src/dashboard/components/next-scheduled-backup' )
		).default;

		return render(
			<QueryClientProvider>
				<NextScheduledBackup />
			</QueryClientProvider>
		);
	}

	/**
	 * The "Modify" link, once the two reads behind the line have landed.
	 *
	 * Matched on a fragment of its name: `Link` appends an "(opens in a new tab)"
	 * indicator to anything with `openInNewTab`.
	 *
	 * @return The anchor.
	 */
	function modifyLink(): Promise< HTMLElement > {
		return screen.findByRole( 'link', { name: /Modify/ } );
	}

	// JETPACK-2329. Legacy records this on the "Modify" link beside the
	// next-backup line (`js/components/next-scheduled-backup.tsx:29-31`). The link
	// and the event were held back together when that line was ported, so they
	// come back together — otherwise the only measurement of readers leaving for
	// `cloud.jetpack.com/settings` is silently missing.
	it( 'records the reader leaving for the schedule settings', async () => {
		await renderScheduleLine();

		await userEvent.click( await modifyLink() );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_schedule_modify_click' );
		// Once, not merely at least once: a row that later grew a second click
		// target would double-count every Modify click in Tracks, silently.
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'records nothing until the reader actually clicks', async () => {
		await renderScheduleLine();

		// Settled on the link being there to click, so this is a click that did
		// not happen rather than a component that never rendered.
		await expect( modifyLink() ).resolves.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );
