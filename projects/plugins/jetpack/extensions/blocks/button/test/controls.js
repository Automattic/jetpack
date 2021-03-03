/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import ButtonControls from '../controls';

const defaultAttributes = {};

const setAttributes = jest.fn();
const setBackgroundColor = jest.fn();
const setTextColor = jest.fn();
const setGradient = jest.fn();

const defaultProps = {
    attributes: defaultAttributes,
    backgroundColor: {
        class: undefined,
        color: undefined,
    },
    fallbackBackgroundColor: 'rgba(0, 0, 0, 0)',
    fallbackTextColor: undefined,
    setAttributes: setAttributes,
    setBackgroundColor: setBackgroundColor,
    setTextColor: setTextColor,
    textColor: {
        class: undefined,
        color: undefined,
    },
    gradientValue: undefined,
    setGradient: setGradient,
};

beforeEach( () => {
    setAttributes.mockClear();
    setBackgroundColor.mockClear();
    setTextColor.mockClear();
    setGradient.mockClear();
} );

describe( 'Inspector settings', () => {
	test( 'loads and displays text color options', () => {
		render( <ButtonControls { ...defaultProps } /> );

		expect( screen.getByText( 'Text Color' ) ).toBeInTheDocument();
	} );

	test( 'sets text color attribute', () => {
        render( <ButtonControls { ...defaultProps } /> );

        const textColors = screen.getByText( 'Text Color' ).closest( 'fieldset' );
        const textColorOption = within( textColors ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ];
		userEvent.click( textColorOption );

		expect( setTextColor ).toHaveBeenCalled();
    } );

    test( 'loads and displays background color options', () => {
		render( <ButtonControls { ...defaultProps } /> );

		expect( screen.getByText( 'Background' ) ).toBeInTheDocument();
    } );

    test( 'loads and displays solid background color options', () => {
        render( <ButtonControls { ...defaultProps } /> );
        const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );

        expect( within( backgroundSection ).getByText( 'Solid' ) ).toBeInTheDocument();
    } );

	test( 'sets background color attribute', () => {
        render( <ButtonControls { ...defaultProps } /> );

        const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );
        const backgroundColorOption = within( backgroundSection ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ];
		userEvent.click( backgroundColorOption );

		expect( setBackgroundColor ).toHaveBeenCalled();
    } );

    test( 'loads and displays gradient background color options', () => {
        render( <ButtonControls { ...defaultProps } /> );
        const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );

        expect( within( backgroundSection ).getByText( 'Gradient' ) ).toBeInTheDocument();
    } );

    test( 'sets background color gradient attribute', () => {
        render( <ButtonControls { ...defaultProps } /> );

        const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );

        const gradientButton = within( backgroundSection ).getByText( 'Gradient' );
        userEvent.click( gradientButton );

        const gradientOption = within( backgroundSection ).getAllByLabelText( 'Gradient: ', { exact: false } )[ 0 ];
		userEvent.click( gradientOption );

		expect( setGradient ).toHaveBeenCalled();
    } );

    test( 'loads and displays border radius', () => {
        render( <ButtonControls { ...defaultProps } /> );

        expect( screen.getByText( 'Border Settings' ) ).toBeInTheDocument();
    } );

    test( 'sets the border radius attribute', () => {
        render( <ButtonControls { ...defaultProps } /> );

        const borderPanel = screen.getByText( 'Border Settings' ).closest( 'div' );
        const input = within( borderPanel ).getAllByLabelText( 'Border radius' )[ 1 ];

        userEvent.type( input, '5' );
        expect( setAttributes ).toHaveBeenCalledWith( { borderRadius: 5 } );
    } );
} );
