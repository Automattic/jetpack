// A `?selected=` the pane cannot resolve rendered "Item not found." and nothing
// else. The id lives in the URL, so a reload returned the reader to the same
// dead end — the empty state had to offer a way out of it.
//
// That message also answered for a log in flight and a log that failed, which get
// their own states here. It could never answer "the row is gone": only loaded
// pages are searched, so the way out has to stay recoverable.

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
	useParams: () => ( {} ),
	// `search` is folded into the href rather than spread onto the node: React
	// warns about an object-valued attribute on an `<a>`, and
	// `@wordpress/jest-console` turns that warning into a suite failure.
	Link: ( {
		children,
		to,
		search,
		...rest
	}: {
		children: React.ReactNode;
		to: string;
		search?: Record< string, string >;
	} ) => (
		<a href={ search ? `${ to }?${ new URLSearchParams( search ).toString() }` : to } { ...rest }>
			{ children }
		</a>
	),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// Testing Library's default `findBy` window is one second, which these stages
// have exceeded on a loaded runner under coverage.
const SETTLE = { timeout: 10000 };

const REWIND_ID = '1786644531.100';
const STALE_ID = '1700000000.999';
const PAGE_TWO_ID = '1786558131.200';

const NOT_FOUND =
	"That item isn't on this page of the activity log. It may be on another page, or no longer available.";
// The claim the pane must not make while pages of the log are still unread.
const GONE_CLAIM = 'That item is no longer in the activity log.';
const NO_SELECTION = 'Select an item from the list to see details.';
const CLEAR = /^Clear selection$/;
const GROUP_LABEL = 'Backup activity';
const FAILURE_REASON = 'Service unavailable';
const LOADING = 'Loading item details…';
const LOAD_FAILED = "We couldn't load this item.";

/**
 * One completed backup, in WPCOM's rewindable-activity shape.
 *
 * @return A raw activity entry.
 */
function backupEntry() {
	return {
		activity_id: `act-${ REWIND_ID }`,
		gridicon: 'cloud',
		summary: 'Backup complete',
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: REWIND_ID,
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '10 plugins, 4 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/**
 * A completed backup on the log's second page, which the list never requests.
 *
 * @return A raw activity entry.
 */
function pageTwoEntry() {
	return {
		...backupEntry(),
		activity_id: `act-${ PAGE_TWO_ID }`,
		rewind_id: PAGE_TWO_ID,
		summary: 'Backup complete (page 2)',
	};
}

/**
 * A published post, in the same shape. Carries no `rewind_id`, so a log
 * holding only this has no default backup for the pane to fall back on.
 *
 * @return A raw activity entry.
 */
function postEntry() {
	return {
		activity_id: 'act-post-1',
		gridicon: 'posts',
		summary: 'Post published',
		published: '2026-08-13T18:10:00+00:00',
		actor: { type: 'Person', name: 'Bob Sacramento' },
		content: { text: 'Hello world' },
		name: 'post__published',
	};
}

/**
 * A finished backup for `/jetpack/v4/backups`. Keeps `summarizeBackups` on
 * `complete`, which is the one state that never takes the Overview body over.
 *
 * @return A raw backup entry.
 */
function finishedBackup() {
	return {
		id: '1',
		started: '2026-08-13 18:08:56',
		last_updated: '2026-08-13 18:54:14',
		status: 'finished',
		period: '1786644531',
		percent: '100',
		is_backup: '1',
		is_scan: '0',
		discarded: '0',
		stats: { prefix: 'wp_' },
	};
}

type ActivityRows = ReturnType< typeof backupEntry | typeof postEntry >[];

/** What the activity log does: answer per page, never answer, or fail. */
type ActivityAnswer = ActivityRows | ( ( page: number ) => ActivityRows ) | 'pending' | 'error';

/**
 * Point every route the Overview reads at a fixed set of answers.
 *
 * @param options            - Fixture options.
 * @param options.activity   - Rows the log returns, or how it fails to return any.
 * @param options.backups    - Raw entries `/jetpack/v4/backups` returns.
 * @param options.totalPages - Pages the log reports holding.
 */
function mockEndpoints( {
	activity,
	backups,
	totalPages = 1,
}: {
	activity: ActivityAnswer;
	backups: ReturnType< typeof finishedBackup >[];
	totalPages?: number;
} ) {
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			if ( activity === 'pending' ) {
				return new Promise( () => {} );
			}
			if ( activity === 'error' ) {
				return Promise.reject( { code: 'activity_log_fetch_failed', message: FAILURE_REASON } );
			}
			const requested = Number( /[?&]page=(\d+)/.exec( path )?.[ 1 ] ?? 1 );
			const rows = typeof activity === 'function' ? activity( requested ) : activity;
			return Promise.resolve( {
				current: { orderedItems: rows },
				totalItems: rows.length * totalPages,
				totalPages,
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( backups );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.resolve( { contents: {} } );
		}
		return Promise.resolve( {} );
	} );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockSearch.mockReset();
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'A selection the activity log cannot resolve', () => {
	beforeEach( () => {
		mockEndpoints( { activity: [ backupEntry() ], backups: [] } );
		mockSearch.mockReturnValue( { selected: STALE_ID } );
	} );

	it( 'offers a way out beside the message', async () => {
		render( <OverviewStage /> );

		// The message is the positive: without it the button below could be
		// missing because the pane never reached this branch — or threw.
		await expect( screen.findByText( NOT_FOUND, undefined, SETTLE ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: CLEAR } ) ).toBeInTheDocument();
	} );

	it( 'drops only `selected`, through the router', async () => {
		render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: CLEAR }, SETTLE ) );

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		const options = mockNavigate.mock.calls[ 0 ][ 0 ] as {
			search: ( previous: Record< string, unknown > ) => Record< string, unknown >;
		};
		// `@wordpress/boot` nests the whole router href inside wp-admin's own
		// `?p=`, so the param can only be dropped by the router itself.
		expect( typeof options.search ).toBe( 'function' );
		expect( options.search( { selected: STALE_ID, page: '3' } ) ).toEqual( { page: '3' } );
	} );

	it( 'leaves the dead end once the router applies it', async () => {
		const { rerender } = render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: CLEAR }, SETTLE ) );

		// The updater's own output, not a hand-written `{}` — otherwise this asserts
		// the fallback rather than the recovery, and passes with `selected` kept.
		const applied = mockNavigate.mock.calls[ 0 ][ 0 ] as {
			search: ( previous: Record< string, unknown > ) => Record< string, unknown >;
		};
		mockSearch.mockReturnValue( applied.search( { selected: STALE_ID } ) );
		rerender( <OverviewStage /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Backup complete' }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( NOT_FOUND ) ).not.toBeInTheDocument();
	} );

	it( 'hands focus to the two-pane region, so the next Tab is in the list', async () => {
		render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: CLEAR }, SETTLE ) );

		// The region is the positive: focus cannot be verified as "not lost"
		// without naming where it went.
		const region = screen.getByRole( 'group', { name: GROUP_LABEL } );
		await waitFor( () => expect( region ).toHaveFocus() );

		// The claim the comment on `.jpb-overview` makes: Tab lands on the list's own
		// first control, which is DataViews' cog.
		await userEvent.tab();
		expect( screen.getByRole( 'button', { name: 'View options' } ) ).toHaveFocus();
	} );
} );

// The list's page is React state seeded from `INITIAL_VIEW`, and only `selected`
// is in the URL — so every reload of a selection made off page 1 lands here.
describe( 'A selection on a page nothing has loaded', () => {
	beforeEach( () => {
		mockEndpoints( {
			activity: page => ( page === 2 ? [ pageTwoEntry() ] : [ backupEntry() ] ),
			backups: [],
			totalPages: 2,
		} );
		mockSearch.mockReturnValue( { selected: PAGE_TWO_ID } );
	} );

	it( 'does not report the row as gone', async () => {
		render( <OverviewStage /> );

		// The button is the positive control: it renders in this branch either
		// way, so a missing claim below cannot be a pane that never rendered.
		await expect(
			screen.findByRole( 'button', { name: CLEAR }, SETTLE )
		).resolves.toBeInTheDocument();
		// Page 1 answering says nothing about page 2, which holds this row and
		// which nothing has fetched.
		expect( screen.queryByText( GONE_CLAIM ) ).not.toBeInTheDocument();
		expect( screen.getByText( NOT_FOUND ) ).toBeInTheDocument();
	} );

	// The control for the two above: without it they rest on a fixture nothing
	// checks, and would read the same way if page 2 held no such row.
	it( 'resolves the row once the list reaches the page holding it', async () => {
		render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Next page' }, SETTLE ) );

		await expect(
			screen.findByRole( 'heading', { name: 'Backup complete (page 2)' }, SETTLE )
		).resolves.toBeInTheDocument();
	} );

	it( 'leaves the cleared selection on the back stack', async () => {
		render( <OverviewStage /> );
		await userEvent.click( await screen.findByRole( 'button', { name: CLEAR }, SETTLE ) );

		// The selection may be perfectly good, so Back has to bring it back.
		const options = mockNavigate.mock.calls[ 0 ][ 0 ] as { replace?: boolean };
		expect( options.replace ).not.toBe( true );
	} );
} );

describe( 'Choosing a row', () => {
	it( 'adds `selected` through the router without dropping the rest of the search', async () => {
		mockEndpoints( { activity: [ backupEntry(), postEntry() ], backups: [] } );
		mockSearch.mockReturnValue( { page: '3' } );

		render( <OverviewStage /> );
		await userEvent.click(
			await screen.findByRole( 'button', { name: 'Post published' }, SETTLE )
		);

		const options = mockNavigate.mock.calls[ 0 ][ 0 ] as {
			search: ( previous: Record< string, unknown > ) => Record< string, unknown >;
		};
		// The same updater form `clearSelected` uses: an object literal replaces
		// the search wholesale, so it keeps the rest only while its closure is fresh.
		expect( typeof options.search ).toBe( 'function' );
		expect( options.search( { page: '3' } ) ).toEqual( { page: '3', selected: 'act-post-1' } );
	} );
} );

describe( 'No selection yet', () => {
	it( 'still asks the reader to pick a row, with nothing to clear', async () => {
		mockEndpoints( { activity: [ postEntry() ], backups: [ finishedBackup() ] } );
		mockSearch.mockReturnValue( {} );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( NO_SELECTION, undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: CLEAR } ) ).not.toBeInTheDocument();
	} );
} );

// The pane reads one nullable item, and null is also the answer while the log
// is in flight and after it failed. Neither says anything about the row, so
// neither is a place to offer to drop it.
describe( 'A selection the activity log has not answered for', () => {
	beforeEach( () => {
		// Valid: this id is in the fixture the first suite resolves from, which is
		// also the control for these two — there the button is offered.
		mockSearch.mockReturnValue( { selected: REWIND_ID } );
	} );

	it( 'waits while the log is in flight instead of offering to discard it', async () => {
		mockEndpoints( { activity: 'pending', backups: [] } );

		render( <OverviewStage /> );

		// The placeholder is the positive: "no button" passes for a pane that
		// never rendered at all.
		await expect( screen.findByText( LOADING, undefined, SETTLE ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( NOT_FOUND ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: CLEAR } ) ).not.toBeInTheDocument();
	} );

	it( 'reports a failed log instead of offering to discard it', async () => {
		mockEndpoints( { activity: 'error', backups: [] } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( LOAD_FAILED, undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( NOT_FOUND ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: CLEAR } ) ).not.toBeInTheDocument();
	} );
} );
