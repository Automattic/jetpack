import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import HeaderControls, { getHeaderControls } from '../';
import useAnalytics from '../../../hooks/use-analytics';
import { useConnectionState } from '../../../hooks/use-connection-state';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import type { ConnectionState } from '../../../hooks/use-connection-state';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../../hooks/use-analytics' );
jest.mock( '../../../hooks/use-connection-state' );
jest.mock( '../../../hooks/use-my-jetpack-connection' );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getMyJetpackUrl: ( section = '' ) => `admin.php?page=my-jetpack${ section }`,
} ) );
jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionErrorDetails: () => null,
	getUserConnectionUrl: () => 'https://example.com/connect-user',
	ManageConnectionDialog: () => null,
	useConnectionErrorNotice: () => ( {
		actions: [ { label: 'Restore connection', onClick: jest.fn() } ],
		errorGroups: [],
		showSupportLink: false,
		connectionErrorMessage: '',
	} ),
} ) );

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
		[ 'off', { headerControls: false } ],
		[ 'missing, as from an older My Jetpack', {} ],
	] )( 'returns null while the flag is %s', ( _, flags ) => {
		setPageState( flags );

		expect( getHeaderControls() ).toBeNull();
	} );

	it( 'returns the controls once the flag is on', () => {
		setPageState( { headerControls: true } );
		render( <>{ getHeaderControls() }</> );

		expect( screen.getByRole( 'button', { name: /^Connection:/ } ) ).toBeInTheDocument();
	} );
} );

describe( 'HeaderControls', () => {
	it.each( [
		[ 'CONNECT_USER', 'link', 'Connect my account' ],
		[ 'CONNECT_SITE', 'link', 'Connect site' ],
		[ 'REPAIR', 'button', 'Restore connection' ],
	] as const )( 'offers the %s action', async ( action, role, name ) => {
		mockUseConnectionState.mockReturnValue( stateWith( { action, status: 'warning' } ) );
		render( <HeaderControls /> );

		const dialog = await openControl();

		expect( dialog ).toContainElement( screen.getByRole( role, { name } ) );
	} );

	it( 'offers no action in Safe Mode', async () => {
		mockUseConnectionState.mockReturnValue(
			stateWith( { id: 'safe-mode', action: 'RESOLVE_SAFE_MODE', status: 'warning' } )
		);
		render( <HeaderControls /> );

		const dialog = await openControl();

		expect( within( dialog ).queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( within( dialog ).queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'loads the plan once, on first open', async () => {
		render( <HeaderControls /> );

		expect( mockApiFetch ).not.toHaveBeenCalled();

		await openControl();
		await expect( screen.findByText( /Jetpack Essentials/ ) ).resolves.toBeInTheDocument();
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		await openControl();

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
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
		render( <HeaderControls /> );

		await openControl();
		await userEvent.click( await screen.findByRole( 'link', { name: /Manage your plan/ } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_plans_manage_click', {
			location: 'header',
		} );
	} );
} );
