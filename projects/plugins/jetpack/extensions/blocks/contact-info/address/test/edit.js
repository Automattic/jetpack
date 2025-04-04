import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressEdit from '../edit';

const defaultAttributes = {
	address: '',
	addressLine2: '',
	addressLine3: '',
	city: '',
	region: '',
	postal: '',
	country: '',
	linkToGoogleMaps: false,
};

const completeAddress = {
	addressLine1: 'ATTN: Test Person',
	addressLine2: '987 Photon Drive',
	addressLine3: 'Apartment 5',
	city: 'Speedyville',
	region: 'CA',
	postal: '12345',
	country: 'USA',
};

const partialAddress = {
	address: '987 Photon Drive',
};

const setAttributes = jest.fn();

const defaultProps = {
	attributes: defaultAttributes,
	isSelected: false,
	setAttributes,
};

describe( 'Address', () => {
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders placeholders if not selected, and no content is entered', () => {
		const propsNotSelected = { ...defaultProps, isSelected: false };
		render( <AddressEdit { ...propsNotSelected } /> );

		expect( screen.getByPlaceholderText( 'Street Address' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Address Line 2' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Address Line 3' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'City' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'State/Province/Region' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Postal/Zip Code' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Country' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Link address to Google Maps' ) ).toBeInTheDocument();
	} );

	test( 'renders partial address, and no placeholders, when not selected', () => {
		const propsNotSelected = {
			...defaultProps,
			attributes: { ...defaultAttributes, ...partialAddress },
			isSelected: false,
		};
		render( <AddressEdit { ...propsNotSelected } /> );

		expect( screen.getByText( '987 Photon Drive' ) ).toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Street Address' ) ).not.toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Address Line 2' ) ).not.toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Address Line 3' ) ).not.toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'City' ) ).not.toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'State/Province/Region' ) ).not.toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Postal/Zip Code' ) ).not.toBeInTheDocument();
		expect( screen.queryByPlaceholderText( 'Country' ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( 'Link address to Google Maps' ) ).not.toBeInTheDocument();
	} );

	test( 'renders partial address, and all other placeholders, when selected', () => {
		const propsSelected = {
			...defaultProps,
			attributes: { ...defaultAttributes, ...partialAddress },
			isSelected: true,
		};
		render( <AddressEdit { ...propsSelected } /> );

		expect( screen.getByPlaceholderText( 'Street Address' ).value ).toBe( '987 Photon Drive' );
		expect( screen.getByPlaceholderText( 'Address Line 2' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Address Line 3' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'City' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'State/Province/Region' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Postal/Zip Code' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Country' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Link address to Google Maps' ) ).toBeInTheDocument();
	} );

	test( 'updates Google Maps setting when selected', async () => {
		const user = userEvent.setup();
		const propsSelected = {
			...defaultProps,
			attributes: { ...defaultAttributes, ...completeAddress },
			isSelected: true,
		};
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByLabelText( 'Link address to Google Maps' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { linkToGoogleMaps: true } );
	} );

	test( 'entering value into the address field updates the address', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Street Address' ) );
		await user.paste( 'ATTN: Test Person' );

		expect( setAttributes ).toHaveBeenCalledWith( { address: completeAddress.addressLine1 } );
	} );

	test( 'entering value into the addressLine2 field updates the address', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Address Line 2' ) );
		await user.paste( '987 Photon Drive' );

		expect( setAttributes ).toHaveBeenCalledWith( { addressLine2: completeAddress.addressLine2 } );
	} );

	test( 'entering value into the addressLine3 field updates the address', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Address Line 3' ) );
		await user.paste( 'Apartment 5' );

		expect( setAttributes ).toHaveBeenCalledWith( { addressLine3: completeAddress.addressLine3 } );
	} );

	test( 'entering value into the city field updates the city', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'City' ) );
		await user.paste( 'Speedyville' );

		expect( setAttributes ).toHaveBeenCalledWith( { city: completeAddress.city } );
	} );

	test( 'entering value into the region field updates the region', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'State/Province/Region' ) );
		await user.paste( 'CA' );

		expect( setAttributes ).toHaveBeenCalledWith( { region: completeAddress.region } );
	} );

	test( 'entering value into the postal field updates the postal code', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Postal/Zip Code' ) );
		await user.paste( '12345' );

		expect( setAttributes ).toHaveBeenCalledWith( { postal: completeAddress.postal } );
	} );

	test( 'entering value into the country field updates the country', async () => {
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		render( <AddressEdit { ...propsSelected } /> );
		await user.click( screen.getByPlaceholderText( 'Country' ) );
		await user.paste( 'USA' );

		expect( setAttributes ).toHaveBeenCalledWith( { country: completeAddress.country } );
	} );
} );
