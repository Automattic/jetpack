// An empty category checklist must never submit.
//
// This is a safety guard, not a politeness one, and the reason is
// counter-intuitive enough to be worth stating where the tests live.
//
// WPCOM reads an *absent* `types` as "all six categories" — the wpcom
// contract's words are "omit it for everything". The client omits the key
// when nothing is ticked, and both bridges drop it from the upstream body
// when it names nothing. So unticking every box did not ask for nothing:
// on the Download screen it asked for the full archive, and on the
// Restore screen it asked for a full destructive restore of precisely the
// categories the reader had just deselected.
//
// The comments in the tree said the opposite ("an empty `types` asks
// WPCOM for a download containing nothing"), which is how it survived
// review — the code read as safe while behaving the other way. That
// belief was true against the v1 route; the v2 restore route added in
// A1/A2 rejects a supplied-but-empty `types` outright, which pushed the
// client toward omitting the key, and omission is the "everything"
// sentinel. Fixing one side moved the danger to the other.

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
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const SETTLE = { timeout: 10000 };

/** Every box in the shared checklist, by its accessible name. */
const ITEM_LABELS = [
	'WordPress themes',
	'WordPress plugins',
	'WordPress root',
	'WP-content directory',
	'Site database',
	'Media uploads',
];

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		return Promise.resolve( {} );
	} );
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

/**
 * Untick every category. The checklist starts with all six selected, so
 * this is the state a reader reaches by deliberately clearing the list.
 */
async function untickEverything() {
	for ( const label of ITEM_LABELS ) {
		await userEvent.click( await screen.findByRole( 'checkbox', { name: label }, SETTLE ) );
	}
}

/**
 * Every POST the dashboard issued. The mutations are the only POSTs
 * either screen makes, so an empty list here means nothing was submitted.
 *
 * @return The matching apiFetch option objects.
 */
function postCalls() {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => options as { method?: string } | undefined )
		.filter( options => options?.method === 'POST' );
}

/**
 * `@wordpress/ui`'s Button marks a disabled control with `aria-disabled`
 * rather than the native attribute, so it stays focusable and a screen
 * reader still reaches it. `toBeDisabled()` only reads the native one.
 *
 * @param name - Accessible name of the button.
 * @return The button element.
 */
function button( name: RegExp ) {
	return screen.getByRole( 'button', { name } );
}

describe( 'Download screen with nothing selected', () => {
	it( 'says what is wrong instead of leaving the button armed', async () => {
		render( <DownloadStage /> );
		await untickEverything();

		expect( screen.getByText( 'Select at least one item to download.' ) ).toBeInTheDocument();
		expect( button( /Generate download/ ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'issues no request when the button is clicked anyway', async () => {
		render( <DownloadStage /> );
		await untickEverything();

		await userEvent.click( button( /Generate download/ ) );

		expect( postCalls() ).toHaveLength( 0 );
		// Nothing was submitted *and* nothing was attempted: the request
		// layer's own refusal would have surfaced as an error phase, so its
		// absence is what proves the button itself is inert. Both guards
		// are wanted, but the reader should never reach the second one.
		expect( screen.queryByText( /Select at least one item to continue/ ) ).not.toBeInTheDocument();
	} );

	it( 're-arms as soon as one category comes back', async () => {
		render( <DownloadStage /> );
		await untickEverything();
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Site database' } ) );

		expect( screen.queryByText( 'Select at least one item to download.' ) ).not.toBeInTheDocument();
		expect( button( /Generate download/ ) ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );

describe( 'Restore screen with nothing selected', () => {
	// The destructive half. An unticked restore that reached WPCOM would
	// overwrite the live site with everything the reader excluded.
	it( 'says what is wrong instead of leaving the button armed', async () => {
		render( <RestoreStage /> );
		await untickEverything();

		expect( screen.getByText( 'Select at least one item to restore.' ) ).toBeInTheDocument();
		expect( button( /Confirm restore/ ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'issues no request when the button is clicked anyway', async () => {
		render( <RestoreStage /> );
		await untickEverything();

		await userEvent.click( button( /Confirm restore/ ) );

		expect( postCalls() ).toHaveLength( 0 );
		expect( screen.queryByText( /Select at least one item to continue/ ) ).not.toBeInTheDocument();
	} );
} );
