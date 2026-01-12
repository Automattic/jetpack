import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Connection } from '../../../social-store/types';
import { ConnectionListItem } from '../item';

describe( 'ConnectionListItem', () => {
	const mockConnection = {
		display_name: 'Test User',
		profile_picture: 'https://example.com/avatar.jpg',
		connection_id: '1234',
		service_name: 'tumblr',
		enabled: true,
	} as Connection;

	const mockOnToggle = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders correctly with enabled connection', () => {
		render( <ConnectionListItem connection={ mockConnection } onToggle={ mockOnToggle } /> );

		expect( screen.getByText( 'Test User' ) ).toBeInTheDocument();
		const toggleInput = screen.getByRole( 'checkbox' );
		expect( toggleInput ).toBeChecked();
	} );

	it( 'renders correctly with disabled connection', () => {
		const disabledConnection = {
			...mockConnection,
			enabled: false,
		};

		render( <ConnectionListItem connection={ disabledConnection } onToggle={ mockOnToggle } /> );

		const toggleInput = screen.getByRole( 'checkbox' );
		expect( toggleInput ).not.toBeChecked();
	} );

	it( 'calls onToggle when toggle is clicked', async () => {
		render( <ConnectionListItem connection={ mockConnection } onToggle={ mockOnToggle } /> );

		const toggleInput = screen.getByRole( 'checkbox' );
		await userEvent.click( toggleInput );

		expect( mockOnToggle ).toHaveBeenCalledTimes( 1 );
	} );
} );
