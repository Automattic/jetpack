/**
 * Tests for building a PayPal payment body from block attributes.
 *
 * @package
 */

import { buildRequestData } from '../../src/paypal-payment-buttons/utils/request-data';

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
	handlingEnabled: true,
	handlingValue: '4.00',
	discountEnabled: true,
	discountType: 'FLAT',
	discountValue: '2.00',
	shippingEnabled: false,
	shippingMode: 'FLAT',
	shippingValue: '',
	shippingAdditionalValue: '',
	collectShippingAddress: false,
	productId: 'SKU-1',
};

describe( 'buildRequestData', () => {
	describe( 'integration_mode', () => {
		// BUTTON mode is what makes PayPal answer with the SDK snippet.
		it( 'sends BUTTON mode for a stacked block', () => {
			expect(
				buildRequestData( { ...attributes, format: 'STACKED' }, true ).integration_mode
			).toBe( 'BUTTON' );
		} );

		// Two blocks can share one payment, and a downgrade drops the code_snippets
		// the stacked one draws from.
		it( 'keeps the mode the payment already has', () => {
			expect(
				buildRequestData( { ...attributes, format: 'LINK', integrationMode: 'BUTTON' }, true )
					.integration_mode
			).toBe( 'BUTTON' );
		} );

		it( 'falls back to LINK before the payment has been read', () => {
			expect(
				buildRequestData( { ...attributes, format: 'LINK', integrationMode: '' }, true )
					.integration_mode
			).toBe( 'LINK' );
		} );
	} );

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
					handling: [ { type: 'FLAT', value: '4.00' } ],
					discounts: [ { type: 'FLAT', value: '2.00' } ],
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

	it( 'omits product_id when the field is only whitespace', () => {
		expect(
			buildRequestData( { ...attributes, productId: '   ' }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'product_id' );
	} );

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

	// Blank means no tax. '0' is a rate PayPal stores and hands back.
	it( 'leaves taxes out when the rate is blank', () => {
		expect(
			buildRequestData( { ...attributes, taxValue: '', taxName: '' }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'taxes' );
	} );

	it( 'sends a tax rate of zero', () => {
		const [ tax ] = buildRequestData( { ...attributes, taxValue: '0', taxName: '' }, true )
			.line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'PERCENTAGE', value: '0' } );
	} );

	it( 'sends the profile rate when the field is blank', () => {
		const [ tax ] = buildRequestData(
			{ ...attributes, taxType: 'PREFERENCE', taxValue: '', taxName: '' },
			true
		).line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'PREFERENCE', value: 'PROFILE' } );
	} );

	it( 'leaves taxes out when tax collection is off', () => {
		expect(
			buildRequestData( { ...attributes, taxEnabled: false }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'taxes' );
	} );

	it( 'leaves handling out when the toggle is off', () => {
		expect(
			buildRequestData( { ...attributes, handlingEnabled: false }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'handling' );
	} );

	it( 'leaves handling out when the amount is blank', () => {
		expect(
			buildRequestData( { ...attributes, handlingValue: '' }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'handling' );
	} );

	it( 'sends a handling fee of zero', () => {
		const [ handling ] = buildRequestData( { ...attributes, handlingValue: '0' }, true )
			.line_items[ 0 ].handling;

		expect( handling ).toEqual( { type: 'FLAT', value: '0' } );
	} );

	it( 'leaves the discount out when the toggle is off', () => {
		expect(
			buildRequestData( { ...attributes, discountEnabled: false }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'discounts' );
	} );

	// A block saved before the attribute existed has no value.
	it.each( [ '', undefined ] )( 'leaves the discount out when the value is %p', value => {
		expect(
			buildRequestData( { ...attributes, discountValue: value }, true ).line_items[ 0 ]
		).not.toHaveProperty( 'discounts' );
	} );

	// The builder checks for blank. The validator is what blocks a zero.
	it( 'sends a zero discount', () => {
		const [ discount ] = buildRequestData( { ...attributes, discountValue: '0' }, true )
			.line_items[ 0 ].discounts;

		expect( discount ).toEqual( { type: 'FLAT', value: '0' } );
	} );

	it( 'sends a percentage discount as PERCENTAGE', () => {
		const [ discount ] = buildRequestData(
			{ ...attributes, discountType: 'PERCENTAGE', discountValue: '15' },
			true
		).line_items[ 0 ].discounts;

		expect( discount ).toEqual( { type: 'PERCENTAGE', value: '15' } );
	} );

	it( 'sends back a discount type the block has no option for', () => {
		const [ discount ] = buildRequestData( { ...attributes, discountType: 'TIERED' }, true )
			.line_items[ 0 ].discounts;

		expect( discount ).toEqual( { type: 'TIERED', value: '2.00' } );
	} );

	it( 'falls back to a flat discount when the type is missing', () => {
		const [ discount ] = buildRequestData( { ...attributes, discountType: undefined }, true )
			.line_items[ 0 ].discounts;

		expect( discount ).toEqual( { type: 'FLAT', value: '2.00' } );
	} );

	it( 'sends PayPal’s own profile rate as PROFILE', () => {
		const [ tax ] = buildRequestData( { ...attributes, taxType: 'PREFERENCE', taxName: '' }, true )
			.line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'PREFERENCE', value: 'PROFILE' } );
	} );

	// The value stays a string, so '1.50' reaches PayPal as '1.50'.
	it.each( [
		[ '1.50', '1.50' ],
		[ '0', '0' ],
	] )( 'sends a flat tax of %s unchanged', ( taxValue, expected ) => {
		const [ tax ] = buildRequestData(
			{ ...attributes, taxType: 'FLAT', taxValue, taxName: '' },
			true
		).line_items[ 0 ].taxes;

		expect( tax ).toEqual( { type: 'FLAT', value: expected } );
	} );
} );

describe( 'buildRequestData shipping', () => {
	const ship = overrides =>
		buildRequestData( { ...attributes, shippingEnabled: true, ...overrides }, true )
			.line_items[ 0 ];

	it( 'leaves shipping out when the toggle is off', () => {
		const item = buildRequestData( { ...attributes, shippingValue: '5.00' }, true ).line_items[ 0 ];

		expect( item ).not.toHaveProperty( 'shipping' );
	} );

	it.each( [ '', undefined ] )( 'leaves shipping out when the fee is %p', shippingValue => {
		expect( ship( { shippingMode: 'FLAT', shippingValue } ) ).not.toHaveProperty( 'shipping' );
	} );

	it( 'treats a missing mode as a specific fee', () => {
		expect( ship( { shippingMode: undefined, shippingValue: '5.00' } ).shipping ).toEqual( [
			{ type: 'FLAT', value: '5.00' },
		] );
	} );

	it.each( [
		[ 'PROFILE', { type: 'PREFERENCE', value: 'PROFILE' } ],
		[ 'FREE', { type: 'PREFERENCE', value: 'FREE_SHIPPING' } ],
	] )( 'sends %s as a preference, ignoring any leftover fee', ( shippingMode, expected ) => {
		expect( ship( { shippingMode, shippingValue: '5.00' } ).shipping ).toEqual( [ expected ] );
	} );

	// The select falls back to PROFILE for an unknown mode too.
	it( 'sends an unknown mode as the PROFILE preference', () => {
		expect( ship( { shippingMode: 'PICKUP', shippingValue: '' } ).shipping ).toEqual( [
			{ type: 'PREFERENCE', value: 'PROFILE' },
		] );
	} );

	it( 'sends a specific fee as a flat amount', () => {
		expect( ship( { shippingMode: 'FLAT', shippingValue: '5.00' } ).shipping ).toEqual( [
			{ type: 'FLAT', value: '5.00' },
		] );
	} );

	it( 'sends the additional items fee under quantity-based shipping', () => {
		expect(
			ship( {
				shippingMode: 'QUANTITY',
				shippingValue: '5.00',
				shippingAdditionalValue: '2.00',
			} ).shipping
		).toEqual( [ { type: 'FLAT', value: '5.00', additional_unit_value: '2.00' } ] );
	} );

	it( 'omits a blank additional items fee', () => {
		expect(
			ship( { shippingMode: 'QUANTITY', shippingValue: '5.00', shippingAdditionalValue: '' } )
				.shipping
		).toEqual( [ { type: 'FLAT', value: '5.00' } ] );
	} );

	it( 'sends a zero shipping fee', () => {
		expect(
			ship( { shippingMode: 'QUANTITY', shippingValue: '0', shippingAdditionalValue: '0' } )
				.shipping
		).toEqual( [ { type: 'FLAT', value: '0', additional_unit_value: '0' } ] );
	} );

	// The shipping toggle clears the attribute, so the builder sends it as it stands.
	it( 'sends the address preference whether or not shipping is on', () => {
		expect( ship( { collectShippingAddress: true } ).collect_shipping_address ).toBe( true );
		expect(
			buildRequestData( { ...attributes, collectShippingAddress: true }, true ).line_items[ 0 ]
				.collect_shipping_address
		).toBe( true );
	} );
} );
