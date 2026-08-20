// A restore we can no longer see must not offer to start another one.
//
// The state machine reports two situations the reader cannot act on: the
// silence deadline passing, and the status poll failing after the restore
// was accepted. Both mean the same thing — WordPress.com took the
// restore, it is very likely still running, and we have lost sight of it.
//
// Both used to land in the generic `error` phase, whose branch renders a
// "Try again" button that resets the screen to an armed "Confirm
// restore". So the only control beneath *"It may still be running —
// you'll get an email when it finishes"* was one that starts a second
// concurrent restore of the same site. Nothing upstream is known to
// refuse that: `queue_restore()` calls `site_queue_rewind()` directly and
// no in-flight check is visible from either repo.
//
// The rule these tests pin: a retry is offered only when we know nothing
// is running.

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

const SETTLE = { timeout: 10000 };

const RESTORE_ID = 912682;

/**
 * Answer capabilities and the initiate POST, then let the status poll do
 * whatever the case under test needs.
 *
 * @param status - What each status poll does.
 */
function arrange( status: () => Promise< unknown > ) {
	mockApiFetch.mockImplementation( ( o: { path?: string; method?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( o?.method === 'POST' ) {
			return Promise.resolve( { id: RESTORE_ID, rewind_id: '1786663613.9425' } );
		}
		if ( path.includes( '/status' ) ) {
			return status();
		}
		return Promise.resolve( {} );
	} );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

/**
 * Wait for the lost-track message.
 *
 * `findAllBy` rather than `findBy`: `Notice` mirrors its content into
 * `@wordpress/a11y`'s live region, so the text is legitimately in the
 * document twice and a single-match query throws.
 */
async function findMessage() {
	await expect(
		screen.findAllByText( /We've lost track of this restore/, undefined, SETTLE )
	).resolves.not.toHaveLength( 0 );
}

/**
 * Start a restore with the default six-of-six checklist.
 */
async function startRestore() {
	await userEvent.click( await screen.findByRole( 'button', { name: /Confirm restore/ }, SETTLE ) );
}

describe( 'a restore that has gone out of sight', () => {
	it( 'offers a way out, not a way to start another one', async () => {
		arrange( () => Promise.reject( new Error( 'Could not reach WordPress.com.' ) ) );
		render( <RestoreStage /> );

		await startRestore();

		await findMessage();

		// The whole point. Either control would start a second restore:
		// "Try again" resets to an armed Confirm, and Confirm submits.
		expect( screen.queryByRole( 'button', { name: /Try again/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Confirm restore/ } ) ).not.toBeInTheDocument();
		// Not merely the button: the whole form is gone, so there is
		// nothing left on screen that could submit.
		expect(
			screen.queryByRole( 'checkbox', { name: 'WordPress themes' } )
		).not.toBeInTheDocument();

		// Two: the back link that sits above the card on every phase, and
		// the one this branch renders where "Try again" used to be. The
		// count is what pins the second one.
		expect( screen.getAllByRole( 'link', { name: /Back to overview/ } ) ).toHaveLength( 2 );
	} );

	it( 'reports why it lost sight, beneath the message rather than instead of it', async () => {
		arrange( () => Promise.reject( new Error( 'Could not reach WordPress.com.' ) ) );
		render( <RestoreStage /> );

		await startRestore();

		await findMessage();
		expect( screen.getByText( 'Could not reach WordPress.com.' ) ).toBeInTheDocument();
	} );

	// Not an error notice: we have no evidence the restore failed, only
	// that we cannot see it, and red would assert a failure we cannot
	// observe. Asserted through the status label `Notice` renders
	// visually-hidden — what a screen reader is actually told — rather
	// than through its `is-warning` class, which is that package's
	// implementation detail rather than a contract.
	it( 'warns rather than reporting a failure', async () => {
		arrange( () => Promise.reject( new Error( 'Could not reach WordPress.com.' ) ) );
		render( <RestoreStage /> );

		await startRestore();
		await findMessage();

		expect( screen.getByText( 'Warning notice' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Error notice' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'a restore that definitely is not running', () => {
	// The other side of the rule: when the restore reached a terminal
	// failure there is nothing in flight, so a retry is the right offer.
	it( 'still offers Try again when the restore failed', async () => {
		arrange( () =>
			Promise.resolve( {
				id: RESTORE_ID,
				status: 'failed',
				progress: 0,
				rewind_id: '1786663613.9425',
				error_code: '',
				message: 'Restore aborted.',
			} )
		);
		render( <RestoreStage /> );

		await startRestore();

		// `findAllBy` for the same reason as `findMessage`: `Notice` mirrors
		// its text into the live region.
		await expect(
			screen.findAllByText( 'Restore aborted.', undefined, SETTLE )
		).resolves.not.toHaveLength( 0 );
		expect( screen.getByRole( 'button', { name: /Try again/ } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Error notice' ) ).toBeInTheDocument();
	} );
} );
