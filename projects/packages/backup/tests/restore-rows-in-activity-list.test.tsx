// JETPACK-2465 — a finished or failed restore left no trace on the dashboard.
// These rows are merged in from `GET /jetpack/v4/restores`, not the WPCOM feed.

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
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// Testing Library's default `findBy` window is one second, which these stages
// have exceeded on a loaded runner under coverage.
const SETTLE = { timeout: 10000 };

const BACKUP_REWIND_ID = '1786644531.100';
const RESTORE_ROW_ID = 'restore-912682';
// 14:11 UTC. The runner's zone is pinned to GMT-3 in `tests/jest.config.js`, so
// a `when` read as local time would render three hours late.
const RESTORE_WHEN = '2026-09-03 14:11:00';
const RESTORE_RENDERED_AT = 'Sep 3, 2026, 2:11 PM';
const RESTORE_READ_AS_LOCAL = 'Sep 3, 2026, 5:11 PM';

const NOT_ON_THIS_PAGE =
	"That item isn't on this page of the activity log. It may be on another page, or no longer available.";

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
 * @param restores - What `/jetpack/v4/restores` resolves with.
 */
function mockEndpoints( restores: unknown[] ) {
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return Promise.resolve( {
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
		mockEndpoints( [ failedRestore() ] );
	} );

	it( 'is reported in the list, in its place among the activity', async () => {
		render( <OverviewStage /> );
		await expect( screen.findByText( 'Restore failed', undefined, SETTLE ) ).resolves.toBeVisible();

		expect( renderedRows()[ 0 ] ).toContain( 'Restore failed' );
		expect( renderedRows()[ 1 ] ).toContain( 'Backup complete' );
		expect( renderedRows()[ 2 ] ).toContain( 'Plugin activated' );
	} );

	it( "is stamped from WordPress.com's clock, not the browser's", async () => {
		render( <OverviewStage /> );
		await expect( screen.findByText( 'Restore failed', undefined, SETTLE ) ).resolves.toBeVisible();

		expect( screen.getByText( RESTORE_RENDERED_AT ) ).toBeVisible();
		expect( screen.queryByText( RESTORE_READ_AS_LOCAL ) ).not.toBeInTheDocument();
	} );

	it( 'names the backup it was aiming at', async () => {
		render( <OverviewStage /> );
		await expect( screen.findByText( 'Restore failed', undefined, SETTLE ) ).resolves.toBeVisible();

		expect( screen.getByText( 'Restore to Aug 13, 2026, 6:08 PM' ) ).toBeVisible();
	} );

	it( 'costs no request the screen was not already making', async () => {
		render( <OverviewStage /> );
		// Witness: the row is on screen, so the single request below is one
		// that answered rather than one nobody made.
		await expect( screen.findByText( 'Restore failed', undefined, SETTLE ) ).resolves.toBeVisible();

		expect( requestedPaths( '/jetpack/v4/restores' ) ).toHaveLength( 1 );
	} );

	it( 'opens in the detail pane without the backup affordances', async () => {
		mockSearch.mockReturnValue( { selected: RESTORE_ROW_ID } );
		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Restore failed' }, SETTLE )
		).resolves.toBeVisible();
		expect( screen.queryByText( NOT_ON_THIS_PAGE ) ).not.toBeInTheDocument();
		// A restore is not a restore point, so neither action belongs on it.
		expect(
			screen.queryByRole( 'button', { name: 'Restore to this point' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Download backup' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'a restore still under way', () => {
	it( 'says so rather than claiming an outcome', async () => {
		mockEndpoints( [ failedRestore( { status: 'running' } ) ] );
		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Restore in progress', undefined, SETTLE )
		).resolves.toBeVisible();
		expect( screen.queryByText( 'Restore failed' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'a restore dismissed upstream', () => {
	it( 'is reported anyway', async () => {
		mockEndpoints( [ failedRestore( { dismissed: true } ) ] );
		render( <OverviewStage /> );

		await expect( screen.findByText( 'Restore failed', undefined, SETTLE ) ).resolves.toBeVisible();
	} );
} );

describe( 'a collection the route could not read', () => {
	it( 'leaves the activity list as it was', async () => {
		// The route answers an undecodable WPCOM reply with a bare `null`,
		// which WordPress serves as HTTP 200.
		mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
			const path = o?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
			}
			if ( path.includes( '/site/rewindable-activity' ) ) {
				return Promise.resolve( {
					current: { orderedItems: activityRows() },
					totalItems: 2,
					totalPages: 1,
				} );
			}
			if ( path === '/jetpack/v4/restores' ) {
				return Promise.resolve( null );
			}
			return Promise.resolve( [] );
		} );
		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Backup complete', undefined, SETTLE )
		).resolves.toBeVisible();
		expect( renderedRows() ).toHaveLength( 2 );
	} );
} );
