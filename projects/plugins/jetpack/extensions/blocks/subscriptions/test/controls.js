/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import SubscriptionsInspectorControls from '../controls';
import {
	DEFAULT_FONTSIZE_VALUE,
} from '../constants';

// Temporarily mock out the ButtonWidthControl, which is causing errors due to missing
// dependencies in the jest test runner.
jest.mock( '../../button/button-width-panel', () => ( {
	...jest.requireActual( '../../button/button-width-panel' ),
	ButtonWidthControl: () => <div>Mocked Width Control</div>,
} ) );

const setButtonBackgroundColor = jest.fn();
const setGradient = jest.fn();
const setTextColor = jest.fn();
const setAttributes = jest.fn();

const defaultProps = {
	buttonBackgroundColor: { color: '#000000' },
	borderColor: { color: '#000000' },
	buttonGradient: {
		buttonGradient: 10,
		setGradient,
	},
	borderRadius: 0,
	borderWeight: 0,
	buttonOnNewLine: false,
	emailFieldBackgroundColor: { color: '#000000' },
	fallbackButtonBackgroundColor: '#000000',
	fallbackTextColor: '#000000',
	fontSize: DEFAULT_FONTSIZE_VALUE,
	isGradientAvailable: true,
	padding: 0,
	setAttributes,
	setButtonBackgroundColor,
	setTextColor,
	showSubscribersTotal: true,
	spacing: 0,
	subscriberCount: 100,
	textColor: '#000000',
};

beforeEach( () => {
	setAttributes.mockClear();
	setGradient.mockClear();
	setTextColor.mockClear();
	setButtonBackgroundColor.mockClear();
} );

describe( 'Inspector controls', () => {
	describe( 'Gradient settings panel', () => {
		test( 'displays gradient settings control panel', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Color Settings' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Background Colors' ) ).not.toBeInTheDocument();
		} );

		test( 'sets solid background color', async () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Solid', { ignore: '[aria-hidden=true]' } ) );
			userEvent.click( screen.queryAllByLabelText( /Color\: (?!Black)/i, { selector: 'button' } )[0] );

			expect( setButtonBackgroundColor.mock.calls[0][0] ).toMatch(/#[a-z0-9]{6,6}/);
		} );

	} );

	describe( 'Color settings panel', () => {
		test( 'hides gradient settings control panel', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } isGradientAvailable={ false }/> );

			expect( screen.getByText( 'Background Colors' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Color Settings' ) ).not.toBeInTheDocument();
		} );

		test( 'sets gradient background color', async () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Gradient', { ignore: '[aria-hidden=true]' } ) );
			userEvent.click( screen.queryAllByLabelText( /Gradient\:/i, { selector: 'button' } )[0] );

			expect( setGradient.mock.calls[0][0] ).toMatch(/linear\-gradient\((.+)\)/);
		} );
	} );

	describe( 'Text settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Text Settings' ) ).toBeInTheDocument();
		} );

		test( 'set custom text ', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Text Settings' ), { selector: 'button' } );
			userEvent.type( screen.getAllByLabelText( 'Custom Size' )[1], '18' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				fontSize: 18,
				customFontSize: 18,
			} );
		} );
	} );

	describe( 'Border settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Border Settings' ) ).toBeInTheDocument();
		} );

		test( 'set border radius', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Border Settings' ), { selector: 'button' } );
			const rangeControlElement = screen.getAllByLabelText( 'Border Radius' )[1];
			userEvent.clear( rangeControlElement );
			userEvent.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				borderRadius: 5,
			} );
		} );

		test( 'set border weight', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Border Settings' ), { selector: 'button' } );
			const rangeControlElement = screen.getAllByLabelText( 'Border Weight' )[1];
			userEvent.clear( rangeControlElement );
			userEvent.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				borderWeight: 5,
			} );
		} );
	} );

	describe( 'Spacing settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Spacing Settings' ) ).toBeInTheDocument();
		} );

		test( 'set space inside', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Spacing Settings' ), { selector: 'button' } );
			const rangeControlElement = screen.getAllByLabelText( 'Space Inside' )[1];
			userEvent.clear( rangeControlElement );
			userEvent.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				padding: 5,
			} );
		} );

		test( 'set space between', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Spacing Settings' ), { selector: 'button' } );
			const rangeControlElement = screen.getAllByLabelText( 'Space Between' )[1];
			userEvent.clear( rangeControlElement );
			userEvent.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				spacing: 5,
			} );
		} );
	} );

	describe( 'Display settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			expect( screen.getByText( 'Display Settings' ) ).toBeInTheDocument();
		} );

		test( 'toggles subscriber count', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Display Settings' ), { selector: 'button' } );
			userEvent.click( screen.getByLabelText( 'Show subscriber count' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				showSubscribersTotal: false,
			} );
		} );

		test( 'toggles place button on new line', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Display Settings' ), { selector: 'button' } );
			userEvent.click( screen.getByLabelText( 'Place button on new line' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonOnNewLine: true,
			} );
		} );
	} );
} );
