import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

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

		test( 'loads and displays only default background color options', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			await user.click( screen.getByText( 'Background', { ignore: '[aria-hidden=true]' } ) );
			const backgroundColorPanel = screen
				.getByText( 'Background' )
				.closest( 'div.components-dropdown' );

			expect( within( backgroundColorPanel ).queryByText( 'Solid' ) ).not.toBeInTheDocument();
			expect( within( backgroundColorPanel ).queryByText( 'Gradient' ) ).not.toBeInTheDocument();
		} );

		test( 'sets text color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			await user.click( screen.getByText( 'Text Color', { ignore: '[aria-hidden=true]' } ) );
			const textColors = screen.getByText( 'Text Color' ).closest( 'div.components-dropdown' );
			await user.click( within( textColors ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ] );

			expect( setTextColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets background color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			await user.click( screen.getByText( 'Background', { ignore: '[aria-hidden=true]' } ) );
			const backgroundSection = screen
				.getByText( 'Background' )
				.closest( 'div.components-dropdown' );
			const backgroundColorOption = within( backgroundSection ).getAllByLabelText( 'Color: ', {
				exact: false,
			} )[ 0 ];
			await user.click( backgroundColorOption );

			expect( setBackgroundColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );
	} );

	describe( 'Color settings when gradients are available', () => {
		test( 'loads and displays Gradient Color Settings panel', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			expect( screen.getByText( 'Background & Text Color' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Text Color' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Background' ) ).toBeInTheDocument();
		} );

		test( 'loads and displays solid and gradient background color options', async () =>{
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			await user.click( screen.getByText( 'Background', { ignore: '[aria-hidden=true]' } ) );
			const backgroundSection = screen
				.getByText( 'Background' )
				.closest( 'div.components-dropdown' );

			expect(
				within( backgroundSection ).getByText( 'Solid', { ignore: '[aria-hidden=true]' } )
			).toBeInTheDocument();
			expect(
				within( backgroundSection ).getByText( 'Gradient', { ignore: '[aria-hidden=true]' } )
			).toBeInTheDocument();
		} );

		test( 'sets text color attribute', async () =>{
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			await user.click( screen.getByText( 'Text Color', { ignore: '[aria-hidden=true]' } ) );
			const textColors = screen.getByText( 'Text Color' ).closest( 'div.components-dropdown' );
			await user.click( within( textColors ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ] );

			expect( setTextColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets solid background color attribute', async () =>{
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			await user.click( screen.getByText( 'Background', { ignore: '[aria-hidden=true]' } ) );
			const backgroundSection = screen
				.getByText( 'Background' )
				.closest( 'div.components-dropdown' );

			await user.click(
				within( backgroundSection ).getByText( 'Solid', { ignore: '[aria-hidden=true]' } )
			);
			await user.click(
				within( backgroundSection ).getAllByLabelText( 'Color: ', { exact: false } )[ 0 ]
			);

			expect( setBackgroundColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets gradient background color attribute', async () =>{
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			await user.click( screen.getByText( 'Background', { ignore: '[aria-hidden=true]' } ) );
			const backgroundSection = screen
				.getByText( 'Background' )
				.closest( 'div.components-dropdown' );
			await user.click(
				within( backgroundSection ).getByText( 'Gradient', { ignore: '[aria-hidden=true]' } )
			);
			await user.click(
				within( backgroundSection ).getAllByLabelText( 'Gradient: ', { exact: false } )[ 0 ]
			);

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

			const borderPanel = screen.getByText( 'Border Settings' ).closest( 'div' );
			const input = borderPanel.querySelector( 'input[type="number"]' );
			input.focus();
			fireEvent.change( input, { target: { value: '6' } } );
			expect( setAttributes ).toHaveBeenCalledWith( { borderRadius: 6 } );
		} );
	} );
} );
