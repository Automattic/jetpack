/**
 * Tests for lining a block up with the PayPal payment it points at.
 *
 * @package
 */

import metadata from '../../src/paypal-payment-buttons/block.json';
import {
	GATED_ATTRIBUTES,
	getResourceAttributeUpdates,
	normalizeResourceVariants,
	RESOURCE_ATTRIBUTES,
	resetToDefaults,
	turnGateOff,
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
	productId: '',
	variantsEnabled: false,
	variants: null,
	adjustableQuantity: false,
	maxQuantity: 10,
	customerNotes: [],
	taxEnabled: false,
	taxType: 'PERCENTAGE',
	taxName: 'Sales Tax',
	taxValue: '',
	handlingEnabled: false,
	handlingValue: '',
	discountEnabled: false,
	discountType: 'FLAT',
	discountValue: '',
	returnUrl: '',
	collectShippingAddress: false,
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
					productId: 'SKU-1',
					returnUrl: 'https://example.com/thanks',
				},
				resourceAttributes
			)
		).toEqual( { productDescription: '', productId: '', returnUrl: '' } );
	} );

	it( 'reads the product id back from the payment', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				productId: 'SKU-1',
			} )
		).toEqual( { productId: 'SKU-1' } );
	} );

	it( 'leaves the product id alone when it already matches', () => {
		expect(
			getResourceAttributeUpdates(
				{ ...blockAttributes, productId: 'SKU-1' },
				{ ...resourceAttributes, productId: 'SKU-1' }
			)
		).toEqual( {} );
	} );

	it( 'reads the handling fee back from the payment', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				handlingEnabled: true,
				handlingValue: '4.00',
			} )
		).toEqual( { handlingEnabled: true, handlingValue: '4.00' } );
	} );

	it( 'clears a handling fee the payment no longer has', () => {
		expect(
			getResourceAttributeUpdates(
				{ ...blockAttributes, handlingEnabled: true, handlingValue: '4.00' },
				resourceAttributes
			)
		).toEqual( { handlingEnabled: false, handlingValue: '' } );
	} );

	it( 'reads quantity-based shipping back from the payment', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				shippingEnabled: true,
				shippingMode: 'QUANTITY',
				shippingValue: '5.00',
				shippingAdditionalValue: '2.00',
			} )
		).toEqual( {
			shippingEnabled: true,
			shippingMode: 'QUANTITY',
			shippingValue: '5.00',
			shippingAdditionalValue: '2.00',
		} );
	} );

	// Free shipping has no fee, so the amounts clear along with the mode.
	it( 'clears the fees when the payment switches to free shipping', () => {
		expect(
			getResourceAttributeUpdates(
				{
					...blockAttributes,
					shippingEnabled: true,
					shippingMode: 'QUANTITY',
					shippingValue: '5.00',
					shippingAdditionalValue: '2.00',
				},
				{ ...resourceAttributes, shippingEnabled: true, shippingMode: 'FREE', shippingValue: '' }
			)
		).toEqual( { shippingMode: 'FREE', shippingValue: '', shippingAdditionalValue: '' } );
	} );

	it( 'clears shipping the payment no longer has', () => {
		expect(
			getResourceAttributeUpdates(
				{
					...blockAttributes,
					shippingEnabled: true,
					shippingMode: 'FLAT',
					shippingValue: '5.00',
				},
				resourceAttributes
			)
		).toEqual( { shippingEnabled: false, shippingValue: '' } );
	} );

	it( 'reads the discount back from the payment', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				discountEnabled: true,
				discountType: 'PERCENTAGE',
				discountValue: '15',
			} )
		).toEqual( { discountEnabled: true, discountType: 'PERCENTAGE', discountValue: '15' } );
	} );

	it( 'clears a discount the payment no longer has', () => {
		expect(
			getResourceAttributeUpdates(
				{
					...blockAttributes,
					discountEnabled: true,
					discountType: 'PERCENTAGE',
					discountValue: '15',
				},
				resourceAttributes
			)
		).toEqual( { discountEnabled: false, discountType: 'FLAT', discountValue: '' } );
	} );

	it( 'reads address collection back from the payment', () => {
		expect(
			getResourceAttributeUpdates( blockAttributes, {
				...resourceAttributes,
				collectShippingAddress: true,
			} )
		).toEqual( { collectShippingAddress: true } );
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
		handlingEnabled: true,
		handlingValue: '4.00',
		discountEnabled: true,
		discountType: 'FLAT',
		discountValue: '2.00',
		shippingEnabled: true,
		shippingMode: 'QUANTITY',
		shippingValue: '5.00',
		shippingAdditionalValue: '2.00',
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

describe( 'GATED_ATTRIBUTES', () => {
	// Every resource attribute is either owned by a gate or owned by none, so a new
	// one goes in GATED_ATTRIBUTES or in this list.
	const UNGATED = [
		'paymentLink',
		'productName',
		'price',
		'currencyCode',
		'productDescription',
		'productId',
		'customerNotes',
		'returnUrl',
		// Shown under the shipping toggle, but PayPal stores it on every payment, so the
		// toggle leaves it alone.
		'collectShippingAddress',
		// Neither is a form field at all: both are read back off the payment and
		// re-sent, so no gate owns them.
		'integrationMode',
		'scriptSrc',
	];

	it( 'accounts for every resource attribute exactly once', () => {
		const gates = Object.keys( GATED_ATTRIBUTES );
		const owned = Object.values( GATED_ATTRIBUTES ).flat();
		const classified = [ ...gates, ...owned, ...UNGATED ];

		expect( classified.slice().sort() ).toEqual( RESOURCE_ATTRIBUTES.slice().sort() );
	} );

	it( 'lists only attributes block.json declares', () => {
		const named = [
			...Object.keys( GATED_ATTRIBUTES ),
			...Object.values( GATED_ATTRIBUTES ).flat(),
		];

		named.forEach( key => expect( metadata.attributes ).toHaveProperty( key ) );
	} );

	it( 'resets an attribute to its block.json default', () => {
		expect( resetToDefaults( 'taxName', 'maxQuantity' ) ).toEqual( {
			taxName: metadata.attributes.taxName.default,
			maxQuantity: metadata.attributes.maxQuantity.default,
		} );
	} );

	// Turning a gate off has to reset everything it owns. Leftovers show up here
	// as updates.
	it.each( Object.keys( GATED_ATTRIBUTES ) )(
		'agrees with the payment once %s is turned off',
		gate => {
			const populated = {
				...blockAttributes,
				[ gate ]: true,
				taxName: 'VAT',
				taxType: 'FLAT',
				taxValue: '1.50',
				handlingValue: '4.00',
				discountType: 'PERCENTAGE',
				discountValue: '15',
				shippingMode: 'QUANTITY',
				shippingValue: '5.00',
				shippingAdditionalValue: '2.00',
				collectShippingAddress: true,
				maxQuantity: 25,
				variants: { dimensions: [ { name: 'Size', options: [] } ] },
			};

			const afterTurningOff = { ...populated, ...turnGateOff( gate ) };
			const updates = getResourceAttributeUpdates( afterTurningOff, {} );

			// The other gates are still on, so check only the one under test.
			expect(
				Object.fromEntries(
					Object.entries( updates ).filter( ( [ key ] ) =>
						[ gate, ...GATED_ATTRIBUTES[ gate ] ].includes( key )
					)
				)
			).toEqual( {} );
		}
	);
} );
