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
		display_name: 'mockDisplay',
	};

	beforeEach( () => {
		setup();
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the Reconnect link with correct label', () => {
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );
		expect( screen.getByRole( 'link' ) ).toHaveTextContent( 'Reconnect' );
	} );

	test( 'disables the link when isDisconnecting is true', () => {
		setup( { getDeletingConnections: [ mockConnection.connection_id ] } );
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		const link = screen.getByRole( 'link' );
		expect( link ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( link ).toHaveTextContent( 'Disconnecting…' );
	} );

	test( 'calls deleteConnectionById and requestAccess on link click', async () => {
		const { stubDeleteConnectionById } = setup();
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		await userEvent.click( screen.getByRole( 'link' ) );

		expect( stubDeleteConnectionById ).toHaveBeenCalledWith( {
			connectionId: mockConnection.connection_id,
			showSuccessNotice: false,
		} );

		expect( useRequestAccess ).toHaveBeenCalled();
	} );

	test( 'does not render the link if connection cannot be disconnected', () => {
		setup( { canUserManageConnection: false } );
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
