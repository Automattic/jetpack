// Regression tests for JETPACK-2243 D3.
//
// Every one of these failures used to render as an ordinary empty state.
// `useActivityLog` and `useFileTree` both computed an `error` and handed
// it back; three consumers destructured everything except that field, so
// a 5xx and "there is nothing here" produced identical output. The whole
// point of these tests is the *distinction*, so each one asserts both
// that the reason appears and that the misleading empty-state copy does
// not.

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
	useParams: () => ( { rewindId: '1777035492' } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import ErrorBoundary from '../src/dashboard/components/error-boundary';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const CAPABILITIES = { hasBackupPlan: true, hasScan: false };

/**
 * Route requests by path so one endpoint can fail while the rest answer.
 * The gates have to pass before the body — and therefore the failure
 * under test — is ever rendered.
 *
 * @param failing       - Path fragment that should reject.
 * @param error         - The rejection payload.
 * @param error.code    - Error code, as the bridges emit it.
 * @param error.message - Human-readable reason.
 */
function failOnly( failing: string, error: { code: string; message: string } ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( failing ) ) {
			return Promise.reject( error );
		}
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( CAPABILITIES );
		}
		return Promise.resolve( {} );
	} );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( CAPABILITIES );
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'activity list', () => {
	it( 'reports a failed request instead of "No results"', async () => {
		failOnly( '/site/rewindable-activity', {
			code: 'activity_log_fetch_failed',
			message: 'Service unavailable',
		} );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We couldn't load your site's activity." )
		).resolves.toBeInTheDocument();
		// The upstream reason is the only part a support agent can act on.
		expect( screen.getByText( 'Service unavailable' ) ).toBeInTheDocument();
		// The regression: a 5xx telling the reader their site has no activity.
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
	} );

	it( 'still shows the plain empty state when the request simply returns nothing', async () => {
		// Same rendered path, opposite cause — proves the new branch is
		// keyed on the error and not on emptiness.
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( CAPABILITIES );
			}
			return Promise.resolve( { current: { orderedItems: [] }, totalItems: 0, totalPages: 0 } );
		} );

		render( <OverviewStage /> );

		await expect( screen.findByText( 'No results' ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( "We couldn't load your site's activity." )
		).not.toBeInTheDocument();
	} );
} );

describe( 'ErrorBoundary', () => {
	/**
	 * Stands in for the known real hazard: `toFileNode` raising
	 * `RangeError: Invalid time value` on a malformed manifest timestamp,
	 * inside a `useMemo` on the render path.
	 */
	function Exploding(): never {
		throw new Error( 'Invalid time value' );
	}

	it( 'replaces a crashed subtree with a recoverable message', () => {
		render(
			<ErrorBoundary>
				<Exploding />
			</ErrorBoundary>
		);

		expect( screen.getByText( 'Something went wrong' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Invalid time value' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Reload the page' } ) ).toBeInTheDocument();
		// React logs the caught error, and so does componentDidCatch —
		// @wordpress/jest-console fails the test unless that is claimed.
		expect( console ).toHaveErrored();
	} );

	it( 'renders children untouched when nothing throws', () => {
		render(
			<ErrorBoundary>
				<p>All good</p>
			</ErrorBoundary>
		);

		expect( screen.getByText( 'All good' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Something went wrong' ) ).not.toBeInTheDocument();
	} );
} );
