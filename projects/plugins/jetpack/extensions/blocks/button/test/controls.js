import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ButtonControls from '../controls';

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
	WidthSettings: () => null,
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

			expect(
				screen.getByRole( 'heading', { name: 'Background & Text Color' } )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Text Color' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Background' } ) ).toBeInTheDocument();
		} );

		test( 'loads and displays only default background color options', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			const backgroundButton = screen.getByRole( 'button', { name: 'Background' } );
			await user.click( backgroundButton );
			// eslint-disable-next-line testing-library/no-node-access
			const backgroundSection = backgroundButton.closest( 'div.components-dropdown' );
			expect(
				within( backgroundSection ).queryByRole( 'tab', { name: 'Solid' } )
			).not.toBeInTheDocument();
			expect(
				within( backgroundSection ).queryByRole( 'tab', { name: 'Gradient' } )
			).not.toBeInTheDocument();
		} );

		test( 'sets text color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			const textColorButton = screen.getByRole( 'button', { name: 'Text Color' } );
			await user.click( textColorButton );
			// eslint-disable-next-line testing-library/no-node-access
			const textColors = textColorButton.closest( 'div.components-dropdown' );
			await user.click( within( textColors ).getAllByRole( 'button', { name: /^Color: / } )[ 0 ] );

			expect( setTextColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets background color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			const backgroundButton = screen.getByRole( 'button', { name: 'Background' } );
			await user.click( backgroundButton );
			// eslint-disable-next-line testing-library/no-node-access
			const backgroundSection = backgroundButton.closest( 'div.components-dropdown' );
			await user.click(
				within( backgroundSection ).getAllByRole( 'button', { name: /^Color: / } )[ 0 ]
			);

			expect( setBackgroundColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );
	} );

	describe( 'Color settings when gradients are available', () => {
		test( 'loads and displays Gradient Color Settings panel', () => {
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			expect(
				screen.getByRole( 'heading', { name: 'Background & Text Color' } )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Text Color' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Background' } ) ).toBeInTheDocument();
		} );

		test( 'loads and displays solid and gradient background color options', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const backgroundButton = screen.getByRole( 'button', { name: 'Background' } );
			await user.click( backgroundButton );
			// eslint-disable-next-line testing-library/no-node-access
			const backgroundSection = backgroundButton.closest( 'div.components-dropdown' );
			expect(
				within( backgroundSection ).getByRole( 'tab', { name: 'Solid' } )
			).toBeInTheDocument();
			expect(
				within( backgroundSection ).getByRole( 'tab', { name: 'Gradient' } )
			).toBeInTheDocument();
		} );

		test( 'sets text color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const textColorButton = screen.getByRole( 'button', { name: 'Text Color' } );
			await user.click( textColorButton );
			// eslint-disable-next-line testing-library/no-node-access
			const textColors = textColorButton.closest( 'div.components-dropdown' );
			await user.click( within( textColors ).getAllByRole( 'button', { name: /^Color: / } )[ 0 ] );

			expect( setTextColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets solid background color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const backgroundButton = screen.getByRole( 'button', { name: 'Background' } );
			await user.click( backgroundButton );
			// eslint-disable-next-line testing-library/no-node-access
			const backgroundSection = backgroundButton.closest( 'div.components-dropdown' );
			await user.click( within( backgroundSection ).getByRole( 'tab', { name: 'Solid' } ) );
			await user.click(
				within( backgroundSection ).getAllByRole( 'button', { name: /^Color: / } )[ 0 ]
			);

			expect( setBackgroundColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );

		test( 'sets gradient background color attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } isGradientAvailable={ true } /> );

			const backgroundButton = screen.getByRole( 'button', { name: 'Background' } );
			await user.click( backgroundButton );
			// eslint-disable-next-line testing-library/no-node-access
			const backgroundSection = backgroundButton.closest( 'div.components-dropdown' );
			await user.click( within( backgroundSection ).getByRole( 'tab', { name: 'Gradient' } ) );
			await user.click(
				within( backgroundSection ).getAllByRole( 'button', { name: /^Gradient: / } )[ 0 ]
			);

			expect( setGradient.mock.calls[ 0 ][ 0 ] ).toMatch( /linear-gradient\((.+)\)/ );
		} );
	} );

	describe( 'Border settings', () => {
		test( 'loads and displays border radius', () => {
			render( <ButtonControls { ...defaultProps } /> );

			expect( screen.getByText( 'Border Settings' ) ).toBeInTheDocument();
		} );

		test( 'sets the border radius attribute', async () => {
			const user = userEvent.setup();
			render( <ButtonControls { ...defaultProps } /> );

			const input = screen.getByRole( 'spinbutton', { name: 'Border radius' } );
			await user.type( input, '6', { initialSelectionStart: 0, initialSelectionEnd: Infinity } );
			expect( setAttributes ).toHaveBeenCalledWith( { borderRadius: 6 } );
		} );
	} );
} );
