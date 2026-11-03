/**
 * Tests for the payment link price helpers.
 *
 * One rule over two shapes: the block's own attributes, and the resource the list
 * route returns. The picker and the details view read different shapes and have to
 * agree, or the same link shows two prices one click apart.
 *
 * @package
 */

import { linkPrice, resourcePrice } from '../../src/paypal-payment-buttons/utils/link-price';

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
