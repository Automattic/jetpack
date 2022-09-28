import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ConnectScreenRequiredPlan from '../visual';

const requiredProps = {
	buttonLabel: 'Setup Jetpack',
	pricingTitle: 'Jetpack Backup',
	priceBefore: 9,
	priceAfter: 4.5,
};

describe( 'ConnectScreenRequiredPlan', () => {
	it( 'renders children', () => {
		render(
			<ConnectScreenRequiredPlan { ...requiredProps }>
				<p>Connect children</p>
			</ConnectScreenRequiredPlan>
		);
		expect( screen.getByText( 'Connect children' ) ).toBeInTheDocument();
	} );

	it( 'shows button, tos and subscription', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		expect( screen.getByRole( 'button', { name: 'Setup Jetpack' } ) ).toBeInTheDocument();
		expect( screen.getByText( /By clicking the button above/i ) ).toBeInTheDocument();
		expect( screen.getByText( /Already have a subscription?/i ) ).toBeInTheDocument();
	} );

	it( 'remove button, tos and subscription', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } showConnectButton={ false } /> );
		expect( screen.queryByRole( 'button', { name: 'Setup Jetpack' } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /By clicking the button above/i ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Already have a subscription?/i ) ).not.toBeInTheDocument();
	} );

	it( 'applies correct href to terms of service', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		const terms = screen.getByRole( 'link', { name: 'Terms of Service' } );
		expect( terms ).toHaveAttribute( 'href', 'https://jetpack.com/redirect/?source=wpcom-tos' );
		expect( terms ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'applies correct href to share', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		const share = screen.getByRole( 'link', { name: 'share details' } );
		expect( share ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
		);
		expect( share ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'shows error into button', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } displayButtonError /> );
		expect( screen.getByText( 'An error occurred. Please try again.' ) ).toBeInTheDocument();
	} );

	// we have an acessibility breach into our loading state
	it.todo( 'shows loading into button' );

	it( 'calls handleButtonClick into main button', async () => {
		const user = userEvent.setup();
		const handleButtonClick = jest.fn();
		render(
			<ConnectScreenRequiredPlan { ...requiredProps } handleButtonClick={ handleButtonClick } />
		);
		const button = screen.getByRole( 'button', { name: 'Setup Jetpack' } );
		await user.click( button );
		expect( handleButtonClick ).toHaveBeenCalled();
	} );

	it( 'calls handleButtonClick into login button', async () => {
		const user = userEvent.setup();
		const handleButtonClick = jest.fn();
		render(
			<ConnectScreenRequiredPlan { ...requiredProps } handleButtonClick={ handleButtonClick } />
		);
		const button = screen.getByRole( 'button', { name: 'Log in to get started' } );
		await user.click( button );
		expect( handleButtonClick ).toHaveBeenCalled();
	} );
} );
