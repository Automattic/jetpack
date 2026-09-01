// A finished backup must put its row in the activity list without a
// reload, and must cost exactly one request to do it.
//
// The Overview screen mounts `useBackups` twice — once in its own body
// and once inside `BackupNowButton` — so every observer of the derived
// state is a candidate place to fire the refresh from. Firing per
// observer does not coalesce: `invalidateQueries` forwards to
// `refetchQueries`, which defaults `cancelRefetch: true`, so the second
// call cancels the first's in-flight refetch and issues its own. The
// cancelled request carries no `signal`, so it is not aborted on the
// wire either — it completes and its response is thrown away. That is
// two WPCOM round trips through the Jetpack proxy per finished backup
// per open tab, for one list.

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
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';
import { BACKUPS_POLL_INTERVAL_MS } from '../src/dashboard/hooks/use-backups';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const SETTLE = { timeout: 10000 };

const OLD_REWIND = '1786644531.100';
const NEW_REWIND = '1786644532.200';

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

/**
 * One rewindable-activity entry, in WPCOM's shape.
 *
 * @param rewindId - The backup's rewind id.
 * @param title    - The row's summary/title.
 * @return A raw activity entry.
 */
function backupEntry( rewindId: string, title: string ) {
	return {
		activity_id: `act-${ rewindId }`,
		gridicon: 'cloud',
		summary: title,
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: rewindId,
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '10 plugins, 4 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/** One `/jetpack/v4/backups` row, in WPCOM's string-typed wire shape. */
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

const FINISHED_BACKUP = {
	...RUNNING_BACKUP,
	status: 'finished',
	percent: '100',
	last_updated: '2026-08-14 17:36:10',
	stats: { plugins: {} },
};

/** Rows the next `/jetpack/v4/backups` call answers with. */
let backupRows: unknown[] = [];
/** Activity rows the next `/site/rewindable-activity` call answers with. */
let activityRows: ReturnType< typeof backupEntry >[] = [];
/** How many times each upstream has been asked. */
let calls = { activity: 0, backups: 0 };

beforeEach( () => {
	jest.useFakeTimers();
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	calls = { activity: 0, backups: 0 };
	backupRows = [ RUNNING_BACKUP ];
	activityRows = [ backupEntry( OLD_REWIND, 'Older backup complete' ) ];

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			calls.activity++;
			return Promise.resolve( {
				current: { orderedItems: [ ...activityRows ] },
				totalItems: activityRows.length,
				totalPages: 1,
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path === '/jetpack/v4/backups' ) {
			calls.backups++;
			return Promise.resolve( [ ...backupRows ] );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.resolve( { contents: {} } );
		}
		return Promise.resolve( {} );
	} );

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

afterEach( () => {
	jest.useRealTimers();
} );

/**
 * Run one poll tick and let everything it triggers settle, so a count
 * read afterwards is a final value rather than a value mid-flight.
 */
async function pollAndSettle(): Promise< void > {
	await act( async () => {
		await jest.advanceTimersByTimeAsync( BACKUPS_POLL_INTERVAL_MS );
	} );
	await act( async () => {
		await jest.advanceTimersByTimeAsync( 0 );
	} );
}

/**
 * The activity list pane. Scoped queries matter here: the newest
 * backup's title is also the detail pane's heading, so an unscoped
 * text match finds two nodes.
 *
 * @return The list container.
 */
function activityList(): HTMLElement {
	return document.querySelector( '.jpb-activity-list' ) as HTMLElement;
}

describe( 'A backup finishing while the Overview is open', () => {
	it( 'adds its row to the activity list, in exactly one request', async () => {
		render( <OverviewStage /> );

		// The running backup is reported alongside the list, not in place
		// of it, because the site already has a restore point.
		await expect(
			screen.findByRole( 'heading', { name: 'Older backup complete' }, SETTLE )
		).resolves.toBeInTheDocument();
		// Settle the opening burst of requests before counting, so the
		// baseline is a resting value rather than one mid-flight.
		await pollAndSettle();
		const activityCallsWhileRunning = calls.activity;
		expect(
			within( activityList() ).queryByText( 'Newest backup complete' )
		).not.toBeInTheDocument();

		// WPCOM finishes the backup and indexes its activity row.
		backupRows = [ FINISHED_BACKUP ];
		activityRows = [
			backupEntry( NEW_REWIND, 'Newest backup complete' ),
			backupEntry( OLD_REWIND, 'Older backup complete' ),
		];
		await pollAndSettle();

		await waitFor(
			() =>
				expect(
					within( activityList() ).getByText( 'Newest backup complete' )
				).toBeInTheDocument(),
			SETTLE
		);

		// Let a second refetch happen if one was going to, so the count
		// below is settled rather than merely early.
		await pollAndSettle();
		expect( calls.activity ).toBe( activityCallsWhileRunning + 1 );
	} );
} );
