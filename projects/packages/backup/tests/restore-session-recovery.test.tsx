// JETPACK-2243 B3 — the Restore screen, opened while a restore is
// already under way.
//
// Every piece of restore state lived in `useState`, so nothing survived a
// page load. Reloading mid-restore, opening a second tab, or arriving
// after a restore started from Calypso all rendered an armed **Confirm
// restore** button with no hint that anything was running — and the only
// control on screen would have started a second concurrent whole-site
// restore.

const mockApiFetch = jest.fn();
const mockParams = jest.fn< { rewindId: string }, [] >();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => mockParams(),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, within } from '@testing-library/react';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import RestoreScreen from '../src/dashboard/screens/restore';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const CAPABILITIES = { hasBackupPlan: true, hasScan: false };

// The backup this screen is pointed at, and the different one that turns
// out to be restoring.
const URL_ID = '1786663613.9425';
const RUNNING_ID = '1786512000.11';

const CONFIRM = /Confirm restore/;
const ALREADY_RUNNING = /A restore is already running/;

/**
 * Render the screen and return queries scoped to it.
 *
 * Scoped rather than `screen`, and that matters here. `Notice` announces
 * itself through `@wordpress/a11y`, which appends a visually hidden
 * speak region to `document.body` — once per process, and it keeps its
 * text. A `screen` query therefore matches both the notice and its
 * announcement, and worse, still matches an announcement left behind by
 * the *previous* test, resolving before this render has adopted
 * anything. The speak region lives outside the container, so scoping
 * removes both problems.
 *
 * Callers wrap the result in `within()` themselves rather than having
 * this do it, so that `testing-library/prefer-screen-queries` can see
 * the scoping it is meant to allow.
 *
 * @return The rendered container.
 */
function renderScreen(): HTMLElement {
	const { container } = render(
		<QueryClientProvider>
			<RestoreScreen />
		</QueryClientProvider>
	);
	return container;
}

/**
 * Route each request by path.
 *
 * @param options          - Overrides.
 * @param options.restores - What `/jetpack/v4/restores` resolves with.
 * @param options.status   - What a restore-status poll resolves with.
 */
function respondWith( { restores = [] as unknown, status = null as unknown } = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/restores' ) ) {
			return Promise.resolve( restores );
		}
		if ( path.includes( '/rewind/restore/' ) ) {
			return Promise.resolve( status );
		}
		return Promise.resolve( CAPABILITIES );
	} );
}

/**
 * A row of the restores collection.
 *
 * @param over - Fields to override.
 * @return The row.
 */
function restoreRow( over: Record< string, unknown > = {} ) {
	return {
		restore_id: 912682,
		rewind_id: RUNNING_ID,
		when: '2026-08-20T10:00:00+00:00',
		status: 'running',
		...over,
	};
}

/**
 * A status payload in the shape the bridge projects.
 *
 * @param over - Fields to override.
 * @return The payload.
 */
function statusPayload( over: Record< string, unknown > = {} ) {
	return {
		id: 912682,
		status: 'running',
		progress: 47,
		rewind_id: RUNNING_ID,
		error_code: '',
		message: '',
		...over,
	};
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockParams.mockReset();
	mockParams.mockReturnValue( { rewindId: URL_ID } );

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'Restore screen — a restore already running', () => {
	it( 'shows the restore in progress instead of the form', async () => {
		respondWith( { restores: [ restoreRow() ], status: statusPayload() } );

		const view = within( renderScreen() );

		await expect( view.findByText( ALREADY_RUNNING ) ).resolves.toBeInTheDocument();
		expect( view.queryByRole( 'button', { name: CONFIRM } ) ).not.toBeInTheDocument();
		// The checklist goes with the button: choosing categories for a
		// restore you cannot start is not a decision worth offering.
		expect( view.queryByText( 'Choose the items you wish to restore:' ) ).not.toBeInTheDocument();
	} );

	it( 'names the backup being restored, not the one in the address', async () => {
		respondWith( { restores: [ restoreRow() ], status: statusPayload() } );

		const view = within( renderScreen() );

		await expect( view.findByText( ALREADY_RUNNING ) ).resolves.toBeInTheDocument();
		// The running restore is of 1786512000 (12 Aug); the address names
		// 1786663613 (13 Aug). The heading has to follow the restore.
		const point = await view.findByText( /Restore point:/ );
		expect( point ).toHaveTextContent( /Aug 12, 2026/ );
		expect( point ).not.toHaveTextContent( /Aug 13, 2026/ );
	} );

	it( 'never arms the form while it is still finding out', async () => {
		// A Confirm button that appears and is then withdrawn is the same
		// hazard, just briefer.
		respondWith( { restores: [ restoreRow() ], status: statusPayload() } );

		const view = within( renderScreen() );

		expect( view.queryByRole( 'button', { name: CONFIRM } ) ).not.toBeInTheDocument();
	} );

	it( 'arms the form when nothing is running', async () => {
		respondWith( { restores: [ restoreRow( { status: 'finished' } ) ] } );

		const view = within( renderScreen() );

		await expect( view.findByRole( 'button', { name: CONFIRM } ) ).resolves.toBeInTheDocument();
		expect( view.queryByText( ALREADY_RUNNING ) ).not.toBeInTheDocument();
	} );
} );
