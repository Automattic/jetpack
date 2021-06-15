/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import EmailEdit from '../edit';

const setAttributes = jest.fn();

const defaultAttributes = {
	email: '',
};

const defaultProps = {
	attributes: defaultAttributes,
	isSelected: false,
	setAttributes,
};

describe( 'Email', () => {
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders placeholder if not selected, and no content is entered', () => {
		const propsNotSelected = { ...defaultProps, isSelected: false };
		render( <EmailEdit { ...propsNotSelected } /> );

		expect( screen.getByPlaceholderText( 'Email' ) ).toBeInTheDocument();
	} );

	test( 'renders email, and no placeholders, when not selected', () => {
		const propsNotSelected = {
			...defaultProps,
			attributes: { email: 'test@example.com' },
			isSelected: false,
		};
		render( <EmailEdit { ...propsNotSelected } /> );

		expect( screen.getByText( 'test@example.com' ) ).toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Email' ) ).not.toBeInTheDocument();
	} );

	test( 'renders email link separately from other text, when not selected', () => {
		const propsNotSelected = {
			...defaultProps,
			attributes: { email: 'email me at: test@example.com' },
			isSelected: false,
		};
		render( <EmailEdit { ...propsNotSelected } /> );

		expect(
			screen.getByRole( 'link', { name: 'test@example.com' } ).getAttribute( 'href' )
		).toEqual( 'mailto:test@example.com' );
		expect( screen.getByText( 'email me at:' ) ).toBeInTheDocument();
	} );

	test( 'entering value into the email field updates the email attribute', () => {
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <EmailEdit { ...propsSelected } /> );
		userEvent.paste( screen.getByPlaceholderText( 'Email' ), 'test@example.com' );

		expect( setAttributes ).toHaveBeenCalledWith( { email: 'test@example.com' } );
	} );
} );
