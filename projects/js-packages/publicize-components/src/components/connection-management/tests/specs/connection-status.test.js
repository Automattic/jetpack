import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../../connection-status';

// Mock the Reconnect component
jest.mock( '../../reconnect', () => ( {
	Reconnect: jest.fn( () => <div>Reconnect Component</div> ),
} ) );

describe( 'ConnectionStatus', () => {
	const mockConnection = {
		status: 'error',
	};

	const mockService = {
		name: 'mockService',
	};

	const mockOnConfirmReconnect = jest.fn();

	test( 'renders nothing when connection status is "ok"', () => {
		render( <ConnectionStatus connection={ { status: 'ok' } } service={ mockService } /> );
		expect(
			screen.queryByText( 'There is an issue with this connection.' )
		).not.toBeInTheDocument();
	} );

	test( 'renders nothing when connection status is undefined', () => {
		render( <ConnectionStatus connection={ { status: undefined } } service={ mockService } /> );
		expect(
			screen.queryByText( 'There is an issue with this connection.' )
		).not.toBeInTheDocument();
	} );

	test( 'renders the appropriate notice and Reconnect component when connection status is not "ok" or undefined', () => {
		render(
			<ConnectionStatus
				connection={ mockConnection }
				service={ mockService }
				onConfirmReconnect={ mockOnConfirmReconnect }
			/>
		);
		expect( screen.getByText( 'There is an issue with this connection.' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Reconnect Component' ) ).toBeInTheDocument();
	} );

	test( 'renders the correct notice when connection status is "refresh-failed"', () => {
		render(
			<ConnectionStatus connection={ { status: 'refresh-failed' } } service={ mockService } />
		);
		expect( screen.getByText( 'The connection seems to have expired.' ) ).toBeInTheDocument();
	} );
} );
