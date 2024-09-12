import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ConnectScreenRequiredPlan from '../visual';

const CONNECTION_BUTTON_LABEL = 'Set up Jetpack';

const requiredProps = {
	buttonLabel: CONNECTION_BUTTON_LABEL,
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

	it( 'displays required terms of service text, a prompt for existing subscriptions,and a clickable connection button with the proper label text', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );

		expect(
			screen.getByText(
				( content, { textContent } ) =>
					content !== '' && // filter out parent/wrapper elements
					textContent.startsWith(
						`By clicking ${ CONNECTION_BUTTON_LABEL }, you agree to our Terms of Service`
					)
			)
		).toBeInTheDocument();
		expect( screen.getByText( 'Already have a subscription?' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: CONNECTION_BUTTON_LABEL } ) ).toBeEnabled();
	} );

	it( 'applies correct href to terms of service', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		const terms = screen.getByRole( 'link', { name: 'Terms of Service' } );
		expect( terms ).toHaveAttribute( 'href', 'https://jetpack.com/redirect/?source=wpcom-tos' );
		expect( terms ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'applies correct href to share', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		const share = screen.getByRole( 'link', { name: 'sync your site‘s data' } );
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
		const button = screen.getByRole( 'button', { name: 'Set up Jetpack' } );
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
