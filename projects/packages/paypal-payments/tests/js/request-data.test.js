/**
 * Tests for building a PayPal payment body from block attributes.
 *
 * @package
 */

import {
	buildRequestData,
	keepPayPalOnlyFields,
} from '../../src/paypal-payment-buttons/utils/request-data';

const attributes = {
	productName: 'Widget',
	price: '9.99',
	currencyCode: 'EUR',
	productDescription: 'A fine widget.',
	imageUrl: 'https://example.com/widget.png',
	returnUrl: 'https://example.com/thanks',
	variantsEnabled: true,
	variants: {
		dimensions: [
			{
				_key: 'd1',
				name: 'Size',
				primary: true,
				options: [
					{ _key: 'o1', label: 'Small', unit_amount: { currency_code: 'USD', value: '10.00' } },
					{ _key: 'o2', label: 'Large', unit_amount: { currency_code: 'USD', value: '20.00' } },
				],
			},
			{ _key: 'd2', name: 'Color', primary: false, options: [ { _key: 'o3', label: 'Red' } ] },
		],
	},
	adjustableQuantity: true,
	maxQuantity: 5,
	customerNotes: [
		{ label: 'Engraving', required: true },
		{ label: '   ', required: false },
	],
	taxEnabled: true,
	taxType: 'PERCENTAGE',
	taxName: 'VAT',
	taxValue: '7.5',
	collectShippingAddress: false,
};

describe( 'buildRequestData', () => {
	it( 'sends every field the block models, with the option prices in the product currency', () => {
		expect( buildRequestData( attributes, true ) ).toEqual( {
			type: 'BUY_NOW',
			integration_mode: 'LINK',
			reusable: 'MULTIPLE',
			return_url: 'https://example.com/thanks',
			line_items: [
				{
					name: 'Widget',
					description: 'A fine widget.',
					image_url: 'https://example.com/widget.png',
					variants: {
						dimensions: [
							{
								_key: 'd1',
								name: 'Size',
								primary: true,
								options: [
									{
										_key: 'o1',
										label: 'Small',
										unit_amount: { currency_code: 'EUR', value: '10.00' },
									},
									{
										_key: 'o2',
										label: 'Large',
										unit_amount: { currency_code: 'EUR', value: '20.00' },
									},
								],
							},
							{
								_key: 'd2',
								name: 'Color',
								primary: false,
								options: [ { _key: 'o3', label: 'Red' } ],
							},
						],
					},
					adjustable_quantity: { maximum: 5 },
					customer_notes: [ { label: 'Engraving', required: true } ],
					taxes: [ { name: 'VAT', type: 'PERCENTAGE', value: '7.5' } ],
					collect_shipping_address: false,
				},
			],
		} );
	} );

	it( 'sends the product price when the options do not carry their own', () => {
		const item = buildRequestData(
			{ ...attributes, variantsEnabled: false, variants: null },
			false
		).line_items[ 0 ];

		expect( item.unit_amount ).toEqual( { currency_code: 'EUR', value: '9.99' } );
		expect( item ).not.toHaveProperty( 'variants' );
	} );

	it( 'leaves the image out when the block has none', () => {
		const item = buildRequestData( { ...attributes, imageUrl: undefined }, true ).line_items[ 0 ];

		expect( item ).not.toHaveProperty( 'image_url' );
	} );
} );

describe( 'keepPayPalOnlyFields', () => {
	const stored = {
		product_id: 'SKU-1',
		shipping: [ { type: 'FLAT', value: '5.00', additional_unit_value: '2.00' } ],
		handling: [ { type: 'FLAT', value: '4.00' } ],
		discounts: [ { type: 'FLAT', value: '2.00' } ],
		collect_shipping_address: true,
	};

	it( 'copies the fields the form cannot edit from the stored payment', () => {
		const data = keepPayPalOnlyFields( buildRequestData( attributes, true ), {
			line_items: [ { name: 'Old name', ...stored } ],
		} );

		expect( data.line_items[ 0 ] ).toMatchObject( stored );
		expect( data.line_items[ 0 ].name ).toBe( 'Widget' );
	} );

	it( 'leaves the image as the block sent it, so removing it there removes it at PayPal', () => {
		const data = keepPayPalOnlyFields( buildRequestData( { ...attributes, imageUrl: '' }, true ), {
			line_items: [ { image_url: 'https://example.com/old.png', ...stored } ],
		} );

		expect( data.line_items[ 0 ] ).not.toHaveProperty( 'image_url' );
	} );

	it( 'passes the request through when nothing is stored', () => {
		const data = buildRequestData( attributes, true );

		expect( keepPayPalOnlyFields( data, {} ) ).toBe( data );
	} );
} );
