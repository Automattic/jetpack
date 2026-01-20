import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../../connection-status';

// Mock the Reconnect component
jest.mock( '../../reconnect', () => ( {
	Reconnect: jest.fn( () => <div>Reconnect Component</div> ),
} ) );

describe( 'ConnectionStatus', () => {
	const mockService = {
		name: 'mockService',
	};

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
} );
