import { render, screen } from '@testing-library/react';
// this is necessary because block editor store becomes unregistered during jest initialization
import { store as blockEditorStore } from '@wordpress/block-editor';
import { register } from '@wordpress/data';
import WhatsAppButtonEdit from '../edit';

register( blockEditorStore );

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
};

test( 'loads and displays button with buttonText attribute assigned to button', () => {
	render( <WhatsAppButtonEdit { ...defaultProps } /> );

	expect( screen.getByText( 'Chat on WhatsApp' ) ).toBeInTheDocument();
} );

test( 'displays button as multiline textbox for updating the buttonText attribute', () => {
	render( <WhatsAppButtonEdit { ...defaultProps } /> );

	expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'aria-multiline' );
	expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'contenteditable' );
} );

test( 'assigns colorClass attribute to the block wrapper', () => {
	const { container } = render( <WhatsAppButtonEdit { ...defaultProps } /> );

	// eslint-disable-next-line testing-library/no-node-access
	expect( container.firstChild ).toHaveClass( 'is-color-blue' );
} );
