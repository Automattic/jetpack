import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

		expect( screen.getByRole( 'link', { name: 'test@example.com' } ) ).toHaveAttribute(
			'href',
			'mailto:test@example.com'
		);
		expect( screen.getByText( 'email me at:' ) ).toBeInTheDocument();
	} );

	test( 'entering value into the email field updates the email attribute', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <EmailEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Email' ) );
		await user.paste( 'test@example.com' );

		expect( setAttributes ).toHaveBeenCalledWith( { email: 'test@example.com' } );
	} );
} );
