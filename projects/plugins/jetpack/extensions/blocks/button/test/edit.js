/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { ButtonEdit } from '../edit';

const defaultAttributes = {
    borderRadius: 15,
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

jest.mock( '../constants', () => ( {
    IS_GRADIENT_AVAILABLE: false
} ) );

test( 'loads and displays button with buttonText attribute assigned to button', () => {
    render( <ButtonEdit { ...defaultProps } /> );

	expect( screen.getByText( 'Contact Us' ) ).toBeInTheDocument();
} );

test( 'displays button as multiline textbox for updating the buttonText attribute', () => {
	render( <ButtonEdit { ...defaultProps } /> );

	expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'aria-multiline' );
	expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'contenteditable' );
} );

test( 'assigns background color class and styles to the button', () => {
	const { container } = render( <ButtonEdit { ...defaultProps } /> );
    const button = within( container ).getByRole( 'textbox' );

    expect( button ).toHaveClass( 'has-black-background-color' );
    expect( button ).toHaveStyle( { backgroundColor: '#000000' } );
} );

test( 'applies text color class and style to the button', () => {
    const { container } = render( <ButtonEdit { ...defaultProps } /> );
    const button = within( container ).getByRole( 'textbox' );

    expect( button ).toHaveClass( 'has-white-color' );
    expect( button ).toHaveStyle( { color: '#FFFFFF' } );
} );

test( 'applies border radius style to the button', () => {
    const { container } = render( <ButtonEdit { ...defaultProps } /> );
    const button = within( container ).getByRole( 'textbox' );

    expect( button ).toHaveStyle( { borderRadius: '15px' } );
} );

test( 'applies class when 0 border radius selected', () => {
    const attributes = {
        ...defaultAttributes,
        borderRadius: 0
    };
    const props = { ...defaultProps, attributes };
    const { container } = render( <ButtonEdit { ...props } /> );
    const button = within( container ).getByRole( 'textbox' );

    expect( button ).toHaveClass( 'no-border-radius' );
} );
