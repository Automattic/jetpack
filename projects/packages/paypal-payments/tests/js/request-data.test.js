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
	productId: 'SKU-1',
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
					product_id: 'SKU-1',
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

	it( 'omits product_id when the field is blank', () => {
		expect(
			buildRequestData( { ...attributes, productId: '' }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'product_id' );
	} );

	// A typed space would reach PayPal as '', which it rejects.
	it( 'omits product_id when the field is only whitespace', () => {
		expect(
			buildRequestData( { ...attributes, productId: '   ' }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'product_id' );
	} );

	// '0' is a real product id, so it must not be dropped as falsy.
	it( 'sends a product id of "0"', () => {
		expect(
			buildRequestData( { ...attributes, productId: '0' }, true ).line_items[ 0 ].product_id
		).toBe( '0' );
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

	// PayPal renders its own label to the buyer, so the merchant's string goes
	// nowhere - and requiring one threw the whole tax away.
	it( 'collects tax without a tax name', () => {
		const [ tax ] = buildRequestData( { ...attributes, taxName: '' }, true ).line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'PERCENTAGE', value: '7.5' } );
	} );

	it( 'leaves taxes out when tax collection is off', () => {
		expect(
			buildRequestData( { ...attributes, taxEnabled: false }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'taxes' );
	} );

	it( 'sends PayPal’s own profile rate as PROFILE', () => {
		const [ tax ] = buildRequestData( { ...attributes, taxType: 'PREFERENCE', taxName: '' }, true )
			.line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'PREFERENCE', value: 'PROFILE' } );
	} );

	// A flat tax is an amount, not a rate. The value stays a string all the way to
	// PayPal so '1.50' does not arrive as 1.5, and zero is a value PayPal stores.
	it.each( [
		[ '1.50', '1.50' ],
		[ '0', '0' ],
	] )( 'sends a flat tax of %s verbatim', ( taxValue, expected ) => {
		const [ tax ] = buildRequestData(
			{ ...attributes, taxType: 'FLAT', taxValue, taxName: '' },
			true
		).line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'FLAT', value: expected } );
	} );
} );

describe( 'keepPayPalOnlyFields', () => {
	const stored = {
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
