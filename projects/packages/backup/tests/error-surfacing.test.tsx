// Regression tests for JETPACK-2243 D3.
//
// Every one of these failures used to render as an ordinary empty state.
// `useActivityLog` and `useFileTree` both computed an `error` and handed
// it back; three consumers destructured everything except that field, so
// a 5xx and "there is nothing here" produced identical output. The whole
// point of these tests is the *distinction*, so each one asserts both
// that the reason appears and that the misleading empty-state copy does
// not.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();
const mockNavigate = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => mockNavigate,
	useParams: () => ( { rewindId: '1777035492' } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import ErrorBoundary from '../src/dashboard/components/error-boundary';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const CAPABILITIES = { hasBackupPlan: true, hasScan: false };

/**
 * These render a whole route stage behind three sequential round-trips —
 * capabilities, then activity, then the file listing — each with its own
 * React Query state transitions. Testing Library's default `findBy`
 * window is 1s, which is comfortable locally and not on a loaded CI
 * runner under coverage instrumentation: this suite has taken 32s there
 * against 8s here. The wait is for a deterministic chain, so a longer
 * ceiling costs nothing when it passes.
 */
const SETTLE = { timeout: 10000 };

/**
 * Route requests by path so one endpoint can fail while the rest answer.
 * The gates have to pass before the body — and therefore the failure
 * under test — is ever rendered.
 *
 * @param failing       - Path fragment that should reject.
 * @param error         - The rejection payload.
 * @param error.code    - Error code, as the bridges emit it.
 * @param error.message - Human-readable reason.
 */
function failOnly( failing: string, error: { code: string; message: string } ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( failing ) ) {
			return Promise.reject( error );
		}
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( CAPABILITIES );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * One rewindable-activity backup row, enough for the Overview to
 * preselect it and mount the file browser against it.
 *
 * @return A raw activity entry.
 */
function backupActivityEntry() {
	return {
		activity_id: 'act-1',
		gridicon: 'cloud',
		summary: 'Backup complete',
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: '1786644531.123',
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '46 plugins, 23 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/**
 * Serve a selectable backup, and fail the file-tree listing.
 *
 * @param error         - The rejection payload for `/rewind/backup/ls`.
 * @param error.code    - Error code, as the bridges emit it.
 * @param error.message - Human-readable reason.
 */
function failFileTree( error: { code: string; message: string } ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.reject( error );
		}
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( CAPABILITIES );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return Promise.resolve( {
				current: { orderedItems: [ backupActivityEntry() ] },
				totalItems: 1,
				totalPages: 1,
			} );
		}
		return Promise.resolve( {} );
	} );
}

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row. Defined rather than spied on:
// `jest.spyOn` requires the property to already exist.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( CAPABILITIES );
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'activity list', () => {
	it( 'reports a failed request instead of "No results"', async () => {
		failOnly( '/site/rewindable-activity', {
			code: 'activity_log_fetch_failed',
			message: 'Service unavailable',
		} );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We couldn't load your site's activity.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		// The upstream reason is the only part a support agent can act on.
		expect( screen.getByText( 'Service unavailable' ) ).toBeInTheDocument();
		// The regression: a 5xx telling the reader their site has no activity.
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
	} );

	it( 'still shows the plain empty state when the request simply returns nothing', async () => {
		// Same rendered path, opposite cause — proves the new branch is
		// keyed on the error and not on emptiness.
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( CAPABILITIES );
			}
			return Promise.resolve( { current: { orderedItems: [] }, totalItems: 0, totalPages: 0 } );
		} );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'No results', undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( "We couldn't load your site's activity." )
		).not.toBeInTheDocument();
	} );
} );

describe( 'file browser', () => {
	// The only change in this PR that *removes* rendered UI, which is why
	// it is worth pinning: a failed root tree used to render an empty tree
	// under a "0 items selected" header, i.e. a successfully-loaded backup
	// that happens to contain nothing. A silently restored header would put
	// that misleading affordance back with every other test still green.
	it( 'reports a failed root tree and drops the selection header', async () => {
		failFileTree( { code: 'file_tree_fetch_failed', message: 'Backup storage unreachable' } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We couldn't load this backup's files.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Backup storage unreachable' ) ).toBeInTheDocument();
		// The regression: a selection summary over a tree that isn't there.
		expect( screen.queryByText( /items? selected/ ) ).not.toBeInTheDocument();
	} );

	it( 'says a folder could not be read rather than that it is empty', async () => {
		// The root listing succeeds; only the folder's own fetch fails.
		mockApiFetch.mockImplementation( ( options: { path?: string; data?: unknown } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( CAPABILITIES );
			}
			if ( path.includes( '/site/rewindable-activity' ) ) {
				return Promise.resolve( {
					current: { orderedItems: [ backupActivityEntry() ] },
					totalItems: 1,
					totalPages: 1,
				} );
			}
			if ( path.includes( '/rewind/backup/ls' ) ) {
				const folder = ( options as { data?: { path?: string } } )?.data?.path;
				if ( folder && folder !== '/' ) {
					return Promise.reject( { code: 'x', message: 'Unreadable' } );
				}
				return Promise.resolve( { contents: { 'wp-content': { type: 'dir' } } } );
			}
			return Promise.resolve( {} );
		} );

		render( <OverviewStage /> );

		await userEvent.click( await screen.findByRole( 'button', { name: /wp-content/ }, SETTLE ) );

		// "we couldn't look inside" and "there is nothing inside" used to
		// be the same output.
		await expect(
			screen.findByText( "Couldn't load this folder.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Empty' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ErrorBoundary', () => {
	/**
	 * Stands in for the known real hazard: `toFileNode` raising
	 * `RangeError: Invalid time value` on a malformed manifest timestamp,
	 * inside a `useMemo` on the render path.
	 */
	function Exploding(): never {
		throw new Error( 'Invalid time value' );
	}

	it( 'replaces a crashed subtree with a recoverable message', () => {
		render(
			<ErrorBoundary>
				<Exploding />
			</ErrorBoundary>
		);

		expect( screen.getByText( 'Something went wrong' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Invalid time value' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Reload the page' } ) ).toBeInTheDocument();
		// React logs the caught error, and so does componentDidCatch —
		// @wordpress/jest-console fails the test unless that is claimed.
		expect( console ).toHaveErrored();
	} );

	it( 'renders children untouched when nothing throws', () => {
		render(
			<ErrorBoundary>
				<p>All good</p>
			</ErrorBoundary>
		);

		expect( screen.getByText( 'All good' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Something went wrong' ) ).not.toBeInTheDocument();
	} );
} );
