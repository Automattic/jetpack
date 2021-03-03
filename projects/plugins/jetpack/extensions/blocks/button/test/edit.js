/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import ButtonEdit from '../edit';

const defaultAttributes = {
    borderRadius: 5,
    element: "button",
    placeholder: "Add text",
    text: "Contact Us",
    gradient: undefined,
    customGradient: undefined,
};

const defaultProps = {
    attributes: defaultAttributes,
    backgroundColor: {
        class: "has-black-background-color",
        color: "#000000",
    },
    fallbackBackgroundColor: 'rgba(0, 0, 0, 0)',
    fallbackTextColor: 'rgba(0, 0, 0, 0)',
    setAttributes: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTextColor: jest.fn(),
    textColor: {
        class: "has-white-color",
        color: "#FFFFFF",
    },
};

test( 'loads and displays button with buttonText attribute assigned to button', () => {
	render( <ButtonEdit { ...defaultProps } /> );

	expect( screen.getByText( 'Contact Us' ) ).toBeInTheDocument();
} );

test( 'displays button as multiline textbox for updating the buttonText attribute', () => {
	render( <ButtonEdit { ...defaultProps } /> );

	expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'aria-multiline' );
	expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'contenteditable' );
} );

test( 'assigns colorClass attribute to the block wrapper', () => {
	const { container } = render( <ButtonEdit { ...defaultProps } /> );

	expect( container.firstChild ).toHaveClass( 'has-black-background-color' );
} );
