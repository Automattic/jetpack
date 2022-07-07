import { render, screen } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
// this is necessary because block editor store becomes unregistered during jest initialization
import { store as blockEditorStore } from '@wordpress/block-editor';
import { register } from '@wordpress/data';
import { SimplePaymentsEdit } from '../edit';

register( blockEditorStore );

const setAttributes = jest.fn();
beforeEach( () => {
	jest
		.spyOn( Intl, 'NumberFormat' )
		.mockImplementation()
		.mockImplementation( () => ( { format: value => `A$${ value.toString() }.00` } ) );
} );
afterEach( () => {
	jest.resetAllMocks();
} );

const props = {
	attributes: {
		productId: 1,
	},
	postLinKText: 'Click here to buy',
	setAttributes,
	isSelected: true,
	isPostEditor: true,
};

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

	test( 'updates item name attribute if item name input updated', async () => {
		const user = userEvent.setup( {
			// The pointer event check is apparently buggy (as of @testing-library/user-event 14.1.1).
			pointerEventsCheck: PointerEventsCheckLevel.Never,
		} );
		render( <SimplePaymentsEdit { ...props } /> );
		await user.type( screen.getByLabelText( 'Item name' ), 'A' );
		expect( setAttributes ).toHaveBeenCalledWith( { title: 'A' } );
	} );

	test( 'validates name', () => {
		const notSelectedProps = {
			...props,
			isSelected: false,
			attributes: { title: '' },
		};
		const { rerender } = render( <SimplePaymentsEdit { ...props } /> );

		rerender( <SimplePaymentsEdit { ...notSelectedProps } /> );

		expect( screen.getByText( 'Please add a brief title', { exact: false } ) ).toBeInTheDocument();
	} );

	test( 'updates description attribute if description input updated', async () => {
		const user = userEvent.setup( {
			// The pointer event check is apparently buggy (as of @testing-library/user-event 14.1.1).
			pointerEventsCheck: PointerEventsCheckLevel.Never,
		} );
		render( <SimplePaymentsEdit { ...props } /> );
		await user.type( screen.getByLabelText( 'Describe your item in a few words' ), 'B' );
		expect( setAttributes ).toHaveBeenCalledWith( { content: 'B' } );
	} );

	test( 'updates price attribute if price input updated', async () => {
		const user = userEvent.setup( {
			// The pointer event check is apparently buggy (as of @testing-library/user-event 14.1.1).
			pointerEventsCheck: PointerEventsCheckLevel.Never,
		} );
		render( <SimplePaymentsEdit { ...props } /> );
		await user.click( screen.getByLabelText( 'Price' ) );
		await user.paste( '1' );
		expect( setAttributes ).toHaveBeenCalledWith( { price: 1 } );
	} );

	test( 'validates price', () => {
		const notSelectedProps = {
			...props,
			isSelected: false,
			attributes: { price: 0 },
		};
		const { rerender } = render( <SimplePaymentsEdit { ...props } /> );

		rerender( <SimplePaymentsEdit { ...notSelectedProps } /> );

		expect(
			screen.getByText( 'If you’re selling something, you need a price tag', { exact: false } )
		).toBeInTheDocument();
	} );

	test( 'sets currency attribute', async () => {
		const user = userEvent.setup();
		render( <SimplePaymentsEdit { ...props } /> );
		await user.selectOptions( screen.getByLabelText( 'Currency' ), [ 'AUD' ] );

		expect( setAttributes ).toHaveBeenCalledWith( { currency: 'AUD' } );
	} );

	test( 'toggles allow multiple', async () => {
		const user = userEvent.setup( {
			// The pointer event check is apparently buggy (as of @testing-library/user-event 14.1.1).
			pointerEventsCheck: PointerEventsCheckLevel.Never,
		} );
		render( <SimplePaymentsEdit { ...props } /> );
		await user.click( screen.getByLabelText( 'Allow people to buy more than one item at a time' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { multiple: true } );
	} );

	test( 'updates email attribute if email input updated', async () => {
		const user = userEvent.setup( {
			// The pointer event check is apparently buggy (as of @testing-library/user-event 14.1.1).
			pointerEventsCheck: PointerEventsCheckLevel.Never,
		} );
		render( <SimplePaymentsEdit { ...props } /> );
		await user.click( screen.getByPlaceholderText( 'Email' ) );
		await user.paste( 'bob@bob.com' );
		expect( setAttributes ).toHaveBeenCalledWith( { email: 'bob@bob.com' } );
	} );

	test( 'validates email', () => {
		const notSelectedProps = {
			...props,
			isSelected: false,
			attributes: { email: 'my-invalid-email' },
		};
		const { rerender } = render( <SimplePaymentsEdit { ...props } /> );

		rerender( <SimplePaymentsEdit { ...notSelectedProps } /> );

		expect( screen.getByText( 'not a valid email address', { exact: false } ) ).toBeInTheDocument();
	} );

	test( 'displays title and price fields when not selected', () => {
		const notSelectedProps = {
			...props,
			isSelected: false,
			attributes: { email: 'bob@bob.com', currency: 'AUD', price: 10.0, title: 'White TShirt' },
		};

		render( <SimplePaymentsEdit { ...notSelectedProps } /> );

		expect( screen.getByText( 'White TShirt' ) ).toBeInTheDocument();
		expect( screen.getByText( 'A$10.00' ) ).toBeInTheDocument();
	} );
} );
