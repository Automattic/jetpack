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
import { stage as RestoreStage } from '../routes/restore/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const RESTORE_ID = 912682;
const REWIND_ID = '1786663613.9425';
const SETTLE = { timeout: 10000 };

/**
 * Answer capabilities and the initiate POST, then let the status poll
 * report the given progress and message.
 *
 * @param progress - The `progress` field the status poll reports.
 * @param message  - The `message` field the status poll reports.
 */
function arrange( progress: number, message: string ) {
	mockApiFetch.mockImplementation( ( o: { path?: string; method?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( o?.method === 'POST' ) {
			return Promise.resolve( { id: RESTORE_ID, rewind_id: REWIND_ID } );
		}
		if ( path.includes( '/status' ) ) {
			return Promise.resolve( {
				id: RESTORE_ID,
				status: 'running',
				progress,
				rewind_id: REWIND_ID,
				error_code: '',
				message,
			} );
		}
		return Promise.resolve( [] );
	} );
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

/**
 * Start a restore with the default six-of-six checklist.
 */
async function startRestore() {
	await userEvent.click( await screen.findByRole( 'button', { name: /Confirm restore/ }, SETTLE ) );
}

describe( 'the Restore screen during a running restore', () => {
	it( 'shows the upstream message as a sign of life', async () => {
		arrange( 0, 'Checking remote files: 22396' );
		render( <RestoreStage /> );

		await startRestore();

		await expect(
			screen.findByText( 'Checking remote files: 22396', undefined, SETTLE )
		).resolves.toBeInTheDocument();
	} );

	it( 'announces that the restore started, and only that line', async () => {
		arrange( 0, 'Checking remote files: 22396' );
		render( <RestoreStage /> );

		await startRestore();
		// Wait for the phase first: the idle branch's own `role="status"` is still
		// mounted, empty, until the submission settles.
		await expect(
			screen.findByText( '0% complete', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		// Exact, not `toHaveTextContent`: that matches a substring on any ancestor,
		// so it passes with the role moved onto the whole block — which is the
		// re-announce-every-poll regression this scoping exists to prevent.
		await expect( screen.findByRole( 'status', undefined, SETTLE ) ).resolves.toHaveTextContent(
			/^Restoring…$/
		);
	} );

	// Both figures, so a hardcoded `0%` cannot pass: the preflight pins it at
	// zero, but the readout has to track the real value once it moves.
	it.each( [ 0, 42 ] )( 'reports %i%% complete beside the bar', async percent => {
		arrange( percent, 'Checking remote files: 22396' );
		render( <RestoreStage /> );

		await startRestore();

		await expect(
			screen.findByText( `${ percent }% complete`, undefined, SETTLE )
		).resolves.toBeInTheDocument();
	} );
} );
