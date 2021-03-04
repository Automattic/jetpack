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
	buttonBackgroundColor: { color: '' },
	borderColor: { color: '' },
	buttonGradient: {
		buttonGradient: 10,
		setGradient,
	},
	borderRadius: 10,
	borderWeight: 10,
	buttonOnNewLine: false,
	emailFieldBackgroundColor: { color: '' },
	fallbackButtonBackgroundColor: 'white',
	fallbackTextColor: 'white',
	fontSize: 1,
	isGradientAvailable: true,
	padding: 3,
	setAttributes,
	setButtonBackgroundColor,
	setTextColor,
	showSubscribersTotal: true,
	spacing: 4,
	subscriberCount: 100,
	textColor: 'white',
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

		test( 'sets country code attribute', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			userEvent.click( screen.getByText( 'Solid' ) );
			userEvent.click( screen.getByLabelText( 'Color: Black' ) );

			expect( setButtonBackgroundColor ).toHaveBeenCalledWith( { countryCode: '1US' } );
		} );
	} );

	describe( 'Color settings panel', () => {
		test( 'hides gradient settings control panel', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } isGradientAvailable={ false }/> );

			expect( screen.getByText( 'Background Colors' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Color Settings' ) ).not.toBeInTheDocument();
		} );
	} );
} );
