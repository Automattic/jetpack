/**
 * Tests for the payment link price helpers.
 *
 * One rule over two shapes: the block's own attributes, and the resource the list
 * route returns. The picker and the details view read different shapes and have to
 * agree, or the same link shows two prices one click apart.
 *
 * @package
 */

import {
	discountedPrice,
	discountLabel,
	linkPrice,
	resourcePrice,
} from '../../src/paypal-payment-buttons/utils/link-price';

/**
 * A resource in the shape the list route returns.
 *
 * @param {object} item - The line item's fields.
 * @return {object} The resource.
 */
const resource = item => ( { line_items: [ item ] } );

describe( 'linkPrice', () => {
	it( 'formats the product price in its own currency', () => {
		expect( linkPrice( { price: '29.99', currencyCode: 'EUR' } ) ).toBe( '€29.99' );
	} );

	it( 'falls back to USD when the block carries no currency', () => {
		expect( linkPrice( { price: '5.00', currencyCode: '' } ) ).toBe( '$5.00' );
	} );

	it( 'reads a price with spaces around it', () => {
		expect( linkPrice( { price: ' 12.00 ', currencyCode: 'USD' } ) ).toBe( '$12.00' );
	} );

	it.each( [
		[ 'missing', undefined ],
		[ 'blank', '' ],
		[ 'only spaces', '   ' ],
	] )( 'returns an empty price when the price is %s', ( _label, price ) => {
		expect( linkPrice( { price, currencyCode: 'USD' } ) ).toBe( '' );
	} );

	it( 'returns an empty price when called with no link', () => {
		expect( linkPrice() ).toBe( '' );
	} );

	// PayPal drops the product amount once the primary group is priced, so the headline
	// is the cheapest option a buyer can pick.
	it( 'leads with the cheapest option once the primary group is priced', () => {
		expect(
			linkPrice( {
				price: '',
				currencyCode: 'GBP',
				variantsEnabled: true,
				variants: {
					dimensions: [
						{
							name: 'Size',
							primary: true,
							options: [
								{ label: 'Large', unit_amount: { value: '9.00' } },
								{ label: 'Small', unit_amount: { value: '4.50' } },
							],
						},
					],
				},
			} )
		).toBe( 'From £4.50' );
	} );

	it( 'ignores an amount left on a group that is not primary', () => {
		expect(
			linkPrice( {
				price: '20.00',
				currencyCode: 'USD',
				variantsEnabled: true,
				variants: {
					dimensions: [
						{ name: 'Size', primary: true, options: [ { label: 'Small' } ] },
						{
							name: 'Colour',
							primary: false,
							options: [ { label: 'Red', unit_amount: { value: '3.00' } } ],
						},
					],
				},
			} )
		).toBe( '$20.00' );
	} );
} );

describe( 'resourcePrice', () => {
	it( 'returns an empty price for a resource with no line items', () => {
		expect( resourcePrice( { line_items: [] } ) ).toBe( '' );
		expect( resourcePrice( {} ) ).toBe( '' );
		expect( resourcePrice() ).toBe( '' );
	} );

	it( 'reads the product amount and its currency', () => {
		expect(
			resourcePrice( resource( { unit_amount: { value: '15.00', currency_code: 'EUR' } } ) )
		).toBe( '€15.00' );
	} );

	// The product currency goes with the product amount it sits on.
	it( 'takes the currency off a priced option when the product amount is gone', () => {
		expect(
			resourcePrice(
				resource( {
					variants: {
						dimensions: [
							{
								name: 'Size',
								primary: true,
								options: [
									{ label: 'Large', unit_amount: { value: '9.00', currency_code: 'GBP' } },
									{ label: 'Small', unit_amount: { value: '4.50', currency_code: 'GBP' } },
								],
							},
						],
					},
				} )
			)
		).toBe( 'From £4.50' );
	} );

	// The same primary rule as the block shape, over the resource shape.
	it( 'ignores an amount left on a group that is not primary', () => {
		expect(
			resourcePrice(
				resource( {
					unit_amount: { value: '20.00', currency_code: 'USD' },
					variants: {
						dimensions: [
							{ name: 'Size', primary: true, options: [ { label: 'Small' } ] },
							{
								name: 'Colour',
								primary: false,
								options: [ { label: 'Red', unit_amount: { value: '3.00', currency_code: 'USD' } } ],
							},
						],
					},
				} )
			)
		).toBe( '$20.00' );
	} );

	it( 'returns an empty price for a line item with nothing priced', () => {
		expect( resourcePrice( resource( { name: 'Croissant' } ) ) ).toBe( '' );
	} );

	it( 'matches linkPrice on the same link', () => {
		const variants = {
			dimensions: [
				{
					name: 'Size',
					primary: true,
					options: [ { label: 'Small', unit_amount: { value: '4.50', currency_code: 'GBP' } } ],
				},
			],
		};

		expect( resourcePrice( resource( { variants } ) ) ).toBe( 'From £4.50' );
		expect( linkPrice( { price: '', currencyCode: 'GBP', variantsEnabled: true, variants } ) ).toBe(
			'From £4.50'
		);
	} );
} );

describe( 'discountedPrice', () => {
	// PayPal rounds the discount half up to the currency's smallest unit, then subtracts it.
	// The 0.99, 0.50, ¥999 and ¥10 rows are PayPal's measured prices.
	it.each( [
		[ '10% off $1.00', '$0.90', '1.00', 'USD', 'PERCENTAGE', '10' ],
		[ '10% off $1', '$0.90', '1', 'USD', 'PERCENTAGE', '10' ],
		[ '$2.00 off $10.00', '$8.00', '10.00', 'USD', 'FLAT', '2.00' ],
		[ '15% off $0.99', '$0.84', '0.99', 'USD', 'PERCENTAGE', '15' ],
		[ '15% off ¥999', '¥849', '999', 'JPY', 'PERCENTAGE', '15' ],
		[ '5% off $0.50', '$0.47', '0.50', 'USD', 'PERCENTAGE', '5' ],
		[ '5% off ¥10', '¥9', '10', 'JPY', 'PERCENTAGE', '5' ],
		[ '$10.00 off $10.00', '$0.00', '10.00', 'USD', 'FLAT', '10.00' ],
		[ '$12.00 off $10.00', '-$2.00', '10.00', 'USD', 'FLAT', '12.00' ],
		[ '100% off $10.00', '$0.00', '10.00', 'USD', 'PERCENTAGE', '100' ],
		[ '10.5% off $10.00', '$8.95', '10.00', 'USD', 'PERCENTAGE', '10.5' ],
		[ '2.00 of an unknown type off $10.00', '$8.00', '10.00', 'USD', 'AMOUNT', '2.00' ],
		[ '64.6% off $2.50', '$0.88', '2.50', 'USD', 'PERCENTAGE', '64.6' ],
		[ '$1.005 off $10.00', '$8.99', '10.00', 'USD', 'FLAT', '1.005' ],
		[ '10% off $1.005', '$0.91', '1.005', 'USD', 'PERCENTAGE', '10' ],
		[ '.5% off $10.00', '$9.95', '10.00', 'USD', 'PERCENTAGE', '.5' ],
		[ '$2. off $10.', '$8.00', '10.', 'USD', 'FLAT', '2.' ],
		[ '10% typed with spaces off $10.00', '$9.00', '10.00', 'USD', 'PERCENTAGE', ' 10 ' ],
		[ '2.00 off 10.00 with no currency', '$8.00', '10.00', '', 'FLAT', '2.00' ],
	] )( '%s comes to %s', ( _label, expected, value, currencyCode, discountType, discountValue ) => {
		expect(
			discountedPrice( value, {
				currencyCode,
				discountEnabled: true,
				discountType,
				discountValue,
			} )
		).toBe( expected );
	} );

	it.each( [
		[ 'the discount is turned off', '10.00', false, '10' ],
		[ 'the discount is blank', '10.00', true, '' ],
		[ 'the discount is only spaces', '10.00', true, '  ' ],
		[ 'the discount is a word', '10.00', true, 'abc' ],
		[ 'the discount has letters after the number', '10.00', true, '10abc' ],
		[ 'the discount has letters before the number', '10.00', true, 'abc10' ],
		[ 'the price is blank', '', true, '10' ],
	] )( 'keeps the full price when %s', ( _label, value, discountEnabled, discountValue ) => {
		expect(
			discountedPrice( value, {
				currencyCode: 'USD',
				discountEnabled,
				discountType: 'PERCENTAGE',
				discountValue,
			} )
		).toBe( '' );
	} );

	it( 'keeps the full price with no discount settings', () => {
		expect( discountedPrice( '10.00' ) ).toBe( '' );
	} );
} );

describe( 'discountLabel', () => {
	it.each( [
		[ '10% discount', '10 percent', 'PERCENTAGE', '10', 'USD' ],
		[ '10.5% discount', '10.5 percent', 'PERCENTAGE', '10.5', 'USD' ],
		[ '10% discount', '10 percent typed with spaces', 'PERCENTAGE', ' 10 ', 'USD' ],
		[ '$2.00 discount', '2.00 off', 'FLAT', '2.00', 'USD' ],
		[ '$2.00 discount', '2.00 off typed with spaces', 'FLAT', ' 2.00 ', 'USD' ],
		[ '¥150 discount', '150 off in yen', 'FLAT', '150', 'JPY' ],
		[ '$2.00 discount', '2.00 off with no currency', 'FLAT', '2.00', '' ],
		[ '$2.00 discount', '2.00 of an unknown type', 'AMOUNT', '2.00', 'USD' ],
	] )( 'reads %s for %s', ( expected, _label, discountType, discountValue, currencyCode ) => {
		expect( discountLabel( { discountType, discountValue, currencyCode } ) ).toBe( expected );
	} );
} );
