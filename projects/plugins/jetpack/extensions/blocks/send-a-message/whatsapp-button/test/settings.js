/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import WhatsAppButtonSettings from '../settings';

const defaultAttributes = {
	countryCode: 'us',
	phoneNumber: 12345,
	buttonText: 'Chat on WhatsApp',
	firstMessage: '',
	colorClass: 'blue',
	backgroundColor: 'red',
	openInNewTab: false,
};

const defaultProps = {
	attributes: defaultAttributes,
	setAttributes: jest.fn(),
	className: 'wp-block-jetpack-whatsapp-button',
	clientId: 1,
	context: 'inspector',
};

test( 'loads and displays country code select list and phone number input box', () => {
	render( <WhatsAppButtonSettings { ...defaultProps } /> );

	expect( screen.getByLabelText( 'Country code' ) ).toBeDefined();
	expect( screen.getByPlaceholderText( 'Your phone number…' ) ).toBeDefined();
} );

test( 'displays default first message box', () => {
	render( <WhatsAppButtonSettings { ...defaultProps } /> );

	expect( screen.getByLabelText( 'Default First Message' ) ).toBeDefined();
} );

test( 'displays open in new tab toggle', () => {
	render( <WhatsAppButtonSettings { ...defaultProps } /> );

	expect( screen.getByLabelText( 'Open in new tab' ) ).toBeDefined();
} );
