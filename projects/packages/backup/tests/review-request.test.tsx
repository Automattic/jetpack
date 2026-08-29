// JETPACK-2302 (K1) — the review prompt on the modernized dashboard.
//
// Rendered through the real Overview stage rather than the component in
// isolation, because most of what can go wrong here is wiring: the gate
// arrives on the capabilities response, one trigger reads the restores
// collection and the other reads the backup list, and the dismissal is a
// third endpoint keyed on which trigger fired.
//
// EVERY "the card stays away" assertion in this file is paired with an
// outside witness, and any test added here must keep that up. A bare
// `queryByText( … ).not.toBeInTheDocument()` is decorative: it passes
// just as happily when the stage threw, when the endpoints were
// mis-mocked, or when the copy was reworded — and, proved by mutation,
// it keeps passing when the plugin gate is flipped to fail *open*. Only
// the `dismissalCalls` assertion on the following line caught that.
//
// The two witnesses used here:
//
//   - `renderSettledOverview()` waits for the activity list's own row,
//     which proves the stage mounted, the endpoints answered, and the
//     dashboard reached the state where the prompt would have rendered.
//   - `dismissalCalls` records every request to the dismissal route, so
//     a test can say not just "no card" but *why* — the gate refused
//     before anything was asked, versus the trigger never fired, versus
//     the server said it was already dismissed.
//
// A negative assertion with neither is vacuous. Add one.

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: () => {},
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';
import { resetAnalyticsForTesting } from '../src/dashboard/hooks/use-analytics';
import { resetPageViewForTesting } from '../src/dashboard/screens/overview';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// These stages render behind several sequential requests; Testing
// Library's one-second default has not been enough on a loaded runner.
const SETTLE = { timeout: 10000 };

const RESTORE_QUESTION = 'Was it easy to restore your site?';
const BACKUPS_QUESTION = 'Do you enjoy the peace of mind of having real-time backups?';
// Matched loosely: `Link` appends its own "opens in a new tab" text to
// the accessible name, so an exact match would pin this test to that
// wording rather than to ours.
const CTA = /Please leave a review and help us spread the word!/;

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

/**
 * One rewindable-activity entry, so the list has a row to render and the
 * first-run panel does not take the body over.
 *
 * @return A raw activity entry.
 */
function activityEntry() {
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

/**
 * One `/jetpack/v4/backups` row, in WordPress.com's stringly-typed shape.
 *
 * @param id   - Row id, only ever compared for uniqueness.
 * @param over - Fields to override.
 * @return A raw backup entry.
 */
function backupRow( id: number, over: Record< string, unknown > = {} ) {
	return {
		id: String( id ),
		started: '2026-08-13 18:08:56',
		last_updated: '2026-08-13 18:54:14',
		status: 'finished',
		period: String( 1786644531 + id ),
		percent: '100',
		is_backup: '1',
		is_scan: '0',
		discarded: '0',
		stats: { prefix: 'wp_' },
		...over,
	};
}

/**
 * A run of backups long enough to satisfy the five-in-a-row trigger.
 *
 * @param over - Fields to override on the newest row only.
 * @return Five raw backup entries, newest first.
 */
function goodRun( over: Record< string, unknown > = {} ) {
	return [ backupRow( 1, over ), backupRow( 2 ), backupRow( 3 ), backupRow( 4 ), backupRow( 5 ) ];
}

/**
 * One `/jetpack/v4/restores` row.
 *
 * @param daysAgo - How long ago the restore ran.
 * @param status  - The collection's own status spelling.
 * @return A raw restore entry.
 */
function restoreRow( daysAgo: number, status = 'finished' ) {
	return {
		restore_id: 912682,
		rewind_id: '1786644531.123',
		when: new Date( Date.now() - daysAgo * 86_400_000 ).toISOString(),
		status,
	};
}

/**
 * How many times the dismissal was reported to Tracks.
 *
 * Counted rather than asserted with `toHaveBeenCalledTimes`, because the
 * Overview screen records its own page view through the same mock.
 *
 * @return The number of `jetpack_backup_dismiss_review_click` events.
 */
function dismissEventCount() {
	return mockRecordEvent.mock.calls.filter(
		( [ event ] ) => event === 'jetpack_backup_dismiss_review_click'
	).length;
}

type Options = {
	/**
	 * Whether the capabilities response reports the standalone plugin.
	 * `'absent'` leaves the key off entirely, which is what an older
	 * server answering a newer client looks like.
	 */
	standalonePlugin?: boolean | 'absent';
	backups?: unknown[];
	restores?: unknown[];
	/** What the dismissal read answers, per reason. */
	dismissed?: Record< string, unknown >;
	/** Make the dismissal read reject. */
	dismissalReadFails?: boolean;
	/** Make the dismissal write reject. */
	dismissalWriteFails?: boolean;
	/** Never settle the dismissal write, so it stays in flight. */
	dismissalWriteHangs?: boolean;
};

/** Every dismissal request the stage made, in order. */
let dismissalCalls: Array< { option_name: string; should_dismiss: boolean } > = [];

/**
 * Answer every endpoint the Overview reads.
 *
 * @param options                     - Overrides.
 * @param options.standalonePlugin    - What the capabilities response says about the plugin gate.
 * @param options.backups             - What `/jetpack/v4/backups` resolves with.
 * @param options.restores            - What `/jetpack/v4/restores` resolves with.
 * @param options.dismissed           - What the dismissal read answers, per reason.
 * @param options.dismissalReadFails  - Make the dismissal read reject.
 * @param options.dismissalWriteFails - Make the dismissal write reject.
 * @param options.dismissalWriteHangs - Never settle the dismissal write.
 */
function mockEndpoints( {
	standalonePlugin = true,
	backups = [],
	restores = [],
	dismissed = {},
	dismissalReadFails = false,
	dismissalWriteFails = false,
	dismissalWriteHangs = false,
}: Options = {} ) {
	mockApiFetch.mockImplementation(
		( o: { path?: string; data?: { option_name: string; should_dismiss: boolean } } ) => {
			const path = o?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				const capabilities: Record< string, unknown > = { hasBackupPlan: true, hasScan: false };
				if ( standalonePlugin !== 'absent' ) {
					capabilities.local = { isStandalonePluginActive: standalonePlugin };
				}
				return Promise.resolve( capabilities );
			}
			if ( path.includes( '/site/dismissed-review-request' ) ) {
				const data = o.data as { option_name: string; should_dismiss: boolean };
				dismissalCalls.push( data );
				if ( data.should_dismiss ) {
					if ( dismissalWriteHangs ) {
						return new Promise( () => {} );
					}
					return dismissalWriteFails
						? Promise.reject( new Error( 'Could not save the dismissal.' ) )
						: Promise.resolve( true );
				}
				return dismissalReadFails
					? Promise.reject( new Error( 'Could not read the dismissal.' ) )
					: Promise.resolve( dismissed[ data.option_name ] ?? false );
			}
			if ( path.includes( '/site/rewindable-activity' ) ) {
				return Promise.resolve( {
					current: { orderedItems: [ activityEntry() ] },
					totalItems: 1,
					totalPages: 1,
				} );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return Promise.resolve( { ok: true, backups_stopped: false } );
			}
			if ( path === '/jetpack/v4/restores' ) {
				return Promise.resolve( restores );
			}
			if ( path === '/jetpack/v4/backups' ) {
				return Promise.resolve( backups );
			}
			return Promise.resolve( {} );
		}
	);
}

/**
 * Render the Overview and wait until the activity list has a row in it.
 *
 * That row is the outside witness every negative assertion here leans
 * on: it proves the stage mounted, the endpoints answered, and the
 * dashboard reached the state where the prompt would have rendered if it
 * were going to.
 */
async function renderSettledOverview() {
	render( <OverviewStage /> );
	await expect(
		screen.findByText( 'Backup complete', undefined, SETTLE )
	).resolves.toBeInTheDocument();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	dismissalCalls = [];
	mockApiFetch.mockReset();
	mockRecordEvent.mockReset();
	resetAnalyticsForTesting();
	resetPageViewForTesting();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'review prompt — the plugin gate', () => {
	// The reason this gate exists. The card asks the reader to review the
	// standalone Backup plugin, and the modernized dashboard is intended to
	// reach the Jetpack plugin, where that request makes no sense.
	//
	// Dead today: the dashboard only ships in the standalone plugin, so the
	// server always reports it active. That is exactly why it needs a test —
	// nothing else would notice it breaking.
	it( 'stays away when the standalone plugin is not active', async () => {
		mockEndpoints( { standalonePlugin: false, backups: goodRun(), restores: [ restoreRow( 1 ) ] } );

		await renderSettledOverview();

		// Both triggers would have fired.
		expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument();
		expect( screen.queryByText( BACKUPS_QUESTION ) ).not.toBeInTheDocument();
		// And the gate is decided before anything is asked, rather than the
		// card being rendered and then withdrawn.
		expect( dismissalCalls ).toEqual( [] );
	} );

	// The gate must not be readable as "the key is missing, so allow it".
	// An older server answering a newer client is the shape this covers.
	it( 'stays away when the response says nothing about the plugin', async () => {
		mockEndpoints( {
			standalonePlugin: 'absent',
			backups: goodRun(),
			restores: [ restoreRow( 1 ) ],
		} );

		await renderSettledOverview();

		expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument();
		expect( dismissalCalls ).toEqual( [] );
	} );
} );

describe( 'review prompt — trigger A, a recent restore', () => {
	it( 'asks after a restore that finished within the last 15 days', async () => {
		mockEndpoints( { restores: [ restoreRow( 3 ) ] } );

		await renderSettledOverview();

		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: CTA } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'jetpack-backup-new-review' )
		);
	} );

	// The collection route maps nothing — it `json_decode`s WordPress.com's
	// body and returns it — and the sibling status route's `STATUS_MAP`
	// equates `success` with `finished`. Matching only `finished` would
	// mean this trigger never fires for anyone, silently, if upstream
	// spells it the other way.
	it( 'asks when the restore reports the other success spelling', async () => {
		mockEndpoints( { restores: [ restoreRow( 3, 'success' ) ] } );

		await renderSettledOverview();

		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();
	} );

	it( 'stays away once the restore is older than 15 days', async () => {
		mockEndpoints( { restores: [ restoreRow( 16 ) ] } );

		await renderSettledOverview();

		expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument();
		expect( dismissalCalls ).toEqual( [] );
	} );

	// `settled` is not the same question. An aborted or failed restore is
	// just as over as a finished one, and is the last reader to ask.
	it.each( [ 'fail', 'aborted', 'success-with-errors', 'running' ] )(
		'stays away when the newest restore reports %p',
		async status => {
			mockEndpoints( { restores: [ restoreRow( 1, status ) ] } );

			await renderSettledOverview();

			expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument();
			expect( dismissalCalls ).toEqual( [] );
		}
	);
} );

describe( 'review prompt — trigger B, a run of good backups', () => {
	it( 'asks after five backups that all produced a restore point', async () => {
		mockEndpoints( { backups: goodRun() } );

		await renderSettledOverview();

		await expect( screen.findByText( BACKUPS_QUESTION ) ).resolves.toBeInTheDocument();
	} );

	it( 'stays away on four good backups', async () => {
		mockEndpoints( { backups: goodRun().slice( 0, 4 ) } );

		await renderSettledOverview();

		expect( screen.queryByText( BACKUPS_QUESTION ) ).not.toBeInTheDocument();
		expect( dismissalCalls ).toEqual( [] );
	} );

	// The deliberate difference from legacy, whose review trigger checked
	// status and stats but not `discarded`. A site whose oldest backups are
	// being aged out is told so on this very screen, and "do you enjoy the
	// peace of mind" beside that message reads as a taunt.
	it( 'stays away when one of the five has been discarded', async () => {
		mockEndpoints( { backups: goodRun( { discarded: '1' } ) } );

		await renderSettledOverview();

		expect( screen.queryByText( BACKUPS_QUESTION ) ).not.toBeInTheDocument();
		expect( dismissalCalls ).toEqual( [] );
	} );

	it( 'stays away when one of the five carries no stats', async () => {
		mockEndpoints( { backups: goodRun( { stats: {} } ) } );

		await renderSettledOverview();

		expect( screen.queryByText( BACKUPS_QUESTION ) ).not.toBeInTheDocument();
		expect( dismissalCalls ).toEqual( [] );
	} );
} );

describe( 'review prompt — precedence', () => {
	// Legacy's `if` / `else if`, kept. The restore is the more specific
	// thing to have just happened, and the reader remembers doing it.
	it( 'asks about the restore when both triggers fire', async () => {
		mockEndpoints( { backups: goodRun(), restores: [ restoreRow( 1 ) ] } );

		await renderSettledOverview();

		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( BACKUPS_QUESTION ) ).not.toBeInTheDocument();
		// And only the winning reason is ever asked about, so a prompt that
		// was never shown cannot be marked as seen.
		expect( dismissalCalls.map( call => call.option_name ) ).toEqual( [ 'restore' ] );
	} );
} );

describe( 'review prompt — dismissal', () => {
	it( 'records the refusal against the reason that fired, and hides the card', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ] } );

		await renderSettledOverview();
		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Maybe later' } ) );

		await waitFor( () => expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument() );
		expect( dismissalCalls ).toContainEqual( { option_name: 'restore', should_dismiss: true } );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_dismiss_review_click' );
	} );

	it( 'stays away when the server says this prompt was already dismissed', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ], dismissed: { restore: true } } );

		await renderSettledOverview();

		expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument();
		// The witness that the read happened at all, so this is not passing
		// because the trigger never fired.
		expect( dismissalCalls ).toEqual( [ { option_name: 'restore', should_dismiss: false } ] );
	} );

	// Fail closed. We cannot confirm this reader has not already declined,
	// so we do not ask them again.
	it( 'stays away when the dismissal read fails', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ], dismissalReadFails: true } );

		await renderSettledOverview();

		await waitFor( () =>
			expect( dismissalCalls ).toEqual( [ { option_name: 'restore', should_dismiss: false } ] )
		);
		expect( screen.queryByText( RESTORE_QUESTION ) ).not.toBeInTheDocument();
	} );

	// The third legacy bug: `.then( setDismissedReview( true ) )` *calls*
	// the setter and passes `undefined` as the callback, so the card
	// disappeared the moment the request was sent. A failed write then hid
	// the prompt locally while the server recorded nothing, and it came
	// back on the next load. Confirmation means the card stays put.
	it( 'keeps the card up when the dismissal write fails', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ], dismissalWriteFails: true } );

		await renderSettledOverview();
		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Maybe later' } ) );

		await waitFor( () =>
			expect( dismissalCalls ).toContainEqual( { option_name: 'restore', should_dismiss: true } )
		);
		expect( screen.getByText( RESTORE_QUESTION ) ).toBeInTheDocument();
	} );

	// Fixing legacy bug 3 has a cost: the card no longer vanishes on click,
	// so on a slow connection nothing visibly happens and the reader clicks
	// again. Unguarded that is a second POST and — worse — a second refusal
	// reported for one decision.
	//
	// Asserts the outcome, not one mechanism. Three things hold it up (the
	// disabled button, the report-once latch, and `dismiss()`'s own
	// refusal), so removing any single one leaves this green; removing all
	// three does not. That redundancy is deliberate, and the `aria-disabled`
	// assertion is what pins the one of them the reader can actually see.
	it( 'ignores further clicks while the refusal is still being written', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ], dismissalWriteHangs: true } );

		await renderSettledOverview();
		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();

		const button = screen.getByRole( 'button', { name: 'Maybe later' } );
		await userEvent.click( button );
		await userEvent.click( button );
		await userEvent.click( button );

		const writes = dismissalCalls.filter( call => call.should_dismiss );
		expect( writes ).toHaveLength( 1 );
		expect( dismissEventCount() ).toBe( 1 );
		// And the reader can see why nothing else happened.
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	// A retry is not a second decision. The write is allowed to be
	// attempted again — that is the whole point of leaving the card up when
	// it fails — but Tracks must not read one refusal as several, which
	// would show as a step change in dismissal rate at the flag flip.
	it( 'reports one refusal however many times the failing write is retried', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ], dismissalWriteFails: true } );

		await renderSettledOverview();
		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();

		const button = screen.getByRole( 'button', { name: 'Maybe later' } );
		await userEvent.click( button );
		await userEvent.click( button );
		await userEvent.click( button );

		await waitFor( () =>
			expect( dismissalCalls.filter( call => call.should_dismiss ).length ).toBeGreaterThan( 1 )
		);
		expect( dismissEventCount() ).toBe( 1 );
		// The witness: the card is still up, which is what makes retrying
		// possible and is the behaviour the single event is measured against.
		expect( screen.getByText( RESTORE_QUESTION ) ).toBeInTheDocument();
	} );

	// Two independent dismissals, not one. Declining after a restore must
	// not spend the backups prompt, and the server stores them under two
	// different options for the same reason.
	it( 'still asks about backups on a site that dismissed the restore prompt', async () => {
		mockEndpoints( { backups: goodRun(), dismissed: { restore: true } } );

		await renderSettledOverview();

		await expect( screen.findByText( BACKUPS_QUESTION ) ).resolves.toBeInTheDocument();
		expect( dismissalCalls ).toEqual( [ { option_name: 'backups', should_dismiss: false } ] );
	} );
} );

describe( 'review prompt — tracks', () => {
	it( 'records the click through to the review page', async () => {
		mockEndpoints( { restores: [ restoreRow( 1 ) ] } );

		await renderSettledOverview();
		await expect( screen.findByText( RESTORE_QUESTION ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'link', { name: CTA } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_new_review_click' );
	} );
} );
