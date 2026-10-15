import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import HeaderControls from '../';
import { useConnectionState } from '../../../hooks/use-connection-state';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import type { ConnectionState } from '../../../hooks/use-connection-state';

jest.mock( '@wordpress/api-fetch' );
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

const openControl = async () => {
	await userEvent.click( screen.getByRole( 'button', { name: /^Connection:/ } ) );
	return screen.findByRole( 'dialog' );
};

describe( 'HeaderControls', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.myJetpackInitialState = {
			userIsAdmin: false,
		} as unknown as typeof window.myJetpackInitialState;
		mockApiFetch.mockResolvedValue( [] );
		mockUseMyJetpackConnection.mockReturnValue( {
			isSiteConnected: true,
			userConnectionData: {},
		} as ReturnType< typeof useMyJetpackConnection > );
	} );

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
		mockUseConnectionState.mockReturnValue( stateWith( {} ) );
		render( <HeaderControls /> );

		expect( mockApiFetch ).not.toHaveBeenCalled();

		await openControl();
		await expect( screen.findByText( /Jetpack Essentials/ ) ).resolves.toBeInTheDocument();
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		await openControl();

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
