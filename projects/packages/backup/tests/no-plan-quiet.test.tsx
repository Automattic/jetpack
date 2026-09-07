// JETPACK-2322: behind the no-plan upsell the Overview, Restore and Download screens
// kept reading — and polling, and on Download writing — WordPress.com for answers
// nothing there could act on. Each negative below is an `apiFetch` call count paired
// with a positive that proves the screen rendered, since "no request was made" is also
// true of a tree that threw first.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: '1786644531.123' } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import { BACKUPS_POLL_INTERVAL_MS } from '../src/dashboard/hooks/use-backups';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const DISCONNECTED = { isRegistered: false, hasConnectedOwner: false, isUserConnected: false };
const SETTLE = { timeout: 10000 };

const NO_PLAN = "This site doesn't have an active Backup plan";
const UPSELL_CTA = /^Get VaultPress Backup$/;
const NOT_CONNECTED = 'Connect Jetpack to get started';
const RESTORING = 'Restoring your site';
const PREPARING = 'Preparing your download';

const CAPABILITIES_PATH = '/jetpack/v4/site/capabilities';
const BACKUPS_PATH = '/jetpack/v4/backups';
const ACTIVITY_PATH = '/jetpack/v4/site/rewindable-activity';
const SITE_SIZE_PATH = '/jetpack/v4/site/backup/size';
const RESTORES_PATH = '/jetpack/v4/restores';

const RESTORE_ID = 912682;
const STATUS_PATH = `/jetpack/v4/rewind/restore/${ RESTORE_ID }/status`;

// Must match the literal in the `@wordpress/route` factory above, which jest
// hoists above every declaration and so cannot reference this.
const REWIND_ID = '1786644531.123';

const DOWNLOAD_ID = 4242;
const DOWNLOAD_PATH = `/jetpack/v4/backups/download/${ REWIND_ID }`;
const DOWNLOAD_STATUS_PATH = `${ DOWNLOAD_PATH }/status`;

// The comma-joined `ls` entry ids the file browser's Download link carries;
// `ZjU6L3dwLWNvbmZpZy5waHA=` decodes to `f5:/wp-config.php`.
const FILE_SELECTION = 'ZjU6L3dwLWNvbmZpZy5waHA=,ZjI6L3JlYWRtZS5odG1s';

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

/**
 * A restore already under way upstream, so `useRestore` adopts it and wants the status
 * poll — without one the polling negative below would hold on a quiet site.
 */
const RUNNING_RESTORE = {
	restore_id: RESTORE_ID,
	rewind_id: REWIND_ID,
	when: '2026-08-20T10:00:00+00:00',
	status: 'running',
};

const RUNNING_STATUS = {
	id: RESTORE_ID,
	status: 'running',
	progress: 47,
	rewind_id: REWIND_ID,
	error_code: '',
	message: '',
};

/**
 * An archive still being built, so `useDownload` wants the poll — without it the
 * polling negative below would hold on a download that had already finished.
 */
const RUNNING_DOWNLOAD = {
	id: DOWNLOAD_ID,
	status: 'running',
	progress: 36,
	url: '',
	valid_until: '',
	error: '',
};

/** Flipped per test; the only difference between the negatives and their control. */
let hasBackupPlan = false;

/** Flipped per test; whether the site has a restore for the Restore screen to adopt. */
let restoreRunning = false;

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
	restoreRunning = false;
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
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
		if ( path === RESTORES_PATH ) {
			return Promise.resolve( restoreRunning ? [ RUNNING_RESTORE ] : [] );
		}
		if ( path === STATUS_PATH ) {
			return Promise.resolve( RUNNING_STATUS );
		}
		if ( path.startsWith( DOWNLOAD_STATUS_PATH ) ) {
			return Promise.resolve( RUNNING_DOWNLOAD );
		}
		if ( path === DOWNLOAD_PATH ) {
			return Promise.resolve( { id: DOWNLOAD_ID } );
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

describe( 'The Restore screen behind the same gates', () => {
	it( 'renders the upsell without asking what restores exist', async () => {
		render( <RestoreStage /> );

		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();
		await pollTicks( 1 );

		// The gate's own read: the positive that says this screen came from a real answer.
		expect( asked( CAPABILITIES_PATH ) ).toBe( 1 );
		expect( asked( RESTORES_PATH ) ).toBe( 0 );
	} );

	it( 'never polls a restore that is already running upstream', async () => {
		restoreRunning = true;

		render( <RestoreStage /> );
		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();

		await pollTicks( 4 );

		// Reported together so a failure names every route still being read,
		// not just the first one.
		expect( { restores: asked( RESTORES_PATH ), status: asked( STATUS_PATH ) } ).toEqual( {
			restores: 0,
			status: 0,
		} );
	} );

	it( 'asks nothing at all on a site that is not connected', async () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: DISCONNECTED,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		render( <RestoreStage /> );

		await expect( screen.findByText( NOT_CONNECTED, {}, SETTLE ) ).resolves.toBeInTheDocument();
		await pollTicks( 1 );

		// `useCapabilities` is disabled without a user connection, so the gate itself
		// asks nothing here and the rendered screen is the only positive available.
		expect( {
			capabilities: asked( CAPABILITIES_PATH ),
			restores: asked( RESTORES_PATH ),
		} ).toEqual( { capabilities: 0, restores: 0 } );
	} );
} );

describe( 'The Restore screen across a gate flip', () => {
	// The reason the reads are gated inside `useRestore` rather than by mounting the
	// screen's body below `<Gates>`: that state is what withholds Confirm while a
	// restore WordPress.com accepted without naming is still unlisted, and a body
	// that unmounts on a flip re-arms it into a second concurrent restore.
	it( 'keeps withholding Confirm when the verdict flips away and back', async () => {
		hasBackupPlan = true;
		mockApiFetch.mockImplementation( ( o: { path?: string; method?: string } ) => {
			const path = o?.path ?? '';
			if ( path.startsWith( CAPABILITIES_PATH ) ) {
				return Promise.resolve( { hasBackupPlan, hasScan: false } );
			}
			if ( o?.method === 'POST' ) {
				return Promise.resolve( { id: null, rewind_id: REWIND_ID } );
			}
			if ( path === RESTORES_PATH ) {
				return Promise.resolve( [] );
			}
			return Promise.resolve( {} );
		} );

		// `advanceTimers`, because this file runs on fake timers.
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <RestoreStage /> );
		await user.click( await screen.findByRole( 'button', { name: /Confirm restore/ }, SETTLE ) );
		await expect(
			screen.findByText( /queued and will begin shortly/, undefined, SETTLE )
		).resolves.toBeInTheDocument();
		const posts = () => mockApiFetch.mock.calls.filter( ( [ o ] ) => o?.method === 'POST' ).length;
		expect( posts() ).toBe( 1 );

		// ready -> no-plan -> ready, the shape a plan lapsing mid-session produces.
		hasBackupPlan = false;
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.capabilities() } );
		} );
		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();

		hasBackupPlan = true;
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.capabilities() } );
		} );
		await expect(
			screen.findByText( /queued and will begin shortly/, undefined, SETTLE )
		).resolves.toBeInTheDocument();

		expect( screen.queryByRole( 'button', { name: /Confirm restore/ } ) ).not.toBeInTheDocument();
		expect( posts() ).toBe( 1 );
	} );
} );

describe( 'The Restore screen once the site has a plan', () => {
	// The control for the three negatives above: the polling negative's own fixtures,
	// timers and tree, with only the entitlement flipped — without it a harness that
	// never fetches would pass.
	it( 'reads the restores collection and polls the restore it adopts', async () => {
		hasBackupPlan = true;
		restoreRunning = true;

		render( <RestoreStage /> );

		await expect(
			screen.findByRole( 'progressbar', { name: RESTORING }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( NO_PLAN ) ).not.toBeInTheDocument();

		const before = asked( STATUS_PATH );
		expect( { restores: asked( RESTORES_PATH ) > 0, status: before > 0 } ).toEqual( {
			restores: true,
			status: true,
		} );

		await pollTicks( 2 );
		expect( asked( STATUS_PATH ) ).toBeGreaterThan( before );
	} );
} );

// Reachable by direct URL alone — a bookmark, or a tab left open when the plan lapsed
// — and the POST asks WordPress.com to build an archive, so this is a write.
describe( 'The Download screen behind the same gates', () => {
	beforeEach( () => {
		mockSearch.mockReturnValue( { files: FILE_SELECTION } );
	} );

	it( 'renders the upsell without asking for the archive the link named', async () => {
		render( <DownloadStage /> );

		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();
		await pollTicks( 4 );

		// The gate's own read: the positive that says this screen came from a real answer.
		expect( asked( CAPABILITIES_PATH ) ).toBe( 1 );
		// Reported together so a failure names the write and the poll, not just the first.
		expect( {
			initiate: asked( DOWNLOAD_PATH ),
			status: asked( DOWNLOAD_STATUS_PATH ),
		} ).toEqual( { initiate: 0, status: 0 } );
	} );

	it( 'asks nothing at all on a site that is not connected', async () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: DISCONNECTED,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		render( <DownloadStage /> );

		await expect( screen.findByText( NOT_CONNECTED, {}, SETTLE ) ).resolves.toBeInTheDocument();
		await pollTicks( 4 );

		// `useCapabilities` is disabled without a user connection, so the gate itself
		// asks nothing here and the rendered screen is the only positive available.
		expect( {
			capabilities: asked( CAPABILITIES_PATH ),
			initiate: asked( DOWNLOAD_PATH ),
			status: asked( DOWNLOAD_STATUS_PATH ),
		} ).toEqual( { capabilities: 0, initiate: 0, status: 0 } );
	} );
} );

describe( 'The Download screen across a gate flip', () => {
	// `hasAutoStarted` is a per-mount ref, so a body remounted below `<Gates>` would
	// reset it and build a second archive. The first count is also the ordering: the
	// verdict is `loading` on first commit, so a build means the effect re-ran.
	it( 'builds one archive when the verdict arrives, and none on a later flip', async () => {
		hasBackupPlan = true;
		mockSearch.mockReturnValue( { files: FILE_SELECTION } );

		render( <DownloadStage /> );
		await expect(
			screen.findByRole( 'progressbar', { name: PREPARING }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( asked( DOWNLOAD_PATH ) ).toBe( 1 );

		// ready -> no-plan -> ready, the shape a plan lapsing mid-session produces.
		hasBackupPlan = false;
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.capabilities() } );
		} );
		await expect( screen.findByText( NO_PLAN, {}, SETTLE ) ).resolves.toBeInTheDocument();

		// The archive is still being built, so only the hook's own gate can stop the
		// poll: nothing about the download itself has changed.
		const parked = asked( DOWNLOAD_STATUS_PATH );
		await pollTicks( 4 );
		expect( asked( DOWNLOAD_STATUS_PATH ) ).toBe( parked );

		hasBackupPlan = true;
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.capabilities() } );
		} );
		await expect(
			screen.findByRole( 'progressbar', { name: PREPARING }, SETTLE )
		).resolves.toBeInTheDocument();

		// The bar alone only proves `downloadId` survived; the count proves the poll
		// restarted rather than staying parked.
		const resumed = asked( DOWNLOAD_STATUS_PATH );
		await pollTicks( 2 );
		expect( asked( DOWNLOAD_STATUS_PATH ) ).toBeGreaterThan( resumed );
		expect( asked( DOWNLOAD_PATH ) ).toBe( 1 );
	} );
} );

describe( 'The Download screen once the site has a plan', () => {
	// The control for the two negatives above: the same link, fixtures, timers and
	// tree, with only the entitlement flipped — without it a harness that never
	// fetches would pass.
	it( 'builds the archive and polls it while it is being prepared', async () => {
		hasBackupPlan = true;
		mockSearch.mockReturnValue( { files: FILE_SELECTION } );

		render( <DownloadStage /> );

		await expect(
			screen.findByRole( 'progressbar', { name: PREPARING }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( NO_PLAN ) ).not.toBeInTheDocument();

		await pollTicks( 1 );
		const before = asked( DOWNLOAD_STATUS_PATH );
		expect( { initiate: asked( DOWNLOAD_PATH ), status: before > 0 } ).toEqual( {
			initiate: 1,
			status: true,
		} );

		await pollTicks( 2 );
		expect( asked( DOWNLOAD_STATUS_PATH ) ).toBeGreaterThan( before );
	} );
} );
