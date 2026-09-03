/**
 * Tests for lining a block up with the PayPal payment it points at.
 *
 * @package
 */

import {
	getResourceAttributeUpdates,
	normalizeResourceVariants,
} from '../../src/paypal-payment-buttons/resource-sync';

const blockAttributes = {
	isApiManaged: true,
	resourceId: 'PLB-1',
	paymentLink: 'https://www.paypal.com/ncp/payment/PLB-1',
	productName: 'Widget',
	price: '9.99',
	currencyCode: 'USD',
	productDescription: '',
	variantsEnabled: false,
	variants: null,
	adjustableQuantity: false,
	maxQuantity: 10,
	customerNotes: [],
	taxEnabled: false,
	taxType: 'PERCENTAGE',
	taxName: 'Sales Tax',
	taxValue: '',
	returnUrl: '',
	imageUrl: 'https://example.com/widget.jpg',
	format: 'QR',
};

const resourceAttributes = {
	isApiManaged: true,
	resourceId: 'PLB-1',
	paymentLink: 'https://www.paypal.com/ncp/payment/PLB-1',
	productName: 'Widget',
	price: '9.99',
	currencyCode: 'USD',
};

describe( 'getResourceAttributeUpdates', () => {
	it( 'returns nothing when the block already matches the payment', () => {
		expect( getResourceAttributeUpdates( blockAttributes, resourceAttributes ) ).toEqual( {} );
	} );

	it( 'picks up a product and price changed through another block', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				productName: 'duplicate',
				price: '49.00',
			} )
		).toEqual( { productName: 'duplicate', price: '49.00' } );
	} );

	it( 'leaves block-only attributes alone', () => {
		const updates = getResourceAttributeUpdates( blockAttributes, {
			...resourceAttributes,
			imageUrl: 'https://example.com/other.jpg',
			format: 'BUTTON',
		} );
		expect( updates ).toEqual( {} );
	} );

	it( 'clears a field the payment no longer carries', () => {
		expect(
			getResourceAttributeUpdates(
				{
					...blockAttributes,
					productDescription: 'Old copy',
					returnUrl: 'https://example.com/thanks',
				},
				resourceAttributes
			)
		).toEqual( { productDescription: '', returnUrl: '' } );
	} );

	it( 'clears a leftover product price when the payment prices per option', () => {
		const { price, ...perOptionResource } = resourceAttributes;
		const updates = getResourceAttributeUpdates( blockAttributes, {
			...perOptionResource,
			variantsEnabled: true,
			variants: {
				dimensions: [
					{
						name: 'Size',
						primary: true,
						options: [ { label: 'Small', unit_amount: { currency_code: 'USD', value: '12.50' } } ],
					},
				],
			},
		} );

		expect( price ).toBe( '9.99' );
		expect( updates.price ).toBe( '' );
		expect( updates.variantsEnabled ).toBe( true );
		expect( updates.variants.dimensions[ 0 ].options[ 0 ].unit_amount.value ).toBe( '12.50' );
	} );

	it( 'treats editor keys and empty per-option amounts as no difference', () => {
		const current = {
			...blockAttributes,
			variantsEnabled: true,
			variants: {
				dimensions: [
					{
						_key: 'vb-1',
						name: 'Size',
						primary: true,
						options: [
							{ _key: 'vb-2', label: 'Small', unit_amount: { currency_code: 'USD', value: '' } },
							{ _key: 'vb-3', label: 'Large', unit_amount: { currency_code: 'USD', value: '' } },
						],
					},
				],
			},
		};
		const fromResource = {
			...resourceAttributes,
			variantsEnabled: true,
			variants: {
				dimensions: [
					{ name: 'Size', primary: true, options: [ { label: 'Small' }, { label: 'Large' } ] },
				],
			},
		};

		expect( getResourceAttributeUpdates( current, fromResource ) ).toEqual( {} );
	} );
} );

describe( 'normalizeResourceVariants', () => {
	it( 'returns null when there are no option groups', () => {
		expect( normalizeResourceVariants( null ) ).toBeNull();
		expect( normalizeResourceVariants( { dimensions: [] } ) ).toBeNull();
	} );

	it( 'gives every group and option a key the variant builder can use', () => {
		const normalized = normalizeResourceVariants( {
			dimensions: [ { name: 'Size', primary: true, options: [ { label: 'Small' } ] } ],
		} );

		expect( normalized.dimensions[ 0 ]._key ).toEqual( expect.any( String ) );
		expect( normalized.dimensions[ 0 ].options[ 0 ]._key ).toEqual( expect.any( String ) );
	} );

	it( 'infers the primary group from where the prices are when the flag is missing', () => {
		const normalized = normalizeResourceVariants( {
			dimensions: [
				{ name: 'Color', options: [ { label: 'Red' } ] },
				{
					name: 'Size',
					options: [ { label: 'Small', unit_amount: { currency_code: 'USD', value: '12.50' } } ],
				},
			],
		} );

		expect( normalized.dimensions.map( dim => dim.primary ) ).toEqual( [ false, true ] );
	} );

	it( 'falls back to the first group when nothing is priced or flagged', () => {
		const normalized = normalizeResourceVariants( {
			dimensions: [
				{ name: 'Color', options: [ { label: 'Red' } ] },
				{ name: 'Size', options: [ { label: 'Small' } ] },
			],
		} );

		expect( normalized.dimensions.map( dim => dim.primary ) ).toEqual( [ true, false ] );
	} );

	it( 'keeps the flag when the payment carries one', () => {
		const normalized = normalizeResourceVariants( {
			dimensions: [
				{ name: 'Color', primary: false, options: [ { label: 'Red' } ] },
				{ name: 'Size', primary: true, options: [ { label: 'Small' } ] },
			],
		} );

		expect( normalized.dimensions.map( dim => dim.primary ) ).toEqual( [ false, true ] );
	} );
} );
