const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: '1777035492' } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import Gates from '../src/dashboard/components/gates';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import type { QueryClient } from '@tanstack/react-query';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const CAPABILITIES = { hasBackupPlan: true, hasScan: false };
const CAPABILITIES_PATH = '/site/capabilities';
const SIBLING_BODY = 'sibling route body';

type QueryClientModule = { queryClient: QueryClient; keys: typeof keys };

/**
 * The copy of the data module a sibling route's bundle evaluates.
 *
 * `jest.isolateModules` stands in for wp-build's per-route bundling: without it every
 * assertion here would pass on a module-scope client, which is the bug.
 *
 * @return The sibling bundle's exports.
 */
function siblingBundle(): QueryClientModule {
	let copy!: QueryClientModule;
	jest.isolateModules( () => {
		copy = jest.requireActual< QueryClientModule >( '../src/dashboard/data/query-client' );
	} );
	return copy;
}

/**
 * How many times the capabilities route has been asked, across every render so far.
 *
 * @return The call count.
 */
function capabilitiesCalls(): number {
	return mockApiFetch.mock.calls.filter( ( [ options ] ) =>
		String( ( options as { path?: string } )?.path ?? '' ).includes( CAPABILITIES_PATH )
	).length;
}

/**
 * The gate's first-load spinner, if it is on screen.
 *
 * @return The skeleton element, or null.
 */
function skeleton(): HTMLElement | null {
	return document.querySelector( '.jpb-gates__skeleton' );
}

/**
 * Load the Overview route, wait for its capabilities read to land, then leave it.
 *
 * The unmount is the navigation: it is what a per-route client would not survive.
 *
 * @return Nothing.
 */
async function visitOverview(): Promise< void > {
	const view = render( <OverviewStage /> );
	await waitFor( () => expect( queryClient.getQueryData( keys.capabilities() ) ).toBeDefined() );
	view.unmount();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( CAPABILITIES_PATH ) ) {
			return Promise.resolve( CAPABILITIES );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path.includes( '/backups' ) ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( null );
	} );

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'one query cache across the dashboard routes', () => {
	it( 'hands every route bundle the same client', () => {
		expect( siblingBundle().queryClient ).toBe( queryClient );
	} );

	it( 'serves a sibling bundle the capabilities the first route fetched', async () => {
		await visitOverview();

		const sibling = siblingBundle();

		expect( sibling.queryClient.getQueryData( sibling.keys.capabilities() ) ).toEqual(
			CAPABILITIES
		);
	} );

	it( 'renders a sibling route past the gate with no spinner and no second request', async () => {
		await visitOverview();
		const callsAfterOverview = capabilitiesCalls();
		expect( callsAfterOverview ).toBeGreaterThan( 0 );

		render(
			<QueryClientProvider client={ siblingBundle().queryClient }>
				<Gates>
					<div>{ SIBLING_BODY }</div>
				</Gates>
			</QueryClientProvider>
		);

		expect( screen.getByText( SIBLING_BODY ) ).toBeInTheDocument();
		expect( skeleton() ).toBeNull();
		expect( capabilitiesCalls() ).toBe( callsAfterOverview );
	} );

	it( 'asks once when StrictMode remounts the route', async () => {
		render(
			<StrictMode>
				<OverviewStage />
			</StrictMode>
		);

		await waitFor( () => expect( capabilitiesCalls() ).toBeGreaterThan( 0 ) );

		expect( capabilitiesCalls() ).toBe( 1 );
	} );
} );
