/**
 * External dependencies
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import ButtonControls from '../controls';

// Temporarily mock out the ButtonWidthControl, which is causing errors due to missing
// dependencies in the jest test runner.
jest.mock( '../button-width-panel', () => ( {
    __esModule: true,
	default: () => <div>Mocked Width Settings</div>,
} ) );

const defaultAttributes = {
	align: undefined,
	width: undefined,
};

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
	isGradientAvailable: false,
};

beforeEach( () => {
	setAttributes.mockClear();
	setBackgroundColor.mockClear();
	setTextColor.mockClear();
	setGradient.mockClear();
} );

describe( 'Inspector settings', () => {
	describe( 'Color settings when gradients are not available', () => {
		test( 'loads and displays Color Settings panel', () => {
			render( <ButtonControls { ...defaultProps } /> );

			expect( screen.getByText( 'Background & Text Color' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Text Color' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Background' ) ).toBeInTheDocument();
		} );

		test( 'loads and displays only default background color options', () => {
			render( <ButtonControls { ...defaultProps } /> );
			const backgroundColorPanel = screen.getByText( 'Background' ).closest( 'fieldset' );

			expect( within( backgroundColorPanel ).queryByText( 'Solid' ) ).not.toBeInTheDocument();
			expect( within( backgroundColorPanel ).queryByText( 'Gradient' ) ).not.toBeInTheDocument();
		} );

		test( 'sets text color attribute', () => {
			render( <ButtonControls { ...defaultProps } /> );

			const textColors = screen.getByText( 'Text Color' ).closest( 'fieldset' );
			userEvent.click( within( textColors ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ] );

			expect( setTextColor.mock.calls[ 0 ] [ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets background color attribute', () => {
			render( <ButtonControls { ...defaultProps } /> );

			const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );
			const backgroundColorOption = within( backgroundSection ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ];
			userEvent.click( backgroundColorOption );

			expect( setBackgroundColor.mock.calls[ 0 ] [ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );
	} );

	describe('Color settings when gradients are available', () => {
		test('loads and displays Gradient Color Settings panel', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			expect( screen.getByText( 'Background & Text Color' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Text Color' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Background' ) ).toBeInTheDocument();
		} );

		test( 'loads and displays solid and gradient background color options', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );
			const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );

			expect( within( backgroundSection ).getByText( 'Solid' ) ).toBeInTheDocument();
			expect(within(backgroundSection).getByText('Gradient')).toBeInTheDocument();
		});

		test( 'sets text color attribute', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const textColors = screen.getByText( 'Text Color' ).closest( 'fieldset' );
			userEvent.click( within( textColors ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ] );

			expect( setTextColor.mock.calls[ 0 ] [ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets solid background color attribute', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );

			userEvent.click(within(backgroundSection).getByText('Solid'));
			userEvent.click(within(backgroundSection).getAllByLabelText('Color: ', { exact: false })[0]);

			expect( setBackgroundColor.mock.calls[ 0 ] [ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
        } );

		test( 'sets gradient background color attribute', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const backgroundSection = screen.getByText( 'Background' ).closest( 'fieldset' );
			userEvent.click( within( backgroundSection ).getByText( 'Gradient' ) );
			userEvent.click( within( backgroundSection ).getAllByLabelText( 'Gradient: ', { exact: false } )[ 0 ] );

			expect( setGradient.mock.calls[ 0 ][ 0 ] ).toMatch( /linear\-gradient\((.+)\)/ );
		} );
    } );

    describe( 'Border settings', () => {
		test( 'loads and displays border radius', () => {
			render( <ButtonControls { ...defaultProps } /> );

			expect( screen.getByText( 'Border Settings' ) ).toBeInTheDocument();
		} );

		test( 'sets the border radius attribute', () => {
			render( <ButtonControls { ...defaultProps } /> );

			const borderPanel = screen.getByText('Border Settings').closest('div');
			const input = borderPanel.querySelector('input[type="number"]');
			input.focus();
			fireEvent.change(input, { target: { value: '6' } });
			expect(setAttributes).toHaveBeenCalledWith({ borderRadius: 6 });
		} );
	} );
} );
