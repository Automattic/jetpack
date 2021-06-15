/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import PhoneEdit from '../edit';

const setAttributes = jest.fn();

const defaultAttributes = {
	phone: '',
};

const defaultProps = {
	attributes: defaultAttributes,
	isSelected: false,
	setAttributes,
};

describe( 'Phone', () => {
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders placeholder if not selected, and no content is entered', () => {
		const propsNotSelected = { ...defaultProps, isSelected: false };
		render( <PhoneEdit { ...propsNotSelected } /> );

		expect( screen.getByPlaceholderText( 'Phone number' ) ).toBeInTheDocument();
	} );

	test( 'renders phone number, and no placeholders, when not selected', () => {
		const propsNotSelected = {
			...defaultProps,
			attributes: { phone: '123-456-7890' },
			isSelected: false,
		};
		render( <PhoneEdit { ...propsNotSelected } /> );

		expect( screen.getByText( '123-456-7890' ) ).toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Phone number' ) ).not.toBeInTheDocument();
	} );

	test( 'renders phone link separately from other text, when not selected', () => {
		const propsNotSelected = {
			...defaultProps,
			attributes: { phone: 'call me on: +1-123-456-7890' },
			isSelected: false,
		};
		render( <PhoneEdit { ...propsNotSelected } /> );

		expect(
			screen.getByRole( 'link', { name: '+1-123-456-7890' } ).getAttribute( 'href' )
		).toEqual( 'tel:+11234567890' );
		expect( screen.getByText( 'call me on:' ) ).toBeInTheDocument();
	} );

	test( 'entering value into the phone field updates the phone attribute', () => {
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <PhoneEdit { ...propsSelected } /> );
		userEvent.paste( screen.getByPlaceholderText( 'Phone number' ), '123-456-7890' );

		expect( setAttributes ).toHaveBeenCalledWith( { phone: '123-456-7890' } );
	} );
} );
