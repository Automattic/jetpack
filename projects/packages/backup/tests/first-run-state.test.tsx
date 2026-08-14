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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupNowButton from '../src/dashboard/components/backup-now-button';
import BackupStatusPanel, { replacesOverview } from '../src/dashboard/components/backup-status';
import BackupStatusBanner from '../src/dashboard/components/backup-status/banner';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

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
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
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
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'replacesOverview', () => {
	it( 'takes over the body only while there is no usable restore point', () => {
		expect( replacesOverview( 'no-backups', true ) ).toBe( true );
		expect( replacesOverview( 'will-retry', true ) ).toBe( true );
		expect( replacesOverview( 'no-good-backups', true ) ).toBe( true );
		expect( replacesOverview( 'in-progress', true ) ).toBe( true );
	} );

	it( 'leaves the two-pane body alone once restore points exist', () => {
		// A routine backup on an established site gets the banner instead,
		// so the activity list stays usable for the minutes it runs.
		expect( replacesOverview( 'in-progress', false ) ).toBe( false );
		expect( replacesOverview( 'complete', false ) ).toBe( false );
		// "We couldn't ask" must never take over the page either — the
		// activity list is a separate endpoint and may be working fine.
		expect( replacesOverview( 'error', false ) ).toBe( false );
		expect( replacesOverview( 'loading', false ) ).toBe( false );
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

	it( 'offers a way to reach support when no attempt produced a restore point', () => {
		render( <BackupStatusPanel state="no-good-backups" progress={ 0 } /> );

		expect( screen.getByText( "We're having trouble backing up your site" ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Get in touch with us/ } ) ).toBeInTheDocument();
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

		const { container } = renderWithClient( <BackupNowButton /> );

		// Wait for the capabilities query to settle before asserting absence.
		await new Promise( resolve => setTimeout( resolve, 0 ) );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing without a user-level connection', async () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: { isRegistered: false, hasConnectedOwner: false, isUserConnected: false },
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		const { container } = renderWithClient( <BackupNowButton /> );

		await new Promise( resolve => setTimeout( resolve, 0 ) );
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
		await new Promise( resolve => setTimeout( resolve, 0 ) );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
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

		// Back to an enabled "Back up now" rather than a false success.
		const button = await screen.findByRole( 'button', { name: 'Back up now' } );
		await new Promise( resolve => setTimeout( resolve, 0 ) );
		expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.queryByText( 'Backup enqueued' ) ).not.toBeInTheDocument();
	} );
} );
