/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import SubscriptionsInspectorControls from '../controls';

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
	borderRadius: 10,
	borderWeight: 10,
	buttonOnNewLine: false,
	emailFieldBackgroundColor: { color: '#000000' },
	fallbackButtonBackgroundColor: '#000000',
	fallbackTextColor: '#000000',
	fontSize: 1,
	isGradientAvailable: true,
	padding: 3,
	setAttributes,
	setButtonBackgroundColor,
	setTextColor,
	showSubscribersTotal: true,
	spacing: 4,
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
			userEvent.click( screen.getByText( 'Solid' ) );
			userEvent.click( screen.queryAllByLabelText( /Color\:/i, { selector: 'button' } )[0] );

			expect( setButtonBackgroundColor.mock.calls[0][0] ).toMatch(/#[a-z0-9]{6,6}/);
		} );

		test( 'sets a button background color', async () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Solid' ) );
			userEvent.click( screen.queryAllByLabelText( /Color\:/i, { selector: 'button' } )[0] );

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
			userEvent.click( screen.getByText( 'Gradient' ) );
			userEvent.click( screen.queryAllByLabelText( /Gradient\:/i, { selector: 'button' } )[0] );

			expect( setGradient.mock.calls[0][0] ).toMatch(/linear\-gradient\((.+)\)/);
		} );
	} );

	describe( 'Text settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Text Settings' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Border settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Border Settings' ) ).toBeInTheDocument();
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
			// For some reason, userEvent.type is not triggering the onChange event
			userEvent.clear( screen.getAllByLabelText( 'Space Inside' )[0] );

			expect( setAttributes ).toHaveBeenCalledWith( {
				padding: undefined,
			} );
		} );

		test( 'set space between', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Spacing Settings' ), { selector: 'button' } );
			// For some reason, userEvent.type is not triggering the onChange event
			userEvent.clear( screen.getAllByLabelText( 'Space Between' )[0] );

			expect( setAttributes ).toHaveBeenCalledWith( {
				spacing: undefined,
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
			// For some reason, userEvent.type is not triggering the onChange event
			userEvent.clear( screen.getAllByLabelText( 'Border Radius' )[0] );

			expect( setAttributes ).toHaveBeenCalledWith( {
				padding: undefined,
			} );
		} );

		test( 'set border weight', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Border Settings' ), { selector: 'button' } );
			// For some reason, userEvent.type is not triggering the onChange event
			userEvent.clear( screen.getAllByLabelText( 'Border Weight' )[0] );

			expect( setAttributes ).toHaveBeenCalledWith( {
				spacing: undefined,
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
