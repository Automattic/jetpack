// Render tests for the three wp-build route stages.
//
// These exist because the whole suite passed while the dashboard threw
// "No QueryClient set, use QueryClientProvider to set one" on load: the
// screens call React Query hooks in their own bodies, and React runs a
// component's hooks before it renders that component's children, so a
// provider mounted by `<DashboardLayout>` was never in scope.
//
// The one rule that keeps these tests honest: `@tanstack/react-query`
// must NOT be mocked. A stubbed-out QueryClientProvider would make the
// bug invisible again. Only the network (`apiFetch`) and the router
// (`@wordpress/route`) are faked.

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
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

/**
 * Point `useConnection`'s global at a given connection shape.
 *
 * @param connectionStatus - The `connectionStatus` payload PHP would emit.
 */
function setConnection( connectionStatus: Record< string, boolean > ) {
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
}

beforeEach( () => {
	// The client is a module singleton, so cached capabilities would
	// otherwise leak from one test into the next.
	queryClient.clear();
	// Retries would make the error test wait out react-query's backoff;
	// retry behaviour isn't what these tests are about.
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( { hasBackupPlan: true, hasScan: false } );
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	setConnection( CONNECTED );
} );

describe( 'route stages mount their screens with a QueryClient in scope', () => {
	it( 'renders the Overview stage', async () => {
		render( <OverviewStage /> );

		await expect( screen.findByText( 'VaultPress Backup' ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders the Download stage', async () => {
		render( <DownloadStage /> );

		await expect( screen.findByText( 'Download backup' ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders the Restore stage', async () => {
		render( <RestoreStage /> );

		await expect( screen.findByText( 'Restore backup' ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'Gates', () => {
	it( 'shows the error screen — not the upsell — when capabilities fails', async () => {
		mockApiFetch.mockRejectedValue( {
			code: 'http_request_failed',
			message: 'Service unavailable',
		} );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We couldn't load your backup details" )
		).resolves.toBeInTheDocument();
		// The regression: an entitled site being told it has no plan
		// because the request to find out failed.
		expect(
			screen.queryByText( "This site doesn't have an active Backup plan" )
		).not.toBeInTheDocument();
	} );

	it( 'shows the upsell when the site genuinely has no plan', async () => {
		mockApiFetch.mockResolvedValue( { hasBackupPlan: false, hasScan: false } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "This site doesn't have an active Backup plan" )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the not-connected screen without asking WPCOM anything', async () => {
		setConnection( { isRegistered: false, hasConnectedOwner: false, isUserConnected: false } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Connect Jetpack to get started' )
		).resolves.toBeInTheDocument();
		// The connection state is synchronous, so there is never a reason
		// to spin on a capabilities request the bridge would 403 anyway.
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the account-linking screen for a secondary admin, without asking WPCOM', async () => {
		setConnection( { isRegistered: true, hasConnectedOwner: true, isUserConnected: false } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Link your account to view backups' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
