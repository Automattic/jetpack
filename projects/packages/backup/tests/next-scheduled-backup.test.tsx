// The Overview's "Next full backup: …" line (JETPACK-2328 / K2).
//
// Four things are worth pinning here and nothing else asserts any of
// them: that the line is silent when there is no schedule to report,
// that it stays silent when WordPress.com has stopped backing the site
// up, that the date and window are read in the *site's* timezone rather
// than UTC or the reader's, and that the msgid's positional placeholders
// survive a translation that reorders them.
//
// Every date assertion runs against a frozen clock. Computing the
// expectation the way the implementation computes it would pass no
// matter what either of them did.

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

// The route stages render behind several sequential requests and have
// taken well over Testing Library's 1s default on a loaded runner.
const SETTLE = { timeout: 10000 };

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row. Defined rather than spied on:
// `jest.spyOn` requires the property to already exist, and in jsdom it
// does not.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

// Everything Jest's fake timers can replace *except* `Date`.
//
// The clock is the only thing these tests need frozen. Faking the timer
// functions as well would take React Query's retries and Testing
// Library's own polling with it — `waitFor` switches to a
// timer-advancing implementation the moment it sees a mocked
// `setTimeout` — and the suite would hang on the first `findBy*`.
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
 * Built separately from the render below so a test that needs to wait on
 * the queries themselves can hold on to one — see `readsSettled`.
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
 * Every "says nothing" assertion below needs this, and needs it to
 * synchronize on the *queries* rather than on anything the component
 * renders. Waiting for the placeholder to clear would look equivalent
 * and is not: a component that stopped rendering a placeholder at all
 * would satisfy that wait on the very first tick, and each of those
 * tests would then assert an absence that had never had a chance to
 * become a presence.
 *
 * @param client - The client the tree was rendered with.
 */
/**
 * A second, deliberately unconditional reader of the schedule.
 *
 * Every stage-level absence assertion needs to know that the schedule was
 * there to be shown and the Overview declined to show it — otherwise it
 * passes just as well against a broken fixture, or against an assertion
 * that ran too early. Waiting on what the takeover or a banner
 * renders is not that: those come from `/jetpack/v4/backups`, which
 * resolves independently of `/site/backup/schedule`. And waiting on the
 * schedule query itself does not work either, because when the line is
 * correctly hidden nothing mounts the hook and the query is never issued.
 *
 * So this mounts the hook regardless, on the same client, and says what
 * the line would have said. It is a test instrument, not a fixture.
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
 * The probe needs its own provider: `<OverviewStage>` mounts one
 * internally, so a sibling is outside it. Both point at the module-scope
 * client, so the two share a cache and issue one request between them.
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
 * Every component-level "says nothing" assertion needs this, and needs it
 * to synchronize on the *queries* rather than on anything the component
 * renders. Waiting for the placeholder to clear would look equivalent and
 * is not: a component that stopped rendering a placeholder would satisfy
 * that wait on the very first tick, and each of those tests would then
 * assert an absence that had never had a chance to become a presence.
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
 *                              shape a non-200 from WordPress.com actually takes: the
 *                              legacy route answers a body it cannot decode with a bare
 *                              `null`, which WordPress serves as HTTP 200.
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
 * All the direct node access lives here rather than in the test body,
 * which is both what `testing-library/no-node-access` wants and the only
 * way to ask this question at all — neither "is a sibling of" nor "comes
 * before" has a Testing Library query.
 *
 * @param line - The rendered schedule line.
 * @return Whether it is a sibling of the grid, and whether it precedes it.
 */
function placementRelativeToGrid( line: HTMLElement ) {
	/* eslint-disable testing-library/no-node-access -- the question *is* about node relationships; see above. */
	const grid = overviewGrid();
	const gridParent = grid?.parentElement ?? null;

	return {
		isSibling: gridParent !== null && line.parentElement === gridParent,
		comesFirst: Boolean(
			grid &&
				// eslint-disable-next-line no-bitwise -- compareDocumentPosition returns a bitmask.
				line.compareDocumentPosition( grid ) & Node.DOCUMENT_POSITION_FOLLOWING
		),
	};
	/* eslint-enable testing-library/no-node-access */
}

/**
 * The skeleton that holds the line's space while the reads are in
 * flight. A placeholder carries no role and no accessible name, so its
 * class is the only handle — the same escape hatch the storage suites
 * use.
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
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'the next-backup line', () => {
	it( "reports today's window while it is still ahead", async () => {
		// 05:00 UTC, on a site backed up at 10:00 UTC. The site's own
		// timezone is `@wordpress/date`'s default here, which is UTC — the
		// zone is varied deliberately further down.
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
		// 10:59:30 is inside the window and must not roll forward: a reader
		// looking at the page during the run wants the run that is
		// happening, not the one tomorrow. Half a minute past 10:59 is the
		// case that separates "the window ends at 10:59:59" from "the
		// window ends at 10:59:00".
		freezeClock( '2026-10-22T10:59:30Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 22, 10:00-10:59 AM\.$/
		);
	} );

	it( 'reads midnight UTC as an hour like any other', async () => {
		// `scheduled_hour: 0` is a real answer and the one a truthiness
		// check would drop. Distinct from every other fixture here: the
		// window opens at midnight and reads back as 12:00 AM, which is
		// also the only case where the 12-hour clock and the 24-hour hour
		// disagree.
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
		// A five-hour western offset, spelled as a number with no IANA
		// string: `@wordpress/date` bundles moment-timezone without its
		// zone data, so a named zone here would resolve to nothing and the
		// assertion would silently be about UTC again.
		setSettings( {
			...original,
			timezone: { offset: -5, offsetFormatted: '-5', string: '', abbr: 'EST' },
		} );
		// 02:00 UTC on the 22nd is 21:00 on the 21st for this site, and the
		// backup window opens at 02:00 UTC — so the site is told about a
		// backup that runs on its *previous* calendar day. Read as UTC this
		// would say "Oct 22, 2:00-2:59 AM"; read in the browser's zone it
		// would say whatever the runner happens to be set to.
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
		// What WordPress.com answers for a site it is not scheduling.
		// Silence is the whole behaviour: there is no "unknown" copy to
		// fall back to, so a guard that let this through would render
		// "Next full backup: Jan 1, 12:00-12:59 AM." — a date nobody
		// promised.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: null } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the route could not read WordPress.com', async () => {
		// A reply the route cannot decode collapses to a bare `null` body
		// served as HTTP 200, so the request resolves and React Query
		// records a success. The shape of the data is the only evidence.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: null } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the hour is not a whole number', async () => {
		// `Date.UTC` truncates rather than rejecting — hour 10.5 is
		// 10:00:00Z — so without `Number.isInteger` this renders a
		// confident "10:00-10:59 AM" for a payload we could not actually
		// read. Verified: `new Date( Date.UTC( 2026, 9, 22, 10.5, 0, 0, 0 ) )`
		// is `2026-10-22T10:00:00.000Z`.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10.5 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the hour is negative', async () => {
		// The other end of the range, and it fails the same silent way:
		// `Date.UTC( …, -1, … )` is 23:00 on the *previous* day, so this
		// would report a backup at 11:00 PM that nobody scheduled.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: -1 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the hour is out of range', async () => {
		// `Date.UTC( …, 24, … )` is not an error, it is the following
		// midnight — so without the range check this would report a backup
		// at 12:00 AM on the 23rd, which is a time nobody scheduled.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 24 } } );

		const client = newQueryClient();
		renderWithClient( <NextScheduledBackup />, client );

		await readsSettled( client );
		expect( placeholder() ).toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing once WordPress.com has stopped backing the site up', async () => {
		// The half of legacy's gate this port keeps. The schedule is still
		// there and still readable — WordPress.com just is not acting on
		// it — so the request below succeeds and only `backups_stopped`
		// separates this from the first test in the file. Promising a
		// 10:00 backup here would also contradict the "Back up now" button,
		// which reads the same flag and disables itself on it.
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
		// `enabled: useCanQueryWpcom()` on the query. A site that is
		// registered but has no connected owner cannot answer this route,
		// and asking anyway spends a round trip to be told so. `<Gates>`
		// keeps most readers away from here, but nothing else pins the
		// line itself, and a disabled query is also what keeps
		// `isLoading` false — so dropping it would leave the placeholder
		// up forever rather than merely wasting a request.
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
		// Only `/site/backup/size` is left pending, and that is the whole
		// point of the test. Holding *both* requests open would be
		// satisfied by `schedule.isLoading` alone, so the second half of
		// the guard could be deleted with every test still green — which
		// is exactly what happened before this was narrowed.
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
		// …and is deliberately still held back, because `/size` has not yet
		// said whether WordPress.com is even running these backups. Showing
		// the line now means retracting it a moment later on a site that is
		// out of storage.
		expect( placeholder() ).not.toBeNull();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();

		releaseSize( { ok: true, backups_stopped: false } );
		await expect( scheduleLine() ).resolves.toHaveTextContent(
			/^Next full backup: Oct 22, 10:00-10:59 AM\.$/
		);
	} );
} );

describe( 'the line, translated', () => {
	// The English source cannot tell you whether the msgid's placeholders
	// are positional: nothing moves, so `%1s`/`%2s` — which
	// `@tannin/sprintf` reads as min-widths, discards, and then fills in
	// the order they appear — renders exactly like `%1$s`/`%2$s`. The two
	// only part company under a translation that reorders them, which is
	// natural phrasing in plenty of languages. This is the only assertion
	// in the suite that fails if the `$` are ever dropped.
	afterEach( () => {
		resetLocaleData();
	} );

	it( 'keeps the date and the window the right way round when a translation swaps them', async () => {
		setLocaleData(
			{
				'Next full backup: %1$s, %2$s.': [ 'At %2$s on %1$s, the next full backup runs.' ],
				// The broken spelling, carried here on purpose. Without it,
				// reverting the msgid fails this test with "unable to find
				// /^At/" — a translation that no longer matches any key —
				// which reads as a stale fixture and invites someone to
				// update the key and bless the bug back in. With it, the
				// failure is the transposition itself, which is the thing
				// worth seeing.
				'Next full backup: %1s, %2s.': [ 'At %2s on %1s, the next full backup runs.' ],
			},
			'jetpack-backup-pkg'
		);
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		renderWithClient( <NextScheduledBackup /> );

		// Sequential placeholders would read this as "At Oct 22 on
		// 10:00-10:59 AM" — the date announced as the time and the time as
		// the date.
		await expect( screen.findByText( /^At/ ) ).resolves.toHaveTextContent(
			/^At 10:00-10:59 AM on Oct 22, the next full backup runs\.$/
		);
	} );
} );

describe( 'on the Overview', () => {
	it( 'renders above the activity list', async () => {
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 } } );

		render( <OverviewStage /> );

		const line = await screen.findByText( /^Next full backup/, undefined, SETTLE );
		expect( line ).toHaveTextContent( /^Next full backup: Oct 22, 10:00-10:59 AM\.$/ );

		// Placement, not just presence. `.jpb-overview` is a two-column
		// grid above 960px, so this element has to be its *sibling* and
		// has to come before it — as a child it would be auto-placed into
		// a grid cell, and after it the schedule would sit below the fold
		// under a full-height activity list. Asserting the text alone let
		// both of those through: moving the mount below the grid changed
		// nothing any test could see.
		expect( overviewGrid() ).not.toBeNull();
		expect( placementRelativeToGrid( line ) ).toEqual( { isSibling: true, comesFirst: true } );
	} );

	it( 'still reports the schedule while a backup is running', async () => {
		// The one state this port deliberately keeps that legacy does not.
		// Legacy's `IN_PROGRESS` replaces `COMPLETE`, so its line vanishes
		// for the length of every run; here the two facts are reported
		// side by side, which is the same decision `summarizeBackups` made
		// when it stopped letting a running backup erase a finished one.
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
		// `/jetpack/v4/backups` answers a WordPress.com reply it cannot
		// decode with a bare `null` body served as HTTP 200, so the request
		// resolves and only the derived state says otherwise. Note
		// `replacesOverview()` has no branch for `'error'` at all — it can
		// never take the body over here — so without the state gate the
		// page renders its own "we couldn't check" notice directly above a
		// confident "the next one runs at 10:00", which reads as the page
		// contradicting itself. Legacy never produced that pairing.
		freezeClock( '2026-10-22T05:00:00Z' );
		mockEndpoints( { schedule: { ok: true, scheduled_hour: 10 }, backups: null } );

		renderStageWithProbe();

		// Synchronized on the failure being reported *and* on the schedule
		// being available — both evidence from outside the thing under
		// test, and neither removed by the mutation this test exists to
		// catch.
		await expect(
			screen.findByText( "We couldn't check your site's backup status.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		await expect( scheduleIsAvailable() ).resolves.toHaveTextContent( 'Oct 22' );
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the last attempt failed and the activity log did too', async () => {
		// The second way the takeover stands down, and the one this
		// package already documents in `backup-status/banner.tsx`: not
		// "the site has restore points" but "the activity request failed
		// so we cannot know either way". The veto at `overview.tsx` is
		// `restorePointsLoading || restorePointsError || hasRestorePoints`,
		// so a failed activity read is enough to keep the first-run panel
		// away — and the line was rendering underneath a banner saying the
		// last backup did not complete.
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
		// The other half of legacy's gate, and the reason this port does
		// not re-impose `BACKUP_STATE.COMPLETE` on the line itself:
		// `replacesOverview` has already taken the body over for every
		// state that gate excluded. A site with nothing recorded and
		// nothing in its activity log is the plainest of them.
		//
		// Only half a test on its own — an absence assertion passes just as
		// well against a screen that never mounts the line at all. The test
		// directly above is the other half, and the two have to be read and
		// kept together.
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
