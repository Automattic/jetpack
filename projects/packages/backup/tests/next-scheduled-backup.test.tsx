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
 * @param options          - Overrides.
 * @param options.schedule - What `/site/backup/schedule` resolves with.
 * @param options.size     - Extra fields for `/site/backup/size`.
 * @param options.backups  - What `/jetpack/v4/backups` resolves with.
 * @param options.activity - Rewindable-activity entries.
 */
function mockEndpoints( {
	schedule = { ok: true, scheduled_hour: 10, scheduled_by: null } as unknown,
	size = {} as Record< string, unknown >,
	backups = [ USABLE_BACKUP ] as unknown[],
	activity = [ backupActivityEntry() ] as unknown[],
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
			return Promise.resolve( {
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

describe( 'while the reads are in flight', () => {
	it( "holds the line's height so the storage section is not pushed down", async () => {
		freezeClock( '2026-10-22T05:00:00Z' );
		let release: ( v: unknown ) => void = () => {};
		const pending = new Promise( resolve => {
			release = resolve;
		} );
		mockApiFetch.mockImplementation( ( options: { path?: string } ) =>
			( options?.path ?? '' ).includes( '/site/backup/' ) ? pending : Promise.resolve( {} )
		);

		renderWithClient( <NextScheduledBackup /> );

		await waitFor( () => expect( placeholder() ).not.toBeNull() );
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();

		release( { ok: true, scheduled_hour: 10, backups_stopped: false } );
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

		await expect(
			screen.findByText( /^Next full backup/, undefined, SETTLE )
		).resolves.toHaveTextContent( /^Next full backup: Oct 22, 10:00-10:59 AM\.$/ );
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

		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Your first cloud backup will be ready soon', undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /^Next full backup/ ) ).not.toBeInTheDocument();
	} );
} );
