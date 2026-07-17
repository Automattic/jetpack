import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisconnectActionFooter from '../index';

describe( 'DisconnectActionFooter', () => {
	const testProps = {
		stayLabel: 'Stay connected',
		onStay: jest.fn(),
		disconnectLabel: 'Disconnect',
		onDisconnect: jest.fn(),
	};

	afterEach( () => {
		testProps.onStay.mockClear();
		testProps.onDisconnect.mockClear();
	} );

	it( 'renders the stay and disconnect buttons with the passed labels', () => {
		render( <DisconnectActionFooter { ...testProps } /> );
		expect( screen.getByRole( 'button', { name: 'Stay connected' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeInTheDocument();
	} );

	it( 'calls onStay when the stay button is clicked', async () => {
		const user = userEvent.setup();
		render( <DisconnectActionFooter { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Stay connected' } ) );
		expect( testProps.onStay ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onDisconnect when the disconnect button is clicked', async () => {
		const user = userEvent.setup();
		render( <DisconnectActionFooter { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );
		expect( testProps.onDisconnect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'disables the stay button when stayDisabled is true', () => {
		render( <DisconnectActionFooter { ...testProps } stayDisabled /> );
		expect( screen.getByRole( 'button', { name: 'Stay connected' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables the disconnect button when disconnectDisabled is true', () => {
		render( <DisconnectActionFooter { ...testProps } disconnectDisabled /> );
		expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'does not render an error message by default', () => {
		render( <DisconnectActionFooter { ...testProps } /> );
		expect( screen.queryByText( /problem/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders the error message when passed', () => {
		render( <DisconnectActionFooter { ...testProps } error="Something went wrong" /> );
		expect( screen.getByText( 'Something went wrong' ) ).toBeInTheDocument();
	} );

	it( 'renders the shared help footer with the connection and support links', () => {
		render( <DisconnectActionFooter { ...testProps } /> );
		expect( screen.getByRole( 'link', { name: /Jetpack connection/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /contact Jetpack support/ } ) ).toBeInTheDocument();
	} );
} );
