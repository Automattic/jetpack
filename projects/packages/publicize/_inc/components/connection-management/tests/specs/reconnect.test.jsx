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

	test( 'shows a non-interactive Reconnecting… label while a reconnect is in progress', async () => {
		// A resolved-true requestAccess means the popup opened, so the busy state sticks.
		useRequestAccess.mockReturnValue( jest.fn().mockResolvedValue( true ) );
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		await userEvent.click( screen.getByRole( 'link' ) );

		await expect( screen.findByText( 'Reconnecting…' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'reconnects in place without disconnecting first', async () => {
		const requestAccess = jest.fn().mockResolvedValue( true );
		useRequestAccess.mockReturnValue( requestAccess );
		const { stubDeleteConnectionById } = setup();
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		await userEvent.click( screen.getByRole( 'link' ) );

		expect( stubDeleteConnectionById ).not.toHaveBeenCalled();
		expect( requestAccess ).toHaveBeenCalled();
	} );

	test( 'does not render the link if connection cannot be disconnected', () => {
		setup( { canUserManageConnection: false } );
		render( <Reconnect connection={ mockConnection } service={ mockService } /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
