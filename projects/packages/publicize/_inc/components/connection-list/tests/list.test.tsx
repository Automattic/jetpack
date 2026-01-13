import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Connection } from '../../../social-store/types';
import { ConnectionList } from '../list';

// Mock the ConnectionListItem component to simplify testing
jest.mock( '../item', () => ( {
	ConnectionListItem: ( { connection, onToggle } ) => (
		<div data-testid={ `connection-item-${ connection.connection_id }` }>
			<span>{ connection.display_name }</span>
			<button data-testid={ `toggle-${ connection.connection_id }` } onClick={ onToggle }>
				Toggle
			</button>
		</div>
	),
} ) );

describe( 'ConnectionList', () => {
	const mockConnections = [
		{
			display_name: 'User 1',
			profile_picture: 'https://example.com/avatar1.jpg',
			connection_id: '1234',
			service_name: 'tumblr',
			enabled: true,
		},
		{
			display_name: 'User 2',
			profile_picture: 'https://example.com/avatar2.jpg',
			connection_id: '5678',
			service_name: 'mastodon',
			enabled: false,
		},
	] as Connection[];

	const mockOnToggle = jest.fn();
	const mockTitle = 'Test Connections';

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the title correctly', () => {
		render(
			<ConnectionList
				connections={ mockConnections }
				onToggle={ mockOnToggle }
				title={ mockTitle }
			/>
		);

		expect( screen.getByText( mockTitle ) ).toBeInTheDocument();
	} );

	it( 'renders all connection items', () => {
		render(
			<ConnectionList
				connections={ mockConnections }
				onToggle={ mockOnToggle }
				title={ mockTitle }
			/>
		);

		// Check that all connections are rendered
		expect( screen.getByTestId( 'connection-item-1234' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'connection-item-5678' ) ).toBeInTheDocument();
	} );

	it( 'calls onToggle with correct connection ID when toggle is clicked', async () => {
		render(
			<ConnectionList
				connections={ mockConnections }
				onToggle={ mockOnToggle }
				title={ mockTitle }
			/>
		);

		// Use userEvent instead of fireEvent
		await userEvent.click( screen.getByTestId( 'toggle-1234' ) );

		// Check that onToggle was called with the correct connection ID
		expect( mockOnToggle ).toHaveBeenCalledWith( '1234' );
	} );

	it( 'renders an empty list when no connections are provided', () => {
		render( <ConnectionList connections={ [] } onToggle={ mockOnToggle } title={ mockTitle } /> );

		// Check that the title is rendered but no connection items
		expect( screen.getByText( mockTitle ) ).toBeInTheDocument();
		expect( screen.queryByTestId( /connection-item-/ ) ).not.toBeInTheDocument();
	} );
} );
