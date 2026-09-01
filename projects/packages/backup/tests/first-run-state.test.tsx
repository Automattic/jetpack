// Tests for the first-run backup state (JETPACK-2243 E1/E2).
//
// The state machine itself is unit-tested in
// `src/dashboard/hooks/test/use-backups.test.ts`; this file covers what
// a reader actually ends up looking at, and the "Back up now" state
// table ported from the legacy button.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupNowButton from '../src/dashboard/components/backup-now-button';
import BackupStatusPanel, { replacesOverview } from '../src/dashboard/components/backup-status';
import BackupStatusBanner from '../src/dashboard/components/backup-status/banner';
import { keys } from '../src/dashboard/data/query-client';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SITE = 'example.wordpress.com';

/**
 * Override the site slug the connection global reports, for one test.
 * The `beforeEach` restores `SITE` before the next one.
 *
 * @param siteSuffix - The slug, or undefined for a global that carries none.
 */
function setSiteSuffix( siteSuffix: string | undefined ) {
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		siteSuffix,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
}

/**
 * Render inside an isolated QueryClient.
 *
 * @param ui - The tree to render.
 * @return The testing-library render result.
 */
function renderWithClient( ui: ReactNode ) {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	return {
		...render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> ),
		client,
	};
}

/**
 * Answer each endpoint the button reads.
 *
 * @param options                - Overrides.
 * @param options.hasBackupPlan  - Whether the capabilities bridge reports a plan.
 * @param options.backups        - What `/jetpack/v4/backups` returns.
 * @param options.backupsStopped - Whether WPCOM reports backups stopped.
 */
function mockEndpoints( {
	hasBackupPlan = true,
	backups = [] as unknown[],
	backupsStopped = false,
} = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan, hasScan: false } );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: backupsStopped } );
		}
		if ( path.includes( '/backups' ) ) {
			return Promise.resolve( backups );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * One entry of `/jetpack/v4/backups`, in WPCOM's stringly-typed shape.
 *
 * @param overrides - Fields to replace.
 * @return A raw entry.
 */
function entry( overrides: Record< string, unknown > = {} ) {
	return {
		id: '1',
		started: '2026-08-13 18:08:56',
		last_updated: '2026-08-13 18:54:14',
		status: 'finished',
		period: '1786644531',
		percent: '100',
		is_backup: '1',
		is_scan: '1',
		discarded: '0',
		stats: { prefix: 'wp_' },
		...overrides,
	};
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockEndpoints();
	// `siteSuffix` is pinned here, not just where a test needs it: the
	// spread carries the previous test's value forward, so the one test
	// that clears it would otherwise leak `undefined` into every test below.
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
		siteSuffix: SITE,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'replacesOverview', () => {
	it( 'takes over the body only while there is no usable restore point', () => {
		expect( replacesOverview( 'no-backups', true, false ) ).toBe( true );
		expect( replacesOverview( 'will-retry', true, false ) ).toBe( true );
		expect( replacesOverview( 'no-good-backups', true, false ) ).toBe( true );
		expect( replacesOverview( 'in-progress', true, false ) ).toBe( true );
	} );

	it( 'leaves the two-pane body alone once restore points exist', () => {
		// A routine backup on an established site gets the banner instead,
		// so the activity list stays usable for the minutes it runs.
		expect( replacesOverview( 'in-progress', false, false ) ).toBe( false );
		expect( replacesOverview( 'complete', false, false ) ).toBe( false );
		// "We couldn't ask" must never take over the page either — the
		// activity list is a separate endpoint and may be working fine.
		expect( replacesOverview( 'error', false, false ) ).toBe( false );
		expect( replacesOverview( 'loading', false, false ) ).toBe( false );
	} );

	// `/jetpack/v4/backups` sees only VaultPress's most recent handful of
	// rows, so it can report "nothing usable" for a site that still has
	// restore points further back in the retention window. Hiding the list
	// there would be the same mistake as the empty state this replaces —
	// and it would land at the moment someone came to restore.
	it( 'never takes over while the activity log still has a restore point', () => {
		expect( replacesOverview( 'no-good-backups', true, true ) ).toBe( false );
		expect( replacesOverview( 'will-retry', true, true ) ).toBe( false );
		expect( replacesOverview( 'no-backups', true, true ) ).toBe( false );
		expect( replacesOverview( 'in-progress', true, true ) ).toBe( false );
	} );
} );

describe( 'BackupStatusPanel', () => {
	it( 'gives a site with no backups the first-backup copy', () => {
		render( <BackupStatusPanel state="no-backups" progress={ 0 } /> );

		expect( screen.getByText( 'Your first cloud backup will be ready soon' ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'The first backup usually takes a few minutes, so it will become available soon.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows a percentage only while a backup is actually running', () => {
		const { rerender } = render( <BackupStatusPanel state="in-progress" progress={ 42 } /> );
		expect( screen.getByText( '42%' ) ).toBeInTheDocument();

		// A retryable failure reports the percentage the attempt died at,
		// which would read as a stalled backup rather than a pending retry.
		rerender( <BackupStatusPanel state="will-retry" progress={ 42 } /> );
		expect( screen.queryByText( '42%' ) ).not.toBeInTheDocument();
	} );

	// The heading promises a backup is coming, so a panel with no sign of
	// activity contradicts itself — and this is the state a brand-new
	// customer sits and watches.
	it( 'still shows a progress element before any backup has started', () => {
		const { rerender } = render( <BackupStatusPanel state="no-backups" progress={ 0 } /> );

		expect( screen.getByRole( 'progressbar' ) ).toBeInTheDocument();
		// Indeterminate: there is no percentage to claim yet.
		expect( screen.queryByText( /\d+%/ ) ).not.toBeInTheDocument();

		// A pending retry is the exception — nothing is running to report.
		rerender( <BackupStatusPanel state="will-retry" progress={ 0 } /> );
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	} );

	// The transition every new site makes: no records, then the first
	// backup starts.
	it( 'takes a value once the first backup starts', () => {
		const { rerender } = render( <BackupStatusPanel state="no-backups" progress={ 0 } /> );
		expect( screen.queryByText( '19%' ) ).not.toBeInTheDocument();

		rerender( <BackupStatusPanel state="in-progress" progress={ 19 } /> );

		expect( screen.getByRole( 'progressbar' ) ).toBeInTheDocument();
		expect( screen.getByText( '19%' ) ).toBeInTheDocument();
	} );

	it( 'offers a way to reach support when no attempt produced a restore point', () => {
		render( <BackupStatusPanel state="no-good-backups" progress={ 0 } /> );

		expect( screen.getByText( "We're having trouble backing up your site" ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Get in touch with us/ } ) ).toBeInTheDocument();
	} );

	it( 'tells support which site is asking', () => {
		setSiteSuffix( SITE );

		render( <BackupStatusPanel state="no-good-backups" progress={ 0 } /> );

		expect( screen.getByRole( 'link', { name: /Get in touch with us/ } ) ).toHaveAttribute(
			'href',
			`https://jetpack.com/redirect/?source=jetpack-contact-support&site=${ SITE }`
		);
	} );

	it( 'omits the site entirely when the connection global carries no slug', () => {
		// `getRedirectUrl` walks its args with `for…in`, so a present-but-undefined
		// `site` is encoded as the literal string `undefined` *and* suppresses the
		// helper's own site fallback — dropping the site in the one state where
		// support most needs to know which one is asking.
		setSiteSuffix( undefined );

		render( <BackupStatusPanel state="no-good-backups" progress={ 0 } /> );

		expect( screen.getByRole( 'link', { name: /Get in touch with us/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-contact-support'
		);
	} );

	// JETPACK-2329. Legacy still closes on "…backup management on Jetpack.com",
	// pointing at the screen this dashboard replaces; this stops it returning as
	// missing parity.
	it( 'sends a waiting site nowhere, having nothing to offer that this page does not', () => {
		const { rerender } = render( <BackupStatusPanel state="no-backups" progress={ 0 } /> );

		// Every state that shares this branch, and each one witnessed by its own
		// copy: the absence has to be a link that is gone, not a panel that
		// never rendered. The support link two tests up is the other half — it
		// proves this file's link query finds one when there is one to find.
		for ( const state of [ 'no-backups', 'in-progress', 'will-retry' ] as const ) {
			rerender( <BackupStatusPanel state={ state } progress={ 0 } /> );
			expect(
				screen.getByText(
					'The first backup usually takes a few minutes, so it will become available soon.'
				)
			).toBeInTheDocument();
			expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		}
	} );
} );

describe( 'BackupStatusBanner', () => {
	it( 'reports the running backup without hiding anything', () => {
		render( <BackupStatusBanner progress={ 36 } /> );

		expect( screen.getByText( 'Your backup will be ready soon' ) ).toBeInTheDocument();
		expect( screen.getByText( '36%' ) ).toBeInTheDocument();
	} );
} );

describe( 'BackupNowButton', () => {
	it( 'is offered when the site has a plan', async () => {
		renderWithClient( <BackupNowButton /> );

		await expect(
			screen.findByRole( 'button', { name: 'Back up now' } )
		).resolves.toBeInTheDocument();
	} );

	// `DashboardLayout` passes header actions to `<Page>`, which renders
	// them above `<Gates>` — so without self-gating an unlicensed site is
	// offered a control that cannot work.
	it( 'renders nothing on a site with no plan', async () => {
		mockEndpoints( { hasBackupPlan: false } );

		const { container, client } = renderWithClient( <BackupNowButton /> );

		// Settle on the capabilities answer reaching the cache, not on the
		// request having been issued — then confirm the button stayed away.
		// Waiting on the call returns while the query is still pending, and
		// the button is empty then for the loading reason, so the no-plan
		// state this test is named for would never be reached.
		await waitFor( () =>
			expect( client.getQueryState( keys.capabilities() )?.status ).toBe( 'success' )
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing without a user-level connection', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: { isRegistered: false, hasConnectedOwner: false, isUserConnected: false },
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		const { container } = renderWithClient( <BackupNowButton /> );

		// Nothing to wait for: the connection state is read synchronously
		// from a global, and every query it gates is disabled, so there is
		// no request that could later change this.
		expect( container ).toBeEmptyDOMElement();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'reports a backup already running, and refuses to queue another', async () => {
		mockEndpoints( {
			backups: [ entry( { status: 'started', percent: '10', stats: undefined } ) ],
		} );

		renderWithClient( <BackupNowButton /> );

		const button = await screen.findByRole( 'button', { name: 'Backup in progress' } );
		// `focusableWhenDisabled` keeps it in the tab order and marks it
		// aria-disabled rather than using the native attribute.
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'refuses to queue a backup when WPCOM has stopped them', async () => {
		mockEndpoints( { backupsStopped: true } );

		renderWithClient( <BackupNowButton /> );

		const button = await screen.findByRole( 'button', { name: 'Back up now' } );
		// Waits for the storage answer to arrive and disable it, rather
		// than assuming it already has.
		await waitFor( () => expect( button ).toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'queues a backup and reports it as enqueued', async () => {
		mockApiFetch.mockImplementation( ( options: { path?: string; method?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return Promise.resolve( { ok: true, backups_stopped: false } );
			}
			if ( path.includes( '/site/backup/enqueue' ) ) {
				return Promise.resolve( { success: true } );
			}
			return Promise.resolve( [] );
		} );

		renderWithClient( <BackupNowButton /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Back up now' } ) );

		await expect(
			screen.findByRole( 'button', { name: 'Backup enqueued' } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/jetpack/v4/site/backup/enqueue', method: 'POST' } )
		);
	} );

	// The trickiest state in the component. A successful enqueue leaves the
	// button reading "Backup enqueued" and forces polling, because nothing
	// in the response yet says a backup is coming. Once WPCOM publishes the
	// `started` record, an effect has to hand over to "Backup in progress"
	// and release that forced poll — otherwise it keeps polling after the
	// backup finishes.
	it( 'hands over from enqueued to in progress once WPCOM starts the backup', async () => {
		let backups: unknown[] = [];
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return Promise.resolve( { ok: true, backups_stopped: false } );
			}
			if ( path.includes( '/site/backup/enqueue' ) ) {
				return Promise.resolve( { success: true } );
			}
			return Promise.resolve( backups );
		} );

		const { client } = renderWithClient( <BackupNowButton /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Back up now' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'Backup enqueued' } )
		).resolves.toBeInTheDocument();

		// WPCOM publishes the record the forced poll was waiting for.
		// Invalidating stands in for that poll landing, so the test does
		// not have to sit through the real interval.
		backups = [ entry( { status: 'started', percent: '5', stats: undefined } ) ];
		await act( async () => {
			await client.invalidateQueries( { queryKey: [ 'backup', 'backups' ] } );
		} );

		await expect(
			screen.findByRole( 'button', { name: 'Backup in progress' } )
		).resolves.toBeInTheDocument();
	} );

	// The legacy button has no rejection handler and discards the body,
	// so a WPCOM refusal reported "Backup enqueued" just like a success.
	it( 'stays actionable when the enqueue is refused', async () => {
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return Promise.resolve( { ok: true, backups_stopped: false } );
			}
			if ( path.includes( '/site/backup/enqueue' ) ) {
				// A non-200 from WPCOM is flattened to HTTP 200 with a null
				// body, so this resolves rather than throwing.
				return Promise.resolve( null );
			}
			return Promise.resolve( [] );
		} );

		renderWithClient( <BackupNowButton /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Back up now' } ) );

		// Settle on the POST having actually gone out, so this cannot pass
		// on the pre-click state — the label is "Back up now" either way.
		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: '/jetpack/v4/site/backup/enqueue' } )
			)
		);

		// Back to an enabled "Back up now" rather than a false success.
		const button = await screen.findByRole( 'button', { name: 'Back up now' } );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
		expect( screen.queryByText( 'Backup enqueued' ) ).not.toBeInTheDocument();
	} );
} );
