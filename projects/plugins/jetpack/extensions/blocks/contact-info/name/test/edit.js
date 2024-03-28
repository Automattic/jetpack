import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NameEdit from '../edit';

const setAttributes = jest.fn();

const defaultAttributes = {
	name: '',
};

const defaultProps = {
	attributes: defaultAttributes,
	isSelected: false,
	setAttributes,
};

describe( 'Name', () => {
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders placeholder if not selected, and no content is entered', () => {
		const propsNotSelected = { ...defaultProps, isSelected: false };
		render( <NameEdit { ...propsNotSelected } /> );

		expect( screen.getByPlaceholderText( 'Name' ) ).toBeInTheDocument();
	} );

	test( 'renders name, and no placeholders, when not selected', () => {
		const propsNotSelected = {
			...defaultProps,
			attributes: { name: 'Acme Corporation' },
			isSelected: false,
		};
		render( <NameEdit { ...propsNotSelected } /> );

		expect( screen.getByText( 'Acme Corporation' ) ).toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Name' ) ).not.toBeInTheDocument();
	} );

	test( 'entering value into the name field updates the name attribute', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <NameEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Name' ) );
		await user.paste( 'Acme Corporation' );

		expect( setAttributes ).toHaveBeenCalledWith( { name: 'Acme Corporation' } );
	} );
} );
