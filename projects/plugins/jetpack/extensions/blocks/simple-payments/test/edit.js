/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import { SimplePaymentsEdit } from '../edit';

const setAttributes = jest.fn();

const props = {
	attributes: {
		productId: 1,
	},
	postLinKText: 'Click here to buy',
	setAttributes,
	isSelected: false,
};

beforeEach( () => {
	setAttributes.mockClear();
} );

describe( 'Edit component', () => {
	test( 'shows Pay with Paypal image but no input fields if not selected', () => {
		render( <SimplePaymentsEdit { ...props } /> );
		expect( screen.getByAltText( 'Pay with PayPal' ) ).toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Item name' ) ).not.toBeInTheDocument();
	} );

	test( 'shows input fields if  selected', () => {
		const selectedProps = { ...props, isSelected: true };
		render( <SimplePaymentsEdit { ...selectedProps } /> );
		expect( screen.getByLabelText( 'Item name' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Describe your item in a few words' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Currency' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Price' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Email' ) ).toBeInTheDocument();
	} );
} );
