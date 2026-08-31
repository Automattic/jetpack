// The Overview's "Next full backup: …" line (JETPACK-2328 / K2).
//
// Four things are pinned here and nothing else asserts any of them: silence when there
// is no schedule, silence when WordPress.com has stopped backing the site up, the date
// and window read in the *site's* timezone, and the msgid's positional placeholders
// surviving a translation that reorders them.
//
// Every date assertion runs against a frozen clock, with the expectation written out
// rather than computed the way the implementation computes it.

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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import NextScheduledBackup from '../src/dashboard/components/next-scheduled-backup';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import { useNextBackupSchedule } from '../src/dashboard/hooks/use-backup-schedule';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SITE = 'example.wordpress.com';

// The route stages render behind several sequential requests and have
// taken well over Testing Library's 1s default on a loaded runner.
const SETTLE = { timeout: 10000 };

// jsdom implements no scrolling, and DataViews calls `scrollIntoView`. Defined rather
// than spied on: `jest.spyOn` needs the property to already exist.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

// Everything Jest's fake timers can replace *except* `Date`. Faking the timer functions
// too would take Testing Library's polling with it — `waitFor` switches implementation
// the moment it sees a mocked `setTimeout` — and the suite would hang on the first
// `findBy*`.
const DO_NOT_FAKE = [
	'cancelAnimationFrame',
	'cancelIdleCallback',
	'clearImmediate',
	'clearInterval',
	'clearTimeout',
	'hrtime',
	'nextTick',
	'performance',
	'queueMicrotask',
	'requestAnimationFrame',
	'requestIdleCallback',
	'setImmediate',
	'setInterval',
	'setTimeout',
];

/**
 * Freeze `Date` at an instant, leaving every timer real.
 *
 * @param iso - The instant, as an ISO 8601 string with an explicit zone.
 */
function freezeClock( iso: string ) {
	jest.useFakeTimers( {
		doNotFake: DO_NOT_FAKE as Parameters< typeof jest.useFakeTimers >[ 0 ][ 'doNotFake' ],
		now: new Date( iso ),
	} );
}

/**
 * A fresh client with retries off.
 *
 * Built separately from the render below so a test can hold on to one — see
 * `readsSettled`.
 *
 * @return The client.
 */
function newQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
}

/**
 * Render inside an isolated QueryClient.
 *
 * @param ui     - The tree to render.
 * @param client - The client to render under. Defaults to a fresh one.
 * @return The testing-library render result.
 */
function renderWithClient( ui: ReactNode, client: QueryClient = newQueryClient() ) {
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

/**
 * Wait until both reads behind the line have actually landed.
 *
 * Every "says nothing" assertion below synchronizes on the *queries*, not on what the
 * component renders: a component that stopped rendering a placeholder would satisfy a
 * wait on the placeholder immediately, and the absence would never have had a chance to
 * become a presence.
 *
 * @param client - The client the tree was rendered with.
 */
/**
 * A second, deliberately unconditional reader of the schedule.
 *
 * Every stage-level absence assertion needs to know the schedule was there to be shown
 * and the Overview declined to show it. Waiting on the schedule query itself cannot do
 * that — when the line is correctly hidden nothing mounts the hook and no query is
 * issued — so this mounts the hook regardless and says what the line would have said.
 *
 * @return The date the line would have carried, or nothing.
 */
function ScheduleProbe() {
	const schedule = useNextBackupSchedule();

	if ( ! schedule.hasSchedule ) {
		return null;
	}

	return <span data-testid="schedule-probe">{ schedule.nextBackupDate }</span>;
}

/**
 * Render the Overview with that probe beside it.
 *
 * The probe needs its own provider, since `<OverviewStage>` mounts one internally. Both
 * point at the module-scope client, so they share a cache and issue one request.
 */
function renderStageWithProbe() {
	render(
		<>
			<OverviewStage />
			<QueryClientProvider client={ queryClient }>
				<ScheduleProbe />
			</QueryClientProvider>
		</>
	);
}

/**
 * Wait until the schedule is known to be renderable.
 *
 * @return The probe element, once it has something to show.
 */
function scheduleIsAvailable(): Promise< HTMLElement > {
	return screen.findByTestId( 'schedule-probe', undefined, SETTLE );
}

/**
 * Wait until both reads behind the line have actually landed.
 *
 * Synchronizes on the *queries*, not on what the component renders: a component that
 * stopped rendering a placeholder would satisfy a wait on the placeholder immediately.
 *
 * @param client - The client the tree was rendered with.
 */
async function readsSettled( client: QueryClient ) {
	await waitFor( () => {
		expect( client.getQueryState( keys.backupSchedule() )?.status ).toBe( 'success' );
		expect( client.getQueryState( keys.siteSize() )?.status ).toBe( 'success' );
	} );
}

/**
 * One rewindable-activity entry, in WordPress.com's shape.
 *
 * @return A raw activity entry describing a completed backup.
 */
function backupActivityEntry() {
	return {
		activity_id: 'act-cloud',
		gridicon: 'cloud',
		summary: 'Backup complete',
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: '1786644531.123',
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '46 plugins, 23 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/** A backup currently running. */
const RUNNING_BACKUP = {
	id: '2',
	started: '2026-08-14 09:00:00',
	last_updated: '2026-08-14 09:04:00',
	status: 'started',
	period: '1786730931',
	percent: '42',
	is_backup: '1',
	is_scan: '0',
	discarded: '0',
	stats: {},
};

/** An attempt that failed and that WordPress.com will retry on its own. */
const WILL_RETRY_BACKUP = {
	id: '3',
	started: '2026-08-14 09:00:00',
	last_updated: '2026-08-14 09:04:00',
	status: 'error-will-retry',
	period: '1786730931',
	percent: '0',
	is_backup: '1',
	is_scan: '0',
	discarded: '0',
	stats: {},
};

/** A finished, usable restore point. */
const USABLE_BACKUP = {
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

/**
 * Answer every route the line — and, for the wiring tests, the whole
 * Overview — reads.
 *
 * Defaults to a site backed up at 10:00 UTC with storage to spare.
 *
 * @param options               - Overrides.
 * @param options.schedule      - What `/site/backup/schedule` resolves with.
 * @param options.size          - Extra fields for `/site/backup/size`.
 * @param options.backups       - What `/jetpack/v4/backups` resolves with. `null` is the
 *                              shape a non-200 takes: the legacy route serves an
 *                              undecodable body as a bare `null` with HTTP 200.
 * @param options.activity      - Rewindable-activity entries.
 * @param options.activityFails - Make `/site/rewindable-activity` reject.
 */
function mockEndpoints( {
	schedule = { ok: true, scheduled_hour: 10, scheduled_by: null } as unknown,
	size = {} as Record< string, unknown >,
	backups = [ USABLE_BACKUP ] as unknown[] | null,
	activity = [ backupActivityEntry() ] as unknown[],
	activityFails = false,
} = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/backup/schedule' ) ) {
			return Promise.resolve( schedule );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false, ...size } );
		}
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return activityFails
				? Promise.reject( new Error( 'Could not fetch the activity log.' ) )
				: Promise.resolve( {
						current: { orderedItems: activity },
						totalItems: activity.length,
						totalPages: 1,
				  } );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( backups );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * The line, once it has arrived.
 *
 * @return The element carrying it.
 */
function scheduleLine(): Promise< HTMLElement > {
	return screen.findByText( /^Next full backup/ );
}

/**
 * The "Modify" link that follows the sentence, once it has arrived.
 *
 * Matched on a name fragment: `Link` appends "(opens in a new tab)".
 *
 * @return The anchor.
 */
function modifyLink(): Promise< HTMLElement > {
	return screen.findByRole( 'link', { name: /Modify/ } );
}

/**
 * The row holding the sentence and the link.
 *
 * No role and no accessible name, so its class is the only handle — the same
 * escape hatch the storage suites use.
 *
 * @return The row, or null before it has rendered.
 */
function scheduleRow(): HTMLElement | null {
	return document.querySelector( '.jpb-next-scheduled-backup' );
}

/**
 * The Overview's two-pane grid.
 *
 * A layout container with no role and no accessible name, so its class is
 * the only handle — the same escape hatch the storage suites use.
 *
 * @return The grid, or null when the Overview body is not rendered.
 */
function overviewGrid(): HTMLElement | null {
	return document.querySelector( '.jpb-overview' );
}

/**
 * Where the schedule line sits relative to that grid.
 *
 * The direct node access lives here rather than in the test body: neither "is a sibling
 * of" nor "comes before" has a Testing Library query.
 *
 * @param row - The rendered schedule row.
 * @return Whether it is a sibling of the grid, and whether it precedes it.
 */
function placementRelativeToGrid( row: HTMLElement ) {
	/* eslint-disable testing-library/no-node-access -- the question *is* about node relationships; see above. */
	const grid = overviewGrid();
	const gridParent = grid?.parentElement ?? null;

	return {
		isSibling: gridParent !== null && row.parentElement === gridParent,
		comesFirst: Boolean(
			grid &&
				// eslint-disable-next-line no-bitwise -- compareDocumentPosition returns a bitmask.
				row.compareDocumentPosition( grid ) & Node.DOCUMENT_POSITION_FOLLOWING
		),
	};
	/* eslint-enable testing-library/no-node-access */
}

/**
 * The skeleton that holds the line's space while the reads are in flight. No role and
 * no accessible name, so the class is the only handle.
 *
 * @return The placeholder, or null before it has rendered.
 */
function placeholder(): HTMLElement | null {
	return document.querySelector( '.jpb-next-scheduled-backup__placeholder' );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockEndpoints();
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
		siteSuffix: SITE,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'the next-backup line', () => {
	it( "reports today's window while it is still ahead", async () => {
		// 05:00 UTC, on a site backed up at 10:00 UTC. The site's zone is UTC here;
		// it is varied further down.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 22, 10:00-10:59 AM\.$/
		);
	} );

	it( "moves to tomorrow once today's window has closed", async () => {
		// One second after 10:59:59, which is the last instant the window
		// covers.
		freezeClock( '2026-10-22T11:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 23, 10:00-10:59 AM\.$/
		);
	} );

	it( 'still reports today while the window is open', async () => {
		// Inside the window, so it must not roll forward. Half a minute past 10:59 is
		// what separates a window ending at 10:59:59 from one ending at 10:59:00.
		freezeClock( '2026-10-22T10:59:30Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 22, 10:00-10:59 AM\.$/
		);
	} );

	it( 'reads midnight UTC as an hour like any other', async () => {
		// `scheduled_hour: 0` is a real answer and the one a truthiness check drops. It
		// is also the only hour where the 12- and 24-hour clocks disagree.
		freezeClock( '2026-10-21T23:30:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 0 } } );

		renderWithClient( <NextScheduledBackup /> );

		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 22, 12:00-12:59 AM\.$/
		);
	} );
} );

describe( 'the site timezone', () => {
	const original = getSettings();

	afterEach( () => {
		setSettings( original );
	} );

	it( 'states the date and window where the site is, not where the reader is', async () => {
		// A numeric offset, not an IANA string: `@wordpress/date` bundles
		// moment-timezone without zone data, so a named zone resolves to nothing.
		setSettings( {
			...original,
			timezone: { offset: -5, offsetFormatted: '-5', string: '', abbr: 'EST' },
		} );
		// The site is told about a backup running on its *previous* calendar day. Read
		// as UTC this would say "Oct 22, 2:00-2:59 AM" instead.
		freezeClock( '2026-10-22T01:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 2 } } );

		renderWithClient( <NextScheduledBackup /> );

		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 21, 9:00-9:59 PM\.$/
		);
	} );
} );

describe( 'when there is nothing to report', () => {
	it( 'says nothing when the site has no schedule', async () => {
		// What WordPress.com answers for a site it is not scheduling. There is no
		// "unknown" copy, so a guard that let this through would promise Jan 1.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: null } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the route could not read WordPress.com', async () => {
		// An undecodable reply is a bare `null` body served as HTTP 200, so React Query
		// records a success and the shape of the data is the only evidence.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: null } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the payload does not set ok', async () => {
		// `ok` is WordPress.com's own success flag inside a 200 body, so a payload
		// without it carries no usable hour. The fixture keeps a plausible one, so this
		// cannot pass merely because the payload was empty.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { scheduled_hour: 10 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when ok is false', async () => {
		// The reading `useSiteSize()` already takes of this same envelope, and the one
		// `summarize_schedule()` publishes from the backup ability.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: false, scheduled_hour: 10 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the hour is not a whole number', async () => {
		// `Date.UTC` truncates rather than rejecting, so without `Number.isInteger`
		// this renders a confident "10:00-10:59 AM" for an unreadable payload.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10.5 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the hour is negative', async () => {
		// The other end, failing the same silent way: `Date.UTC( …, -1, … )` is 23:00
		// on the previous day.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: -1 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the hour is out of range', async () => {
		// `Date.UTC( …, 24, … )` is the following midnight, not an error.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 24 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing once WordPress.com has stopped backing the site up', async () => {
		// The half of legacy's gate this port keeps. The schedule is still readable, so
		// only `backups_stopped` separates this from the first test — and promising a
		// backup here would contradict "Back up now", which reads the same flag.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( {
			schedule: { ok: true, scheduled_hour: 10 },
			size: { backups_stopped: true },
		} );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );
} );

describe( 'when the site cannot reach WordPress.com', () => {
	it( 'does not issue the request at all', async () => {
		// `enabled: useCanQueryWpcom()` on the query. A registered site with no
		// connected owner cannot answer this route, and a disabled query is also what
		// keeps `isLoading` false — so dropping it leaves the placeholder up forever.
		freezeClock( '2026-10-22T05:00:00Z' );
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: { isRegistered: true, hasConnectedOwner: false, isUserConnected: false },
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		renderWithClient( <NextScheduledBackup /> );

		// Nothing rendered, and — the part that matters — nothing asked.
		await waitFor( () => expect( placeholder() ).toBeNull() );
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '/site/backup/schedule' ) } )
		);
	} );
} );

describe( 'while the reads are in flight', () => {
	it( "holds the line's height so the storage section is not pushed down", async () => {
		// Only `/site/backup/size` is left pending. Holding both open would be
		// satisfied by `schedule.isLoading` alone, leaving the second half of the
		// guard deletable with every test still green.
		freezeClock( '2026-10-22T05:00:00Z' );
		let releaseSize: ( v: unknown ) => void = () => {};
		const pendingSize = new Promise( resolve => {
			releaseSize = resolve;
		} );
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/backup/schedule' ) ) {
				return Promise.resolve( { ok: true, scheduled_hour: 10 } );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return pendingSize;
			}
			return Promise.resolve( {} );
		} );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		// The schedule has landed and could be rendered…
		await waitFor( () =>
			expect( client.getQueryState( keys.backupSchedule() )?.status ).toBe( 'success' )
		);
		// …and is held back, because `/size` has not yet said whether WordPress.com is
		// running these backups at all.
		expect( placeholder() ).not.toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();

		releaseSize( { ok: true, backups_stopped: false } );
		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 22, 10:00-10:59 AM\.$/
		);
	} );
} );

describe( 'the line, translated', () => {
	// The English source cannot tell you whether the placeholders are positional:
	// `%1s`/`%2s` renders identically until a translation reorders them. This is the
	// only assertion in the suite that fails if the `$` are dropped.
	afterEach( () => {
		resetLocaleData();
	} );

	it( 'keeps the date and the window the right way round when a translation swaps them', async () => {
		setLocaleData(
			{
				'Next full backup: %1$s, %2$s.': [ 'At %2$s on %1$s, the next full backup runs.' ],
				// The broken spelling, on purpose: without it, reverting the msgid
				// fails as an unmatched translation key, which reads as a stale
				// fixture and invites someone to bless the bug back in.
				'Next full backup: %1s, %2s.': [ 'At %2s on %1s, the next full backup runs.' ],
			},
			'jetpack-backup-pkg'
		);
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		// Sequential placeholders would read this as "At Oct 22 on 10:00-10:59 AM".
		await expect( screen.findByText( /^At/ ) ).resolves.toHaveTextContent(
			/^At 10:00-10:59 AM on Oct 22, the next full backup runs\.$/
		);
	} );
} );

describe( 'the Modify link', () => {
	// JETPACK-2329. The one Calypso destination this dashboard is allowed to send
	// anyone to, because `cloud.jetpack.com/settings` is the only place a backup's
	// time can be changed and there is no schedule-editing UI here. Dropping it
	// would take a capability legacy readers have away from them.
	it( 'points at the schedule settings, scoped to this site and opened away from here', async () => {
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		const link = await modifyLink();
		expect( link ).toHaveAttribute(
			'href',
			`https://jetpack.com/redirect/?source=backup-plugin-schedule-time-setting&site=${ SITE }`
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'omits the site entirely when the connection global carries no slug', async () => {
		// Not cosmetic: `getRedirectUrl` walks its args with `for…in`, so passing
		// the key as undefined encodes the literal string `undefined` *and*
		// suppresses the helper's own site fallback.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			siteSuffix: undefined,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		renderWithClient( <NextScheduledBackup /> );

		await expect( modifyLink() ).resolves.toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=backup-plugin-schedule-time-setting'
		);
	} );

	it( 'goes with the line when there is no schedule to modify', async () => {
		// The link lives inside the same return as the sentence, so it can only
		// survive a change that pulls it out of there. The sentence arriving under
		// a probe elsewhere in this file is the witness that the data was readable.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: null } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'on the Overview', () => {
	it( 'renders above the activity list', async () => {
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		render( <OverviewStage /> );

		const line = await screen.findByText( /^Next full backup/, undefined, SETTLE );
		expect( line ).toHaveTextContent( /^Next full backup: Oct 22, 10:00-10:59 AM\.$/ );

		// Placement, not just presence: `.jpb-overview` is a two-column grid above
		// 960px, so a child would be auto-placed into a cell and a following sibling
		// would sit below the fold. Asserting the text alone let both through.
		const row = scheduleRow();
		expect( overviewGrid() ).not.toBeNull();
		expect( row ).not.toBeNull();
		// A block box, or the 16px separating this from the storage section below
		// computes and then does nothing — vertical margins do not apply to the
		// inline box `Text` renders by default.
		expect( row?.tagName ).toBe( 'DIV' );
		expect( placementRelativeToGrid( row as HTMLElement ) ).toEqual( {
			isSibling: true,
			comesFirst: true,
		} );
	} );

	it( 'still reports the schedule while a backup is running', async () => {
		// The state this port keeps that legacy does not: legacy's `IN_PROGRESS`
		// replaces `COMPLETE`, so its line vanishes for the length of every run.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( {
			schedule: { ok: true, scheduled_hour: 10 },
			backups: [ RUNNING_BACKUP, USABLE_BACKUP ],
		} );

		render( <OverviewStage /> );

		// The running backup is reported…
		await expect(
			screen.findByText( 'Your backup will be ready soon', undefined, SETTLE )
		).resolves.toBeInTheDocument();
		// …and so is the next one.
		await expect(
			screen.findByText( /^Next full backup/, undefined, SETTLE )
		).resolves.toHaveTextContent( /^Next full backup: Oct 22, 10:00-10:59 AM\.$/ );
	} );

	it( 'says nothing when the backup state could not be read', async () => {
		// An undecodable reply is a bare `null` body served as HTTP 200, so only the
		// derived state says otherwise — and `replacesOverview()` has no `'error'`
		// branch, so without the state gate the page renders "we couldn't check"
		// directly above a confident next-run time.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 }, backups: null } );

		renderStageWithProbe();

		// Synchronized on the failure being reported *and* the schedule being
		// available, neither of which the mutation under test removes.
		await expect(
			screen.findByText( "We couldn't check your site's backup status.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		await expect( scheduleIsAvailable() ).resolves.toHaveTextContent( 'Oct 22' );
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the last attempt failed and the activity log did too', async () => {
		// The second way the takeover stands down: not "the site has restore points"
		// but "the activity request failed, so we cannot know". The veto is
		// `restorePointsLoading || restorePointsError || hasRestorePoints`, so a failed
		// read keeps the first-run panel away and the line rendered under a banner
		// saying the last backup did not complete.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( {
			schedule: { ok: true, scheduled_hour: 10 },
			backups: [ WILL_RETRY_BACKUP ],
			activityFails: true,
		} );

		renderStageWithProbe();

		await expect(
			screen.findByText(
				"Your latest backup didn't complete. We'll try again shortly.",
				undefined,
				SETTLE
			)
		).resolves.toBeInTheDocument();
		await expect( scheduleIsAvailable() ).resolves.toHaveTextContent( 'Oct 22' );
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'stays away while the first-run panel has the body', async () => {
		// Why this port does not re-impose `BACKUP_STATE.COMPLETE` on the line itself:
		// `replacesOverview` has already taken the body over for every state that gate
		// excluded. Half a test on its own — the one above is the other half.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 }, backups: [], activity: [] } );

		renderStageWithProbe();

		await expect(
			screen.findByText( 'Your first cloud backup will be ready soon', undefined, SETTLE )
		).resolves.toBeInTheDocument();
		await expect( scheduleIsAvailable() ).resolves.toHaveTextContent( 'Oct 22' );
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );
} );
