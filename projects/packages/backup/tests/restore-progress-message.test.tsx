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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as RestoreStage } from '../routes/restore/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const RESTORE_ID = 912682;
const REWIND_ID = '1786663613.9425';

/**
 * Answer capabilities and the initiate POST, then let the status poll
 * report the given progress and message.
 *
 * @param progress - The `progress` field the status poll reports.
 * @param message  - The `message` field the status poll reports.
 * @param status   - The `status` field the status poll reports.
 */
function arrange( progress: number, message: string, status = 'running' ) {
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
				status,
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
	await userEvent.click( await screen.findByRole( 'button', { name: /Confirm restore/ } ) );
}

describe( 'the Restore screen during a running restore', () => {
	it( 'shows the upstream message as a sign of life', async () => {
		arrange( 0, 'Checking remote files: 22396' );
		render( <RestoreStage /> );

		await startRestore();

		await expect(
			screen.findByText( 'Checking remote files: 22396' )
		).resolves.toBeInTheDocument();
	} );

	// One region for the whole screen, mounted before the phase changes: a live
	// region that arrives together with its text is missed by screen readers.
	// Exact text, so the region cannot widen to the per-poll percentage.
	it.each( [
		[ 'running', 0, /^Restoring from backup…$/ ],
		[ 'finished', 100, /^Restore complete\.$/ ],
		[ 'finished-with-errors', 100, /^Restore finished with errors$/ ],
	] )(
		'announces a restore that is %s in the region that was already there',
		async ( status, progress, title ) => {
			arrange( progress, 'Checking remote files: 22396', status );
			render( <RestoreStage /> );

			// Past the initial check, so the region is idle-empty. It is the first
			// `status`; the selection hint comes after it.
			await expect(
				screen.findByRole( 'button', { name: /Confirm restore/ } )
			).resolves.toBeVisible();
			const region = screen.getAllByRole( 'status' )[ 0 ];
			expect( region ).toBeEmptyDOMElement();

			await startRestore();

			await waitFor( () => expect( region ).toHaveTextContent( title ) );
			expect( screen.getAllByRole( 'status' ) ).toEqual( [ region ] );
		}
	);

	// Both figures, so a hardcoded `0%` cannot pass: the preflight pins it at
	// zero, but the readout has to track the real value once it moves.
	it.each( [ 0, 42 ] )( 'reports %i%% complete beside the bar', async percent => {
		arrange( percent, 'Checking remote files: 22396' );
		render( <RestoreStage /> );

		await startRestore();

		await expect( screen.findByText( `${ percent }% complete` ) ).resolves.toBeInTheDocument();
	} );
} );
