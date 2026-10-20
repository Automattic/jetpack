// Regression tests for JETPACK-2243 D3.
//
// Every one of these failures used to render as an ordinary empty state.
// `useActivityLog` and `useFileTree` both computed an `error` and handed
// it back; three consumers destructured everything except that field, so
// a 5xx and "there is nothing here" produced identical output. The whole
// point of these tests is the *distinction*, so each one asserts both
// that the reason appears and that the misleading empty-state copy does
// not.

const mockRecordEvent = jest.fn();
const mockApiFetch = jest.fn();

const mockSearch = jest.fn< Record< string, unknown >, [] >();
const mockNavigate = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import ErrorBoundary from '../src/dashboard/components/error-boundary';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const CAPABILITIES = { hasBackupPlan: true, hasScan: false };

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

/**
 * Serve a two-page activity log whose second page answers as `page2` says.
 * `/jetpack/v4/backups` answers too, so no second notice is on screen.
 *
 * @param page2 - Produces the response for page 2.
 */
function mockTwoPages( page2: () => Promise< unknown > ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( CAPABILITIES );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( [] );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return path.includes( 'page=2' )
				? page2()
				: Promise.resolve( {
						current: { orderedItems: [ backupActivityEntry() ] },
						totalItems: 2,
						totalPages: 2,
					} );
		}
		return Promise.resolve( {} );
	} );
}

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
			screen.findByText( "We couldn't load your site's activity." )
		).resolves.toBeInTheDocument();
		// The upstream reason is the only part a support agent can act on.
		expect( screen.getByText( 'Service unavailable' ) ).toBeInTheDocument();
		// The regression: a 5xx telling the reader their site has no activity.
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
		// The notice replaces the list card.
		expect( screen.queryByRole( 'heading', { name: 'Latest backups' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the list layout and a way back when a later page fails', async () => {
		mockTwoPages( () =>
			Promise.reject( { code: 'activity_log_fetch_failed', message: 'Service unavailable' } )
		);

		render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Next page' } ) );

		await expect(
			screen.findByText( "We couldn't load your site's activity." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Latest backups' } ) ).toBeInTheDocument();
		// The pager is what gets the reader back.
		await userEvent.click( screen.getByRole( 'button', { name: 'Previous page' } ) );
		await expect( screen.findAllByText( 'Backup complete' ) ).resolves.not.toHaveLength( 0 );
	} );

	it( 'does not fill a failed page with the previous page while it retries', async () => {
		let failPage2 = true;
		let resolvePage2: ( value: unknown ) => void = () => {};
		mockTwoPages( () =>
			failPage2
				? Promise.reject( { code: 'activity_log_fetch_failed', message: 'Service unavailable' } )
				: new Promise( resolve => {
						resolvePage2 = resolve;
					} )
		);

		render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByText( "We couldn't load your site's activity." )
		).resolves.toBeInTheDocument();

		// The detail pane keeps its heading; only the list rows are in question.
		const before = screen.getAllByText( 'Backup complete' ).length;
		failPage2 = false;
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		expect( screen.getAllByText( 'Backup complete' ) ).toHaveLength( before );
		expect( screen.getByText( "We couldn't load your site's activity." ) ).toBeInTheDocument();

		resolvePage2( {
			current: { orderedItems: [ backupActivityEntry() ] },
			totalItems: 2,
			totalPages: 2,
		} );
		await waitFor( () =>
			expect( screen.getByRole( 'heading', { name: 'Latest backups' } ) ).toHaveFocus()
		);
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

		await expect( screen.findByText( 'No results' ) ).resolves.toBeInTheDocument();
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
			screen.findByText( "We couldn't load this backup's files." )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Backup storage unreachable' ) ).toBeInTheDocument();
		// The regression: a selection summary over a tree that isn't there.
		expect( screen.queryByText( /items? selected/ ) ).not.toBeInTheDocument();
	} );

	it( 'offers Contact support beside the retry when the root tree fails', async () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			siteSuffix: 'example.wordpress.com',
		} as typeof window.JP_CONNECTION_INITIAL_STATE;
		failFileTree( { code: 'file_tree_fetch_failed', message: 'Backup storage unreachable' } );

		render( <OverviewStage /> );

		const link = await screen.findByRole( 'link', { name: /^Contact support/ } );
		expect( link ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-contact-support&site=example.wordpress.com'
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
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

		await userEvent.click( await screen.findByRole( 'button', { name: /wp-content/ } ) );

		// "we couldn't look inside" and "there is nothing inside" used to
		// be the same output.
		await expect( screen.findByText( "Couldn't load this folder." ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Empty' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ErrorBoundary', () => {
	beforeEach( () => {
		mockRecordEvent.mockReset();
	} );

	/**
	 * Stands in for the known real hazard: `toFileNode` raising
	 * `RangeError: Invalid time value` on a malformed manifest timestamp,
	 * inside a `useMemo` on the render path.
	 */
	function Exploding(): never {
		throw new RangeError( 'Invalid time value' );
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
		// The `jetpack-js-tools` console guard fails the test unless that is claimed.
		expect( console ).toHaveErrored();
	} );

	it.each( [
		[ 'with a screen', 'download', { screen: 'download', error_type: 'RangeError' } ],
		[ 'without a screen', undefined, { error_type: 'RangeError' } ],
	] as const )(
		'records one crash event %s and nothing from the error text',
		( _label, routeName, expected ) => {
			render(
				<ErrorBoundary screen={ routeName }>
					<Exploding />
				</ErrorBoundary>
			);

			expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_dashboard_crash', expected );
			expect( console ).toHaveErrored();
		}
	);

	it( 'still renders the fallback when Tracks throws', () => {
		mockRecordEvent.mockImplementation( () => {
			throw new Error( 'tracks unavailable' );
		} );
		render(
			<ErrorBoundary>
				<Exploding />
			</ErrorBoundary>
		);

		expect( screen.getByText( 'Something went wrong' ) ).toBeInTheDocument();
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
