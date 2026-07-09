import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ConnectionErrorNotice from '../index';

describe( 'ConnectionErrorNotice', () => {
	it( 'should not render when message is empty', () => {
		const { container } = render( <ConnectionErrorNotice message="" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render error message', () => {
		render( <ConnectionErrorNotice message="Connection failed" /> );
		// Message appears in both the notice and accessibility regions
		const messageElements = screen.getAllByText( 'Connection failed' );
		expect( messageElements.length ).toBeGreaterThan( 0 );
	} );

	it( 'should render with default restore connection action when restoreConnectionCallback is provided', () => {
		const mockCallback = jest.fn();
		render(
			<ConnectionErrorNotice
				message="Connection needs to be restored"
				restoreConnectionCallback={ mockCallback }
			/>
		);

		expect( screen.getAllByText( 'Connection needs to be restored' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Restore Connection' ) ).toBeInTheDocument();
	} );

	it( 'should render custom actions when provided', () => {
		const actions = [
			{
				label: 'Custom Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
		];

		render( <ConnectionErrorNotice message="Custom error occurred" actions={ actions } /> );

		expect( screen.getAllByText( 'Custom error occurred' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Custom Action' ) ).toBeInTheDocument();
	} );

	it( 'should show loading state when isRestoringConnection is true', () => {
		render(
			<ConnectionErrorNotice
				message="Connection is being restored"
				isRestoringConnection={ true }
			/>
		);

		// Message appears in both the notice and accessibility regions
		const loadingElements = screen.getAllByText( 'Reconnecting Jetpack' );
		expect( loadingElements.length ).toBeGreaterThan( 0 );
	} );

	it( 'should show restore connection error when provided', () => {
		render(
			<ConnectionErrorNotice
				message="Original connection error"
				restoreConnectionError="Failed to reconnect"
			/>
		);

		expect( screen.getByText( /There was an error reconnecting Jetpack/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Failed to reconnect/ ) ).toBeInTheDocument();
	} );

	it( 'should render multiple custom actions', () => {
		const actions = [
			{
				label: 'First Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
			{
				label: 'Second Action',
				onClick: jest.fn(),
				variant: 'secondary',
			},
		];

		render( <ConnectionErrorNotice message="Multiple actions available" actions={ actions } /> );

		expect( screen.getAllByText( 'Multiple actions available' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'First Action' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Second Action' ) ).toBeInTheDocument();
	} );

	it( 'should render a feature context line above the message when provided', () => {
		render(
			<ConnectionErrorNotice
				message="WordPress.com reached your site but the request was blocked."
				context="Your activity log couldn’t load."
			/>
		);

		expect( screen.getAllByText( 'Your activity log couldn’t load.' ).length ).toBeGreaterThan( 0 );
		expect(
			screen.getAllByText( 'WordPress.com reached your site but the request was blocked.' ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'should render primary and secondary buttons', () => {
		const actions = [
			{
				label: 'Primary Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
			{
				label: 'Secondary Action',
				onClick: jest.fn(),
				variant: 'secondary',
			},
		];

		render( <ConnectionErrorNotice message="Testing secondary button" actions={ actions } /> );

		expect( screen.getByText( 'Primary Action' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Secondary Action' ) ).toBeInTheDocument();
	} );
} );
