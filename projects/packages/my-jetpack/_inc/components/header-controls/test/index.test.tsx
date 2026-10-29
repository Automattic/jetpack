import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import HeaderControls, { getHeaderControls } from '../';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../../data/constants';
import { getSimpleQueryKey } from '../../../data/use-simple-query';
import useAnalytics from '../../../hooks/use-analytics';
import { useConnectionState } from '../../../hooks/use-connection-state';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { getHeaderControlsSlot } from '../slot';
import type { ConnectionState } from '../../../hooks/use-connection-state';
import type { ReactElement } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../../hooks/use-analytics' );
jest.mock( '../../../hooks/use-connection-state' );
jest.mock( '../../../hooks/use-my-jetpack-connection' );
jest.mock( '../../../data/notices/use-fetching-error-notice', () => ( {
	useFetchingErrorNotice: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getMyJetpackUrl: ( section = '' ) => `admin.php?page=my-jetpack${ section }`,
} ) );
const mockRestoreConnectionError = { current: '' };
const mockManageConnectionDialog = jest.fn();
const mockUseConnectionErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionErrorDetails: () => null,
	getReconnectErrorMessage: ( error: string ) =>
		`There was an error reconnecting Jetpack. Error: ${ error }`,
	getUserConnectionUrl: () => 'https://example.com/connect-user',
	ManageConnectionDialog: ( props: { isOpen: boolean; onClose: () => void } ) => {
		mockManageConnectionDialog( props );
		return props.isOpen ? (
			<button type="button" onClick={ props.onClose }>
				Close dialog
			</button>
		) : null;
	},
	useConnectionErrorNotice: ( args: unknown ) => {
		mockUseConnectionErrorNotice( args );
		return {
			actions: [ { label: 'Restore connection', onClick: jest.fn() } ],
			errorGroups: [],
			showSupportLink: false,
			connectionErrorMessage: '',
			restoreConnectionError: mockRestoreConnectionError.current,
		};
	},
} ) );

const render = ( ui: ReactElement, queryClient = new QueryClient() ) =>
	rtlRender( ui, {
		wrapper: ( { children } ) => (
			<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
		),
	} );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;
const mockRecordEvent = jest.fn();
const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;
const mockUseConnectionState = useConnectionState as jest.MockedFunction<
	typeof useConnectionState
>;
const mockUseMyJetpackConnection = useMyJetpackConnection as jest.MockedFunction<
	typeof useMyJetpackConnection
>;

const stateWith = ( overrides: Partial< ConnectionState > ): ConnectionState => ( {
	id: 'connected',
	label: 'Site and account connected',
	status: 'success',
	manageConnection: null,
	...overrides,
} );

const setPageState = ( myJetpackFlags: Record< string, boolean > = {} ) => {
	window.myJetpackInitialState = {
		userIsAdmin: false,
		myJetpackFlags,
	} as unknown as typeof window.myJetpackInitialState;
};

const openControl = async () => {
	await userEvent.click( screen.getByRole( 'button', { name: /^Connection:/ } ) );
	return screen.findByRole( 'dialog' );
};

beforeEach( () => {
	jest.clearAllMocks();
	setPageState();
	mockApiFetch.mockResolvedValue( [] );
	mockUseAnalytics.mockReturnValue( { recordEvent: mockRecordEvent } );
	mockUseConnectionState.mockReturnValue( stateWith( {} ) );
	mockUseMyJetpackConnection.mockReturnValue( {
		isSiteConnected: true,
		userConnectionData: {},
	} as ReturnType< typeof useMyJetpackConnection > );
} );

describe( 'getHeaderControls', () => {
	it.each( [
		[ 'getHeaderControls', 'off', getHeaderControls, { headerControls: false } ],
		[
			'getHeaderControlsSlot',
			'off',
			() => getHeaderControlsSlot( 'boost' ),
			{ headerControls: false },
		],
		[ 'getHeaderControls', 'missing, as from an older My Jetpack', getHeaderControls, {} ],
	] )( '%s returns null while the flag is %s', ( _, __, getter, flags ) => {
		setPageState( flags );

		expect( getter() ).toBeNull();
	} );

	it( 'returns the controls once the flag is on, reporting My Jetpack as the page', () => {
		setPageState( { headerControls: true } );
		render( <>{ getHeaderControls() }</> );

		expect( screen.getByRole( 'button', { name: /^Connection:/ } ) ).toBeInTheDocument();
		expect( mockUseConnectionErrorNotice ).toHaveBeenCalledWith(
			expect.objectContaining( { trackingContext: 'my-jetpack' } )
		);
	} );
} );

describe( 'HeaderControls', () => {
	it.each( [
		[ 'CONNECT_USER', 'link', 'Connect my account' ],
		[ 'CONNECT_SITE', 'link', 'Connect site' ],
		[ 'REPAIR', 'button', 'Restore connection' ],
	] as const )( 'offers the %s action', async ( action, role, name ) => {
		mockUseConnectionState.mockReturnValue( stateWith( { action, status: 'warning' } ) );
		render( <HeaderControls trackingContext="my-jetpack" /> );

		const dialog = await openControl();

		expect( dialog ).toContainElement( screen.getByRole( role, { name } ) );
	} );

	it( 'offers no action in Safe Mode', async () => {
		mockUseConnectionState.mockReturnValue(
			stateWith( { id: 'safe-mode', action: 'RESOLVE_SAFE_MODE', status: 'warning' } )
		);
		render( <HeaderControls trackingContext="my-jetpack" /> );

		const dialog = await openControl();

		expect( within( dialog ).queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( within( dialog ).queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( "shows why restoring the connection failed, as the Overview's card does", async () => {
		mockRestoreConnectionError.current = 'timed out';
		mockUseConnectionState.mockReturnValue(
			stateWith( { action: 'REPAIR', status: 'error', isDiagnosis: true } )
		);
		render( <HeaderControls trackingContext="my-jetpack" /> );

		const dialog = await openControl();
		mockRestoreConnectionError.current = '';

		expect(
			within( dialog ).getByText( 'There was an error reconnecting Jetpack. Error: timed out' )
		).toBeInTheDocument();
	} );

	it( 'returns focus to the control when the Manage connection dialog closes', async () => {
		mockUseConnectionState.mockReturnValue( stateWith( { manageConnection: { type: 'dialog' } } ) );
		render( <HeaderControls trackingContext="my-jetpack" /> );

		const dialog = await openControl();
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Manage connection' } ) );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Close dialog' } ) );

		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: /^Connection:/ } ) ).toHaveFocus()
		);
	} );

	it( "tags its connection Tracks events with the host page and the header's placement", async () => {
		mockUseConnectionState.mockReturnValue( stateWith( { manageConnection: { type: 'dialog' } } ) );
		render( <HeaderControls trackingContext="boost" /> );

		const dialog = await openControl();
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Manage connection' } ) );

		expect( mockUseConnectionErrorNotice ).toHaveBeenCalledWith(
			expect.objectContaining( {
				trackingCallback: expect.any( Function ),
				trackingContext: 'boost',
				trackingPlacement: 'header',
			} )
		);
		expect( mockManageConnectionDialog ).toHaveBeenCalledWith(
			expect.objectContaining( { isOpen: true, context: 'boost', placement: 'header' } )
		);
	} );

	it( 'loads the plan once, on first open', async () => {
		render( <HeaderControls trackingContext="my-jetpack" /> );

		expect( mockApiFetch ).not.toHaveBeenCalled();

		await openControl();
		await expect( screen.findByText( /Jetpack Essentials/ ) ).resolves.toBeInTheDocument();
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		await openControl();

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reuses purchases the page has already loaded', async () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(
			getSimpleQueryKey( {
				name: QUERY_PURCHASES_KEY,
				query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
			} ),
			[]
		);
		render( <HeaderControls trackingContext="my-jetpack" />, queryClient );

		await openControl();

		await expect( screen.findByText( /Jetpack Essentials/ ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( "tags the plan links' Tracks events as from the header", async () => {
		window.myJetpackInitialState = {
			userIsAdmin: true,
			myJetpackFlags: {},
			lifecycleStats: { isSiteConnected: true, isUserConnected: true },
		} as unknown as typeof window.myJetpackInitialState;
		mockApiFetch.mockResolvedValue( [
			{
				ID: 1,
				product_name: 'Jetpack Search',
				product_slug: 'jetpack_search',
				expiry_date: null,
				expiry_status: 'active',
				subscribed_date: '2025-11-05T00:00:00+00:00',
				domain: 'example.com',
			},
		] );
		render( <HeaderControls trackingContext="my-jetpack" /> );

		await openControl();
		await userEvent.click( await screen.findByRole( 'link', { name: /Manage your plan/ } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_plans_manage_click', {
			location: 'header',
		} );
	} );

	it.each( [
		[ 'jetpack_search', 1 ],
		[ 'jetpack_complete', 0 ],
	] )( 'offers to purchase a plan to a site with %s: %d link', async ( productSlug, links ) => {
		window.myJetpackInitialState = {
			userIsAdmin: true,
			myJetpackFlags: {},
			lifecycleStats: { isSiteConnected: true, isUserConnected: true },
		} as unknown as typeof window.myJetpackInitialState;
		mockApiFetch.mockResolvedValue( [
			{
				ID: 1,
				product_name: 'A plan',
				product_slug: productSlug,
				expiry_date: null,
				expiry_status: 'active',
				subscribed_date: '2025-11-05T00:00:00+00:00',
				domain: 'example.com',
			},
		] );
		render( <HeaderControls trackingContext="my-jetpack" /> );

		await openControl();
		await expect(
			screen.findByRole( 'link', { name: /Manage your plan/ } )
		).resolves.toBeInTheDocument();
		expect( screen.queryAllByRole( 'link', { name: /Purchase a plan/ } ) ).toHaveLength( links );
	} );
} );

describe( 'header controls script', () => {
	it( "renders into the dashboard's slot once mounted, reporting the page the slot names", async () => {
		await import( '../../../header-controls-script' );
		setPageState( { headerControls: true } );
		rtlRender( <>{ getHeaderControlsSlot( 'boost' ) }</> );

		await expect(
			screen.findByRole( 'button', { name: /^Connection:/ } )
		).resolves.toBeInTheDocument();
		expect( mockUseConnectionErrorNotice ).toHaveBeenCalledWith(
			expect.objectContaining( { trackingContext: 'boost' } )
		);
	} );
} );
