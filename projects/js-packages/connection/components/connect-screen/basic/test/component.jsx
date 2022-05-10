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
import ConnectScreen from '../visual';

const requiredProps = {
	buttonLabel: 'Setup Jetpack',
};

describe( 'ConnectScreen', () => {
	it( 'renders children', () => {
		render(
			<ConnectScreen { ...requiredProps }>
				<p>Connect children</p>
			</ConnectScreen>
		);
		expect( screen.getByText( 'Connect children' ) ).to.exist;
	} );

	it( 'shows button and tos', () => {
		render( <ConnectScreen { ...requiredProps } /> );
		expect( screen.getByRole( 'button', { name: 'Setup Jetpack' } ) ).to.exist;
		expect( screen.getByText( /By clicking the button above/i ) ).to.exist;
	} );

	it( 'remove button and tos', () => {
		render( <ConnectScreen { ...requiredProps } showConnectButton={ false } /> );
		expect( screen.queryByRole( 'button', { name: 'Setup Jetpack' } ) ).not.to.exist;
		expect( screen.queryByText( /By clicking the button above/i ) ).not.to.exist;
	} );

	it( 'applies correct href to terms of service', () => {
		render( <ConnectScreen { ...requiredProps } /> );
		const terms = screen.getByRole( 'link', { name: 'Terms of Service' } );
		expect( terms ).to.have.attribute( 'href', 'https://jetpack.com/redirect/?source=wpcom-tos' );
		expect( terms ).to.have.attribute( 'target', '_blank' );
	} );

	it( 'applies correct href to share', () => {
		render( <ConnectScreen { ...requiredProps } /> );
		const share = screen.getByRole( 'link', { name: 'share details' } );
		expect( share ).to.have.attribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
		);
		expect( share ).to.have.attribute( 'target', '_blank' );
	} );

	it( 'shows error into button', () => {
		render( <ConnectScreen { ...requiredProps } displayButtonError /> );
		expect( screen.getByText( 'An error occurred. Please try again.' ) ).to.exist;
	} );

	// we have an acessibility breach into our loading state
	it.skip( 'shows loading into button', () => {} );

	it( 'calls handleButtonClick', async () => {
		const user = userEvent.setup();
		const handleButtonClick = sinon.stub();
		render( <ConnectScreen { ...requiredProps } handleButtonClick={ handleButtonClick } /> );
		const button = screen.getByRole( 'button', { name: 'Setup Jetpack' } );
		await user.click( button );
		expect( handleButtonClick.called ).to.be.true;
	} );
} );
