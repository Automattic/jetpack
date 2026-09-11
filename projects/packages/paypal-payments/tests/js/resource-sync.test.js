/**
 * Tests for lining a block up with the PayPal payment it points at.
 *
 * @package
 */

import {
	getResourceAttributeUpdates,
	normalizeResourceVariants,
	RESOURCE_ATTRIBUTES,
	withCurrency,
} from '../../src/paypal-payment-buttons/utils/resource-sync';

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
	collectShippingAddress: true,
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

	it( 'reads address collection back from the payment', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				collectShippingAddress: false,
			} )
		).toEqual( { collectShippingAddress: false } );
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

	// The mount GET runs through here, so inventing a primary group would turn the
	// pricing toggle on behind the merchant and brick the form on a saved button.
	it( 'leaves the pricing toggle off for a saved button with no per-option prices', () => {
		const groups = dimensions => ( { dimensions } );
		const current = {
			...blockAttributes,
			variantsEnabled: true,
			variants: groups( [
				{
					_key: 'vb-1',
					name: 'Color',
					primary: false,
					options: [ { _key: 'vb-2', label: 'Red' } ],
				},
			] ),
		};
		const fromResource = {
			...resourceAttributes,
			variantsEnabled: true,
			variants: groups( [ { name: 'Color', options: [ { label: 'Red' } ] } ] ),
		};

		expect( getResourceAttributeUpdates( current, fromResource ) ).toEqual( {} );
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

describe( 'a block built from a fully populated payment', () => {
	const fromResource = {
		isApiManaged: true,
		resourceId: 'PLB-2',
		paymentLink: 'https://www.paypal.com/ncp/payment/PLB-2',
		productName: 'Widget',
		currencyCode: 'USD',
		productDescription: 'A fine widget.',
		imageUrl: 'https://example.com/widget.png',
		variantsEnabled: true,
		variants: {
			dimensions: [
				{
					name: 'Size',
					primary: true,
					options: [
						{ label: 'Small', unit_amount: { currency_code: 'USD', value: '10.00' } },
						{ label: 'Large', unit_amount: { currency_code: 'USD', value: '20.00' } },
					],
				},
				{ name: 'Color', primary: false, options: [ { label: 'Red' } ] },
			],
		},
		adjustableQuantity: true,
		maxQuantity: 5,
		customerNotes: [ { label: 'Engraving', required: true } ],
		taxEnabled: true,
		taxType: 'PERCENTAGE',
		taxName: 'VAT',
		taxValue: '7.5',
		returnUrl: 'https://example.com/thanks',
		collectShippingAddress: false,
	};

	it( 'needs no update', () => {
		const current = {
			...fromResource,
			price: '',
			variants: normalizeResourceVariants( fromResource.variants ),
			imageUrl: 'https://example.com/local.png',
			imageId: 12,
			format: 'QR',
		};

		expect( getResourceAttributeUpdates( current, fromResource ) ).toEqual( {} );
	} );

	it( 'keeps its own image: the payment never overwrites it', () => {
		expect( RESOURCE_ATTRIBUTES ).not.toContain( 'imageUrl' );
		expect( RESOURCE_ATTRIBUTES ).not.toContain( 'imageId' );
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

	// `primary` is what the form reads for "per-variant pricing is on", so guessing at
	// the first group here would reopen a saved button with the product price field gone
	// and a price error on every option.
	it( 'leaves every group unflagged when nothing is priced or flagged', () => {
		const normalized = normalizeResourceVariants( {
			dimensions: [
				{ name: 'Color', options: [ { label: 'Red' } ] },
				{ name: 'Size', options: [ { label: 'Small' } ] },
			],
		} );

		expect( normalized.dimensions.map( dim => dim.primary ) ).toEqual( [ false, false ] );
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

describe( 'withCurrency', () => {
	it( 'retags every priced option, in every group', () => {
		const variants = withCurrency(
			{
				dimensions: [
					{
						name: 'Color',
						primary: true,
						options: [
							{ label: 'Black', unit_amount: { currency_code: 'USD', value: '10.00' } },
							{ label: 'White', unit_amount: { currency_code: 'USD', value: '20.00' } },
						],
					},
					{
						name: 'Size',
						primary: false,
						options: [ { label: 'Small', unit_amount: { currency_code: 'GBP', value: '5.00' } } ],
					},
				],
			},
			'EUR'
		);

		expect(
			variants.dimensions.flatMap( dim => dim.options.map( opt => opt.unit_amount.currency_code ) )
		).toEqual( [ 'EUR', 'EUR', 'EUR' ] );
	} );

	it( 'leaves an unpriced option without an amount', () => {
		const variants = withCurrency(
			{ dimensions: [ { name: 'Size', primary: false, options: [ { label: 'S' } ] } ] },
			'EUR'
		);

		expect( variants.dimensions[ 0 ].options[ 0 ] ).toEqual( { label: 'S' } );
	} );

	it( 'passes through variants it cannot price', () => {
		expect( withCurrency( null, 'EUR' ) ).toBeNull();
		expect( withCurrency( { dimensions: [] }, 'EUR' ) ).toEqual( { dimensions: [] } );
	} );
} );
