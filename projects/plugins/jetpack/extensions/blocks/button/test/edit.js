/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// this is necessary because block editor store becomes unregistered during jest initialization
import { register } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
register( blockEditorStore );

/**
 * Internal dependencies
 */
import { ButtonEdit } from '../edit';
import { __experimentalUseGradient } from '@wordpress/block-editor';

const defaultAttributes = {
    borderRadius: 15,
    element: "button",
    placeholder: "Placeholder text!!!",
    text: "Contact Us",
};

const defaultProps = {
    attributes: defaultAttributes,
    backgroundColor: {
        class: "has-black-background-color",
        color: "#000000",
    },
    className: 'className',
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

const gradientProps = {
    gradientClass: 'has-green-to-yellow-gradient-background',
    gradientValue: 'linear-gradient(160deg, rgb(209, 228, 221) 0%, rgb(238, 234, 221) 100%)',
    setGradient: jest.fn(),
};

jest.mock( '../constants', () => ( {
    IS_GRADIENT_AVAILABLE: true
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
    ...jest.requireActual( '@wordpress/block-editor' ),
    __experimentalUseGradient: jest.fn().mockReturnValue( {
        gradientClass: undefined,
        gradientValue: undefined,
        setGradient: jest.fn()
    } ),
} ) );

// Temporarily mock out the ButtonWidthControl, which is causing errors due to missing
// dependencies in the jest test runner.
jest.mock( '../button-width-panel', () => ( {
	...jest.requireActual( '../button-width-panel' ),
	ButtonWidthControl: () => <div>Mocked Width Control</div>,
} ) );

beforeEach( () => {
    defaultProps.setAttributes.mockClear();
} );

function renderButton( props ) {
    const { container } = render( <ButtonEdit { ...props } /> );
    return within( container ).getByRole( 'textbox' );
}

describe( 'ButtonEdit', () => {
    test( 'loads and displays button with buttonText attribute assigned to button', () => {
        renderButton( defaultProps );

        expect( screen.getByText( 'Contact Us' ) ).toBeInTheDocument();
    } );

    test( 'displays button as multiline textbox for updating the buttonText attribute', () => {
        renderButton( defaultProps );

        expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'aria-multiline' );
        expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'contenteditable' );
    } );

    test( 'adds the placeholder when attribute is provided', () => {
        const attributes = { ...defaultAttributes, text: undefined };
        const button = renderButton( { ...defaultProps, attributes } );
        expect( button.getAttribute( 'aria-label' ) ).toEqual( defaultAttributes.placeholder );
    } );

    test( 'assigns background color class and styles to the button', () => {
        const button = renderButton( defaultProps );

        expect( button ).toHaveClass( 'has-background' );
        expect( button ).toHaveClass( 'has-black-background-color' );
        expect( button ).toHaveStyle( { backgroundColor: '#000000' } );
    } );

    test( 'applies text color class and style to the button', () => {
        const button = renderButton( defaultProps );

        expect( button ).toHaveClass( 'has-text-color' );
        expect( button ).toHaveClass( 'has-white-color' );
        expect( button ).toHaveStyle( { color: '#FFFFFF' } );
    } );

    test( 'applies border radius style to the button', () => {
        const button = renderButton( defaultProps );

        expect( button ).toHaveStyle( { borderRadius: '15px' } );
    } );

    test( 'applies class when 0 border radius selected', () => {
        const attributes = {
            ...defaultAttributes,
            borderRadius: 0
        };
        const props = { ...defaultProps, attributes };
        const button = renderButton( props );

        expect( button ).toHaveClass( 'no-border-radius' );
    } );

    test( 'applies gradient color class and style to the button', () => {
        __experimentalUseGradient.mockImplementation( () => gradientProps );

        const props = { ...defaultProps, backgroundColor: {} };
        const button = renderButton( props );

        expect( button ).toHaveClass( 'has-background' );
        expect( button ).toHaveClass( gradientProps.gradientClass );
        expect( button ).toHaveStyle( { background: gradientProps.gradientValue } );
    } );
} );
