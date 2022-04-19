/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
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
		expect( screen.getByText( 'Connect children' ) ).to.exist;
	} );

	it( 'shows button, tos and subscription', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		expect( screen.getByRole( 'button', { name: 'Setup Jetpack' } ) ).to.exist;
		expect( screen.getByText( /By clicking the button above/i ) ).to.exist;
		expect( screen.getByText( /Already have a subscription?/i ) ).to.exist;
	} );

	it( 'remove button, tos and subscription', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } showConnectButton={ false } /> );
		expect( screen.queryByRole( 'button', { name: 'Setup Jetpack' } ) ).not.to.exist;
		expect( screen.queryByText( /By clicking the button above/i ) ).not.to.exist;
		expect( screen.queryByText( /Already have a subscription?/i ) ).not.to.exist;
	} );

	it( 'applies correct href to terms of service', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		const terms = screen.getByRole( 'link', { name: 'Terms of Service' } );
		expect( terms ).to.have.attribute( 'href', 'https://jetpack.com/redirect/?source=wpcom-tos' );
		expect( terms ).to.have.attribute( 'target', '_blank' );
	} );

	it( 'applies correct href to share', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } /> );
		const share = screen.getByRole( 'link', { name: 'share details' } );
		expect( share ).to.have.attribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
		);
		expect( share ).to.have.attribute( 'target', '_blank' );
	} );

	it( 'shows error into button', () => {
		render( <ConnectScreenRequiredPlan { ...requiredProps } displayButtonError /> );
		expect( screen.getByText( 'An error occurred. Please try again.' ) ).to.exist;
	} );

	// we have an acessibility breach into our loading state
	it.skip( 'shows loading into button', () => {} );

	it( 'calls handleButtonClick into main button', () => {
		const handleButtonClick = sinon.stub();
		render(
			<ConnectScreenRequiredPlan { ...requiredProps } handleButtonClick={ handleButtonClick } />
		);
		const button = screen.getByRole( 'button', { name: 'Setup Jetpack' } );
		userEvent.click( button );
		expect( handleButtonClick.called ).to.be.true;
	} );

	it( 'calls handleButtonClick into login button', () => {
		const handleButtonClick = sinon.stub();
		render(
			<ConnectScreenRequiredPlan { ...requiredProps } handleButtonClick={ handleButtonClick } />
		);
		const button = screen.getByRole( 'button', { name: 'Log in to get started' } );
		userEvent.click( button );
		expect( handleButtonClick.called ).to.be.true;
	} );
} );
