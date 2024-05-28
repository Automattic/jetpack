import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setup } from '../../../../utils/test-factory';
import { useRequestAccess } from '../../../services/use-request-access';
import { Reconnect } from '../../reconnect';

// Mock the useRequestAccess hook
jest.mock( '../../../services/use-request-access', () => ( {
	useRequestAccess: jest.fn( () => jest.fn() ),
} ) );

describe( 'Reconnect', () => {
	const mockService = {
		ID: 'mockService',
		name: 'Mock Service',
	};

	const mockConnection = {
		connection_id: '123',
		can_disconnect: true,
		external_display: 'mockDisplay',
	};

	beforeEach( () => {
		setup();
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the Reconnect button with correct label', () => {
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Reconnect' );
	} );

	test( 'disables the button when isDisconnecting is true', () => {
		setup( { getDeletingConnections: [ mockConnection.connection_id ] } );
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		const button = screen.getByRole( 'button' );
		expect( button ).toBeDisabled();
		expect( button ).toHaveTextContent( 'Disconnecting…' );
	} );

	test( 'calls deleteConnectionById and requestAccess on button click', async () => {
		const { stubDeleteConnectionById } = setup();
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		await userEvent.click( screen.getByRole( 'button' ) );

		expect( stubDeleteConnectionById ).toHaveBeenCalledWith( {
			connectionId: mockConnection.connection_id,
			showSuccessNotice: false,
		} );

		expect( useRequestAccess ).toHaveBeenCalled();
	} );

	test( 'does not render the button if connection cannot be disconnected', () => {
		const nonDisconnectableConnection = {
			...mockConnection,
			can_disconnect: false,
		};

		render( <Reconnect connection={ nonDisconnectableConnection } service={ mockService } /> );

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );
