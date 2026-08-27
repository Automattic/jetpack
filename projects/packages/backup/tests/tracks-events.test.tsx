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
import { useAnalytics } from '../src/dashboard/hooks/use-analytics';
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

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const ORIGINAL_STATE = window.JP_CONNECTION_INITIAL_STATE;

beforeEach( () => {
	mockRecordEvent.mockReset();
	mockInitialize.mockReset();
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( null );
	queryClient.clear();
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

	it( 'does not identify anyone when the site has no connected WordPress.com user', async () => {
		// Recording still has to work — the events just carry no identity,
		// which is what legacy does and why the page view fires on an
		// unconnected site at all.
		setWpcomUser( undefined );

		renderHook( () => useAnalytics() );

		await waitFor( () => expect( mockInitialize ).not.toHaveBeenCalled() );
	} );

	it( 'refuses the lowercase id rather than reporting a phantom reader', async () => {
		// `Id` is the shape this package's own test fixture used to assert.
		// WordPress.com never sends it, so treating it as an identity would
		// mean initializing with `undefined` and silently losing every
		// event.
		setWpcomUser( { Id: 99999, login: 'bobsacramento' } );

		renderHook( () => useAnalytics() );

		await waitFor( () => expect( mockInitialize ).not.toHaveBeenCalled() );
	} );
} );

describe( 'Overview page view', () => {
	/**
	 * Render the Overview screen inside the dashboard's query client.
	 */
	async function renderOverview() {
		const OverviewScreen = ( await import( '../src/dashboard/screens/overview' ) ).default;

		render(
			<QueryClientProvider>
				<OverviewScreen />
			</QueryClientProvider>
		);
	}

	it( 'records one page view per visit', async () => {
		await renderOverview();

		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_admin_page_view' )
		);
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

		const enqueueCall = mockApiFetch.mock.calls.findIndex( ( [ opts ] ) =>
			String( opts?.path ?? '' ).includes( '/site/backup/enqueue' )
		);
		expect( enqueueCall ).toBeGreaterThanOrEqual( 0 );
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
