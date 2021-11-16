/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import WhatsAppButtonConfiguration from '../configuration';

const defaultAttributes = {
	countryCode: 'us',
	phoneNumber: 12345,
	buttonText: 'Chat on WhatsApp',
	firstMessage: '',
	colorClass: 'blue',
	backgroundColor: 'red',
	openInNewTab: false,
};

const setAttributes = jest.fn();

const defaultProps = {
	attributes: defaultAttributes,
	setAttributes,
	className: 'wp-block-jetpack-whatsapp-button',
	clientId: 1,
	context: 'inspector',
};

beforeEach( () => {
	setAttributes.mockClear();
} );

describe( 'Inspector settings', () => {
	test( 'loads and displays country code select list', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Country code' ) ).toBeInTheDocument();
	} );

	test( 'sets country code attribute', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );
		userEvent.selectOptions( screen.getByLabelText( 'Country code' ), [ '1US' ] );

		expect( setAttributes ).toHaveBeenCalledWith( { countryCode: '1US' } );
	} );

	test( 'loads and displays phone number input box', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );

		expect( screen.getByPlaceholderText( 'Your phone number…' ) ).toBeInTheDocument();
	} );

	test( 'sets phone number attribute', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );
		userEvent.type( screen.getByPlaceholderText( 'Your phone number…' ), '6' );

		expect( setAttributes ).toHaveBeenCalledWith( { phoneNumber: '123456' } );
	} );

	test( 'displays default first message box', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Default First Message' ) ).toBeInTheDocument();
	} );

	test( 'sets default first message attributes', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );
		userEvent.type( screen.getByLabelText( 'Default First Message' ), 'A' );

		expect( setAttributes ).toHaveBeenCalledWith( { firstMessage: 'A' } );
	} );

	test( 'displays open in new tab toggle', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Open in new tab' ) ).toBeInTheDocument();
	} );

	test( 'sets openInNewTab attribute', () => {
		render( <WhatsAppButtonConfiguration { ...defaultProps } /> );
		userEvent.click( screen.getByLabelText( 'Open in new tab' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { openInNewTab: true } );
	} );
} );

describe( 'Toolbar settings', () => {
	const props = { ...defaultProps, context: 'toolbar' };

	test( 'loads and displays settings button in toolbar with settings not visible', () => {
		render( <WhatsAppButtonConfiguration { ...props } /> );

		expect( screen.getByLabelText( 'WhatsApp Button Settings' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Country code' ) ).not.toBeInTheDocument();
	} );

	test( 'loads settings when toolbar button clicked', async () => {
		render( <WhatsAppButtonConfiguration { ...props } /> );
		userEvent.click( screen.getByLabelText( 'WhatsApp Button Settings' ) );
		await waitFor( () => screen.getByLabelText( 'Country code' ) );

		expect( screen.getByLabelText( 'Country code' ) ).toBeInTheDocument();
	} );
} );
