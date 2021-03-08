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
	isSelected: true,
};

beforeEach( () => {
	setAttributes.mockClear();
} );

describe( 'Edit component', () => {
	test( 'shows Pay with Paypal image but no input fields if not selected', () => {
		const notSelectedProps = { ...props, isSelected: false };
		render( <SimplePaymentsEdit { ...notSelectedProps } /> );
		expect( screen.getByAltText( 'Pay with PayPal' ) ).toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Item name' ) ).not.toBeInTheDocument();
	} );

	test( 'shows input fields if selected', () => {
		render( <SimplePaymentsEdit { ...props } /> );
		expect( screen.getByLabelText( 'Item name' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Describe your item in a few words' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Currency' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Price' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Email' ) ).toBeInTheDocument();
	} );

	test( 'updates item name attribute if item name input updated', () => {
		render( <SimplePaymentsEdit { ...props } /> );
		userEvent.type( screen.getByLabelText( 'Item name' ), 'A' );
		expect( setAttributes ).toHaveBeenCalledWith( { title: 'A' } );
	} );

	test( 'updates attribute attribute if description input updated', () => {
		render( <SimplePaymentsEdit { ...props } /> );
		userEvent.type( screen.getByLabelText( 'Describe your item in a few words' ), 'B' );
		expect( setAttributes ).toHaveBeenCalledWith( { content: 'B' } );
	} );

	test.only( 'updates price attribute if price input updated', () => {
		render( <SimplePaymentsEdit { ...props } /> );
		// screen.debug();
		await userEvent.type( screen.getByLabelText( 'Price' ), 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { price: 1 } );
	} );
} );
