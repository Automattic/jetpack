// JETPACK-2465 — a finished or failed restore left no trace on the dashboard.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => () => {},
	useParams: () => ( {} ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import { ACTIVITY_LOG_DEFAULT_PER_PAGE } from '../src/dashboard/hooks/use-activity-log';
import { resetListStateForTesting } from '../src/dashboard/screens/overview';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// Testing Library's default `findBy` window is one second, which these stages
// have exceeded on a loaded runner under coverage.
const SETTLE = { timeout: 10000 };

const BACKUP_REWIND_ID = '1786644531.100';
const RESTORE_ROW_ID = 'restore-912682';
// 14:11 UTC; read as local time on the GMT-3 runner it would render three hours late.
const RESTORE_WHEN = '2026-09-03 14:11:00';
const RESTORE_RENDERED_AT = 'Sep 3, 2026, 2:11 PM';
const RESTORE_READ_AS_LOCAL = 'Sep 3, 2026, 5:11 PM';

const NOT_ON_THIS_PAGE =
	"That item isn't on this page of the activity log. It may be on another page, or no longer available.";
const NOT_AMONG_RECENT = "That restore isn't among this site's most recent ones any more.";
const ACTIVITY_FAILED = "We couldn't load your site's activity.";
const FAILURE_REASON = 'Service unavailable';

/**
 * The two rewindable-activity rows the restore has to sort between.
 *
 * @return Raw WPCOM entries, newest first.
 */
function activityRows() {
	return [
		{
			activity_id: 'act-backup',
			gridicon: 'cloud',
			summary: 'Backup complete',
			published: '2026-09-03T13:00:00+00:00',
			rewind_id: BACKUP_REWIND_ID,
			name: 'rewind__backup_complete_full',
		},
		{
			activity_id: 'act-plugin',
			gridicon: 'plugins',
			summary: 'Plugin activated',
			published: '2026-09-03T11:30:00+00:00',
			name: 'plugin__activated',
		},
	];
}

/**
 * Point every route the Overview reads at a fixed set of answers.
 *
 * @param options            - Fixture options.
 * @param options.restores   - What `/jetpack/v4/restores` resolves with.
 * @param options.standalone - Whether the standalone plugin is active, which is what
 *                           opens the review prompt's own read of the collection.
 * @param options.activity   - 'ok' to answer the rewindable feed, 'error' to 5xx it.
 */
function mockEndpoints( {
	restores = [] as unknown,
	standalone = false,
	activity = 'ok' as 'ok' | 'error',
} = {} ) {
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( {
				hasBackupPlan: true,
				hasScan: false,
				local: { isStandalonePluginActive: standalone },
			} );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return activity === 'error'
				? Promise.reject( { code: 'http_500', message: FAILURE_REASON } )
				: Promise.resolve( {
						current: { orderedItems: activityRows() },
						totalItems: 2,
						totalPages: 1,
				  } );
		}
		if ( path === '/jetpack/v4/restores' ) {
			return Promise.resolve( restores );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * A collection row, failed unless overridden.
 *
 * @param overrides - Fields to replace.
 * @return The raw row.
 */
function failedRestore( overrides: Record< string, unknown > = {} ) {
	return {
		restore_id: 912682,
		rewind_id: BACKUP_REWIND_ID,
		when: RESTORE_WHEN,
		status: 'fail',
		...overrides,
	};
}

/**
 * Every path requested so far that matches the given fragment.
 *
 * @param fragment - Part of the path to count.
 * @return The matching paths.
 */
function requestedPaths( fragment: string ): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => ( options as { path?: string } )?.path ?? '' )
		.filter( path => path.includes( fragment ) );
}

/**
 * The list's rows, in the order they are rendered.
 *
 * @return Each row's text.
 */
function renderedRows(): string[] {
	return screen.getAllByRole( 'row' ).map( row => row.textContent ?? '' );
}

beforeEach( () => {
	resetListStateForTesting();

	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'a restore that has already ended', () => {
	beforeEach( () => {
		mockEndpoints( { restores: [ failedRestore() ] } );
	} );

	it( 'is reported in the list, in its place among the activity', async () => {
		render( <OverviewStage /> );
		await expect(
			screen.findByText( "Restore didn't finish", undefined, SETTLE )
		).resolves.toBeVisible();

		expect( renderedRows()[ 0 ] ).toContain( "Restore didn't finish" );
		expect( renderedRows()[ 1 ] ).toContain( 'Backup complete' );
		expect( renderedRows()[ 2 ] ).toContain( 'Plugin activated' );
	} );

	it( "is stamped from WordPress.com's clock, not the browser's", async () => {
		render( <OverviewStage /> );
		await expect(
			screen.findByText( "Restore didn't finish", undefined, SETTLE )
		).resolves.toBeVisible();

		expect( screen.getByText( RESTORE_RENDERED_AT ) ).toBeVisible();
		expect( screen.queryByText( RESTORE_READ_AS_LOCAL ) ).not.toBeInTheDocument();
	} );

	it( 'names the backup it was aiming at', async () => {
		render( <OverviewStage /> );
		await expect(
			screen.findByText( "Restore didn't finish", undefined, SETTLE )
		).resolves.toBeVisible();

		expect( screen.getByText( 'Restore to Aug 13, 2026, 6:08 PM' ) ).toBeVisible();
	} );

	it( 'reads the collection once for the whole screen', async () => {
		render( <OverviewStage /> );
		// Witness: the row is on screen, so the single request below is one
		// that answered rather than one nobody made.
		await expect(
			screen.findByText( "Restore didn't finish", undefined, SETTLE )
		).resolves.toBeVisible();

		expect( requestedPaths( '/jetpack/v4/restores' ) ).toHaveLength( 1 );
	} );

	it( 'still reads it once when the review prompt reads it too', async () => {
		mockEndpoints( { restores: [ failedRestore() ], standalone: true } );
		render( <OverviewStage /> );
		await expect(
			screen.findByText( "Restore didn't finish", undefined, SETTLE )
		).resolves.toBeVisible();

		expect( requestedPaths( '/jetpack/v4/restores' ) ).toHaveLength( 1 );
	} );

	it( 'opens in the detail pane without the backup affordances', async () => {
		mockSearch.mockReturnValue( { selected: RESTORE_ROW_ID } );
		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'heading', { name: "Restore didn't finish" }, SETTLE )
		).resolves.toBeVisible();
		expect( screen.queryByText( NOT_ON_THIS_PAGE ) ).not.toBeInTheDocument();
		expect( screen.queryByText( NOT_AMONG_RECENT ) ).not.toBeInTheDocument();
		// A restore is not a restore point, so neither action belongs on it.
		expect(
			screen.queryByRole( 'button', { name: 'Restore to this point' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Download backup' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'a restore still under way', () => {
	it( 'says so rather than claiming an outcome', async () => {
		mockEndpoints( { restores: [ failedRestore( { status: 'running' } ) ] } );
		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Restore in progress', undefined, SETTLE )
		).resolves.toBeVisible();
		expect( screen.queryByText( "Restore didn't finish" ) ).not.toBeInTheDocument();
	} );
} );

describe( 'a restore dismissed upstream', () => {
	it( 'is reported anyway', async () => {
		mockEndpoints( { restores: [ failedRestore( { dismissed: true } ) ] } );
		render( <OverviewStage /> );

		await expect(
			screen.findByText( "Restore didn't finish", undefined, SETTLE )
		).resolves.toBeVisible();
	} );
} );

describe( 'a collection the route could not read', () => {
	it( 'leaves the activity list as it was', async () => {
		// The route answers an undecodable WPCOM reply with a bare `null`,
		// which WordPress serves as HTTP 200.
		mockEndpoints( { restores: null as unknown as unknown[] } );
		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Backup complete', undefined, SETTLE )
		).resolves.toBeVisible();
		expect( renderedRows() ).toHaveLength( 2 );
	} );
} );

describe( 'an activity feed that failed', () => {
	beforeEach( () => {
		mockEndpoints( { restores: [ failedRestore() ], activity: 'error' } );
	} );

	it( 'still reports the failure, with restores available to fill the list', async () => {
		render( <OverviewStage /> );

		await expect( screen.findByText( ACTIVITY_FAILED, undefined, SETTLE ) ).resolves.toBeVisible();
		expect( screen.getByText( FAILURE_REASON ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeVisible();
	} );

	it( "does not pass the restores off as the site's activity", async () => {
		render( <OverviewStage /> );
		await expect( screen.findByText( ACTIVITY_FAILED, undefined, SETTLE ) ).resolves.toBeVisible();

		expect( screen.queryByText( "Restore didn't finish" ) ).not.toBeInTheDocument();
	} );
} );

describe( 'a selected restore the collection no longer holds', () => {
	it( "says so in its own terms, not the activity log's", async () => {
		mockSearch.mockReturnValue( { selected: 'restore-999' } );
		mockEndpoints( { restores: [ failedRestore() ] } );
		render( <OverviewStage /> );

		await expect( screen.findByText( NOT_AMONG_RECENT, undefined, SETTLE ) ).resolves.toBeVisible();
		expect( screen.queryByText( NOT_ON_THIS_PAGE ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Clear selection' } ) ).toBeVisible();
	} );
} );

describe( 'a refetch that failed with rows still on screen', () => {
	it( 'reports the failure above the list', async () => {
		// React Query keeps the last successful page when a refetch fails, so the
		// list is not empty and its `empty` slot — the other error surface — never
		// renders. `updatedAt` in the past is what makes the mount refetch at all.
		queryClient.setQueryData(
			keys.activityLogPage( 1, ACTIVITY_LOG_DEFAULT_PER_PAGE, 'desc' ),
			{ current: { orderedItems: activityRows() }, totalItems: 2, totalPages: 1 },
			{ updatedAt: Date.now() - 60_000 }
		);
		mockEndpoints( { restores: [ failedRestore() ], activity: 'error' } );
		render( <OverviewStage /> );

		await expect( screen.findByText( ACTIVITY_FAILED, undefined, SETTLE ) ).resolves.toBeVisible();
		// Witness: the stale rows are on screen, so the `empty` slot never rendered.
		expect( renderedRows()[ 0 ] ).toContain( 'Backup complete' );
	} );
} );
