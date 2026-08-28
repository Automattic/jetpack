// A progress bar has to say what it is measuring.
//
// `@wordpress/components`' `ProgressBar` supplies an `aria-label` of its
// own — a generic "Loading …" — and spreads the caller's props after it.
// So a bare `<ProgressBar />` is not unlabelled, which is the trap: it
// is labelled with a name that identifies neither the operation nor the
// phase, and any test that merely finds *a* progressbar passes against
// it. The `<Text>` beside each bar ("Restoring…", "Preparing download…")
// is not associated with it and never reaches the accessible name.
//
// Four bars across the two screens, four phases, four different answers.
// These tests pin the name each phase exposes.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: '1786663613.9425' } ),
	Link: ( { children, to, ...rest }: { children: React.ReactNode; to: string } ) => (
		<a href={ to } { ...rest }>
			{ children }
		</a>
	),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const REWIND_ID = '1786663613.9425';
const RESTORE_ID = 912682;
const DOWNLOAD_ID = 5150;

const SETTLE = { timeout: 10000 };

/**
 * A restore-status payload in the shape the bridge projects.
 *
 * @param over - Fields to override.
 * @return The payload.
 */
function restoreStatus( over: Record< string, unknown > = {} ) {
	return {
		id: RESTORE_ID,
		status: 'running',
		progress: 42,
		rewind_id: REWIND_ID,
		error_code: '',
		message: '',
		...over,
	};
}

/**
 * Route every request by path, leaving the caller only the two answers
 * that vary between these cases.
 *
 * @param options          - Overrides.
 * @param options.initiate - What the initiate POST does.
 * @param options.status   - What a status poll does.
 */
function arrange( {
	initiate = () => Promise.resolve< unknown >( { id: RESTORE_ID, rewind_id: REWIND_ID } ),
	status = () => Promise.resolve< unknown >( restoreStatus() ),
}: {
	initiate?: () => Promise< unknown >;
	status?: () => Promise< unknown >;
} = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string; method?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( options?.method === 'POST' ) {
			return initiate();
		}
		if ( path.includes( '/status' ) ) {
			return status();
		}
		// The restores collection, read before every restore and again
		// while one is still missing its id. Empty: nothing is running.
		return Promise.resolve( [] );
	} );
}

/**
 * Submit the default six-of-six checklist on whichever screen is
 * rendered.
 *
 * @param name - The submit button's accessible name.
 */
async function submit( name: RegExp ) {
	await userEvent.click( await screen.findByRole( 'button', { name }, SETTLE ) );
}

/**
 * The progress bar carrying the given accessible name.
 *
 * `findByRole` and not a text query: the name is what a screen reader is
 * handed, and it lives in an attribute no text query can see.
 *
 * @param name - The expected accessible name.
 * @return The progress bar.
 */
async function progressBarNamed( name: string ) {
	return screen.findByRole( 'progressbar', { name }, SETTLE );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'the Restore screen', () => {
	// Accepted, nothing to report yet. Indeterminate, so the name is the
	// only thing carrying meaning — there is not even a percentage.
	it( 'names the wait while the restore is queued', async () => {
		arrange( { status: () => Promise.resolve( restoreStatus( { status: 'queued' } ) ) } );
		render( <RestoreStage /> );

		await submit( /Confirm restore/ );

		const bar = await progressBarNamed( 'Waiting for your restore to begin' );
		expect( bar ).toBeInTheDocument();
	} );

	it( 'names the restore itself once it is running', async () => {
		arrange( { status: () => Promise.resolve( restoreStatus( { status: 'running' } ) ) } );
		render( <RestoreStage /> );

		await submit( /Confirm restore/ );

		const bar = await progressBarNamed( 'Restoring your site' );
		expect( bar ).toBeInTheDocument();
	} );

	// A submission whose answer never arrived: the recovery poll is
	// looking for the restore, and the bar is measuring that search
	// rather than the restore, so it must not claim one is under way.
	it( 'names the search when the submission went unanswered', async () => {
		arrange( { initiate: () => Promise.reject( new Error( 'Gateway timeout.' ) ) } );
		render( <RestoreStage /> );

		await submit( /Confirm restore/ );

		const bar = await progressBarNamed( 'Checking whether your restore started' );
		expect( bar ).toBeInTheDocument();
	} );
} );

describe( 'the Download screen', () => {
	// "Preparing", not "downloading": the bar measures WordPress.com
	// building the archive, which finishes before any file is fetched.
	it( 'names the archive being prepared', async () => {
		arrange( {
			initiate: () => Promise.resolve( { id: DOWNLOAD_ID } ),
			status: () =>
				Promise.resolve( {
					id: DOWNLOAD_ID,
					status: 'running',
					progress: 63,
					url: '',
					valid_until: '',
					error: '',
				} ),
		} );
		render( <DownloadStage /> );

		await submit( /Generate download/ );

		const bar = await progressBarNamed( 'Preparing your download' );
		expect( bar ).toBeInTheDocument();
	} );
} );
