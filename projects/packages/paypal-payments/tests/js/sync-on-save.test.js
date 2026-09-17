/**
 * Tests for syncing PayPal payments with the post save.
 *
 * @package
 */

import {
	deleteRemovedPayments,
	forgetSyncedRequests,
	heldBackReason,
	isReadyForPayPal,
	removedResourceIds,
	resourceIdsIn,
	syncBlocksBeforeSave,
} from '../../src/paypal-payment-buttons/utils/sync-on-save';
import { REQUIRED_FIELD_ERROR } from '../../src/paypal-payment-buttons/utils/validation';

const product = {
	productName: 'Test Widget',
	price: '29.99',
	currencyCode: 'USD',
	collectShippingAddress: false,
};

const priced = [ '10.00', '20.00' ];

/**
 * A variants structure with one primary option group.
 *
 * @param {Array} prices - One price per option; '' means unpriced.
 * @return {object} Variants structure.
 */
const variantsWithPrices = prices => ( {
	dimensions: [
		{
			name: 'Size',
			primary: true,
			options: prices.map( ( value, i ) => ( {
				label: `Option ${ i + 1 }`,
				unit_amount: { currency_code: 'USD', value },
			} ) ),
		},
	],
} );

/**
 * Collaborators the sync writes through, recorded for the assertions.
 *
 * @param {Function} respond - Answers each request; defaults to a created payment.
 * @return {object} deps plus the recorded calls.
 */
function fakeDeps( respond ) {
	const requests = [];
	const request = jest.fn( options => {
		requests.push( options );
		return respond
			? respond( options )
			: Promise.resolve( {
					id: 'PLB-NEW1',
					payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
			  } );
	} );
	return {
		requests,
		request,
		updateBlockAttributes: jest.fn(),
		reportError: jest.fn(),
		reportHeldBack: jest.fn(),
	};
}

beforeEach( forgetSyncedRequests );

describe( 'isReadyForPayPal', () => {
	it( 'accepts a complete product', () => {
		expect( isReadyForPayPal( product ) ).toBe( true );
	} );

	it( 'holds back a product with a blocking field error', () => {
		expect( isReadyForPayPal( { ...product, productName: '' } ) ).toBe( false );
		expect( isReadyForPayPal( { ...product, productDescription: 'x'.repeat( 2049 ) } ) ).toBe(
			false
		);
	} );

	// A bad URL warns, it has never blocked saving.
	it( 'lets a bad return URL through', () => {
		expect( isReadyForPayPal( { ...product, returnUrl: 'http://example.com' } ) ).toBe( true );
	} );

	it( 'ignores a stale product price once the options carry their own', () => {
		expect(
			isReadyForPayPal( {
				...product,
				price: '0',
				variantsEnabled: true,
				variants: variantsWithPrices( priced ),
			} )
		).toBe( true );
	} );

	it( 'holds back options that lost their prices', () => {
		expect(
			isReadyForPayPal( {
				...product,
				variantsEnabled: true,
				variants: variantsWithPrices( [ '', '' ] ),
			} )
		).toBe( false );
	} );

	it.each( [ 'FLAT', 'QUANTITY' ] )( 'holds back %s shipping with no fee', shippingMode => {
		expect(
			isReadyForPayPal( { ...product, shippingEnabled: true, shippingMode, shippingValue: '' } )
		).toBe( false );
	} );

	it.each( [ 'PROFILE', 'FREE' ] )( 'sends %s shipping with no fee', shippingMode => {
		expect(
			isReadyForPayPal( { ...product, shippingEnabled: true, shippingMode, shippingValue: '' } )
		).toBe( true );
	} );

	it( 'sends a shipping fee of zero', () => {
		expect(
			isReadyForPayPal( {
				...product,
				shippingEnabled: true,
				shippingMode: 'FLAT',
				shippingValue: '0',
			} )
		).toBe( true );
	} );

	// Optional, so blank is fine - but a filled one still has to be an amount.
	it( 'holds back a negative additional items fee', () => {
		expect(
			isReadyForPayPal( {
				...product,
				shippingEnabled: true,
				shippingMode: 'QUANTITY',
				shippingValue: '5.00',
				shippingAdditionalValue: '-2',
			} )
		).toBe( false );
	} );

	it.each( [
		[ 'a flat amount with no value', 'FLAT' ],
		[ 'a rate with no value', 'PERCENTAGE' ],
		[ 'no type and no value', '' ],
	] )( 'holds back %s', ( _label, taxType ) => {
		expect( isReadyForPayPal( { ...product, taxEnabled: true, taxType, taxValue: '' } ) ).toBe(
			false
		);
	} );

	// PREFERENCE takes its rate from the merchant's PayPal profile.
	it( 'lets a profile tax through with no value', () => {
		expect(
			isReadyForPayPal( { ...product, taxEnabled: true, taxType: 'PREFERENCE', taxValue: '' } )
		).toBe( true );
	} );

	it( 'lets a flat tax with an amount through', () => {
		expect(
			isReadyForPayPal( { ...product, taxEnabled: true, taxType: 'FLAT', taxValue: '1.50' } )
		).toBe( true );
	} );

	// PayPal's own bounds, measured.
	it.each( [
		[ 'a rate at the ceiling', '100', 'Rate must be less than 100%.' ],
		[ 'a rate over the ceiling', '150', 'Rate must be less than 100%.' ],
		[ 'a rate with three decimals', '7.555', 'Rate can have at most 2 decimal places.' ],
	] )( 'holds back %s', ( _label, taxValue, message ) => {
		expect(
			heldBackReason( { ...product, taxEnabled: true, taxType: 'PERCENTAGE', taxValue } )
		).toBe( message );
	} );

	// The field draws a currency suffix for any type other than PERCENTAGE.
	it( 'validates an unknown tax type as money', () => {
		expect(
			heldBackReason( { ...product, taxEnabled: true, taxType: 'SOMETHING_ELSE', taxValue: '150' } )
		).toBeNull();
	} );

	it( 'lets a zero tax rate through', () => {
		expect(
			isReadyForPayPal( { ...product, taxEnabled: true, taxType: 'PERCENTAGE', taxValue: '0' } )
		).toBe( true );
	} );

	it( 'holds back a handling fee with no amount', () => {
		expect( isReadyForPayPal( { ...product, handlingEnabled: true, handlingValue: '' } ) ).toBe(
			false
		);
	} );

	it( 'lets a zero handling fee through', () => {
		expect( isReadyForPayPal( { ...product, handlingEnabled: true, handlingValue: '0' } ) ).toBe(
			true
		);
	} );

	// Measured on JPY: PayPal rejects a decimal amount in JPY, HUF and TWD on every
	// flat field.
	describe( 'in a zero-decimal currency', () => {
		const yen = { ...product, currencyCode: 'JPY', price: '3000' };

		it( 'holds back a flat tax with decimals', () => {
			expect(
				isReadyForPayPal( { ...yen, taxEnabled: true, taxType: 'FLAT', taxValue: '1.50' } )
			).toBe( false );
		} );

		// Measured: a JPY item stores a 7.55% tax. A percentage follows its own rule.
		it( 'lets a tax rate with decimals through', () => {
			expect(
				isReadyForPayPal( { ...yen, taxEnabled: true, taxType: 'PERCENTAGE', taxValue: '7.55' } )
			).toBe( true );
		} );

		it( 'holds back a shipping fee with decimals', () => {
			expect(
				isReadyForPayPal( {
					...yen,
					shippingEnabled: true,
					shippingMode: 'FLAT',
					shippingValue: '5.50',
				} )
			).toBe( false );
		} );

		it( 'holds back a flat discount with decimals', () => {
			expect(
				isReadyForPayPal( {
					...yen,
					discountEnabled: true,
					discountType: 'FLAT',
					discountValue: '1.50',
				} )
			).toBe( false );
		} );

		it( 'holds back an additional items fee with decimals', () => {
			expect(
				isReadyForPayPal( {
					...yen,
					shippingEnabled: true,
					shippingMode: 'QUANTITY',
					shippingValue: '500',
					shippingAdditionalValue: '2.50',
				} )
			).toBe( false );
		} );

		// heldBackReason says which field broke when this fails.
		it( 'lets whole amounts through', () => {
			expect(
				heldBackReason( {
					...yen,
					handlingEnabled: true,
					handlingValue: '400',
					shippingEnabled: true,
					shippingMode: 'QUANTITY',
					shippingValue: '500',
					shippingAdditionalValue: '200',
				} )
			).toBeNull();
		} );

		it( 'holds back a handling fee with decimals, naming the currency', () => {
			expect( heldBackReason( { ...yen, handlingEnabled: true, handlingValue: '4.00' } ) ).toBe(
				'Prices in JPY are whole numbers (e.g., "1500").'
			);
		} );
	} );

	it( 'holds back a discount with no value', () => {
		expect( isReadyForPayPal( { ...product, discountEnabled: true, discountType: 'FLAT' } ) ).toBe(
			false
		);
	} );

	it( 'holds back a flat discount equal to the product price', () => {
		expect(
			isReadyForPayPal( {
				...product,
				discountEnabled: true,
				discountType: 'FLAT',
				discountValue: '29.99',
			} )
		).toBe( false );
	} );

	it( 'lets a flat discount under the product price through', () => {
		expect(
			isReadyForPayPal( {
				...product,
				discountEnabled: true,
				discountType: 'FLAT',
				discountValue: '5.00',
			} )
		).toBe( true );
	} );

	it( 'refuses to save a customer note with a blank label', () => {
		const attributes = { ...product, customerNotes: [ { label: '', required: false } ] };

		expect( isReadyForPayPal( attributes ) ).toBe( false );
		expect( heldBackReason( attributes ) ).toBe( REQUIRED_FIELD_ERROR );
	} );

	it( 'reports the variant error ahead of a blank customer note', () => {
		const attributes = {
			...product,
			variantsEnabled: true,
			variants: { dimensions: [ { name: '', primary: true, options: [] } ] },
			customerNotes: [ { label: '', required: false } ],
		};

		expect( heldBackReason( attributes ) ).toBe( 'Variant name is required.' );
	} );

	it( 'lets a labelled customer note through', () => {
		const attributes = {
			...product,
			customerNotes: [ { label: 'Engraving', required: true } ],
		};

		expect( isReadyForPayPal( attributes ) ).toBe( true );
		expect( heldBackReason( attributes ) ).toBeNull();
	} );

	// Per-option pricing replaces the product price, so the 29.99 in `price` is ignored.
	it( 'measures a flat discount against the cheapest option price', () => {
		const withOptions = {
			...product,
			variantsEnabled: true,
			variants: variantsWithPrices( priced ),
			discountEnabled: true,
			discountType: 'FLAT',
		};

		expect( isReadyForPayPal( { ...withOptions, discountValue: '15.00' } ) ).toBe( false );
		expect( isReadyForPayPal( { ...withOptions, discountValue: '5.00' } ) ).toBe( true );
	} );

	it( 'holds back a percentage discount with decimals', () => {
		expect(
			isReadyForPayPal( {
				...product,
				discountEnabled: true,
				discountType: 'PERCENTAGE',
				discountValue: '15.5',
			} )
		).toBe( false );
	} );

	it( 'holds back a percentage discount of 100', () => {
		expect(
			isReadyForPayPal( {
				...product,
				discountEnabled: true,
				discountType: 'PERCENTAGE',
				discountValue: '100',
			} )
		).toBe( false );
	} );
} );

describe( 'syncBlocksBeforeSave', () => {
	it( 'creates the payment for a new block and points the block at it', async () => {
		const deps = fakeDeps();

		const changed = await syncBlocksBeforeSave( [ { clientId: 'a', attributes: product } ], deps );

		expect( changed ).toBe( true );
		expect( deps.requests ).toEqual( [
			expect.objectContaining( {
				path: '/wpcom/v2/paypal/buttons',
				method: 'POST',
				data: expect.objectContaining( {
					type: 'BUY_NOW',
					integration_mode: 'LINK',
					line_items: [
						expect.objectContaining( {
							name: 'Test Widget',
							unit_amount: { currency_code: 'USD', value: '29.99' },
							// Sent even when off: omit it and PayPal turns address collection on.
							collect_shipping_address: false,
						} ),
					],
				} ),
			} ),
		] );
		expect( deps.updateBlockAttributes ).toHaveBeenCalledWith( 'a', {
			isApiManaged: true,
			resourceId: 'PLB-NEW1',
			paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
		} );
	} );

	it( 'leaves an incomplete block alone and says why', async () => {
		const deps = fakeDeps();

		const changed = await syncBlocksBeforeSave(
			[ { clientId: 'a', attributes: { ...product, price: '' } } ],
			deps
		);

		expect( changed ).toBe( false );
		expect( deps.request ).not.toHaveBeenCalled();
		expect( deps.reportError ).not.toHaveBeenCalled();
		expect( deps.reportHeldBack ).toHaveBeenCalledWith(
			{ clientId: 'a', attributes: { ...product, price: '' } },
			'Price is required.'
		);
	} );

	it( 'names an option group error as the reason', async () => {
		const deps = fakeDeps();
		const variants = {
			dimensions: [ { ...variantsWithPrices( [ '1' ] ).dimensions[ 0 ], name: '' } ],
		};

		await syncBlocksBeforeSave(
			[ { clientId: 'a', attributes: { ...product, price: '', variantsEnabled: true, variants } } ],
			deps
		);

		expect( deps.request ).not.toHaveBeenCalled();
		expect( deps.reportHeldBack ).toHaveBeenCalledWith(
			expect.anything(),
			'Variant name is required.'
		);
	} );

	// PayPal rejects a request carrying unit_amount at both levels.
	it( 'leaves the product amount out once the options are priced', async () => {
		const deps = fakeDeps();

		await syncBlocksBeforeSave(
			[
				{
					clientId: 'a',
					attributes: {
						...product,
						currencyCode: 'EUR',
						variantsEnabled: true,
						variants: variantsWithPrices( priced ),
					},
				},
			],
			deps
		);

		const [ item ] = deps.requests[ 0 ].data.line_items;
		expect( item ).not.toHaveProperty( 'unit_amount' );
		// The options were priced in USD and the currency changed afterwards.
		expect( item.variants.dimensions[ 0 ].options.map( o => o.unit_amount.currency_code ) ).toEqual(
			[ 'EUR', 'EUR' ]
		);
	} );

	describe( 'a block that already has a payment', () => {
		const saved = { ...product, isApiManaged: true, resourceId: 'PLB-KEEP1' };
		/**
		 * Answer every request with nothing.
		 *
		 * @return {Promise<object>} The response.
		 */
		const stored = () => Promise.resolve( {} );

		it( 'replaces the payment with the form values, clearing what the form leaves unset', async () => {
			const deps = fakeDeps( stored );

			const changed = await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( changed ).toBe( false );
			expect( deps.requests.map( r => r.method ) ).toEqual( [ 'PUT' ] );
			const [ item ] = deps.requests[ 0 ].data.line_items;
			expect( item ).toMatchObject( {
				name: 'Test Widget',
				collect_shipping_address: false,
			} );
			// All four are off in this block, so PayPal clears them.
			expect( item ).not.toHaveProperty( 'product_id' );
			expect( item ).not.toHaveProperty( 'shipping' );
			expect( item ).not.toHaveProperty( 'handling' );
			expect( item ).not.toHaveProperty( 'discounts' );
			expect( deps.updateBlockAttributes ).not.toHaveBeenCalled();
		} );

		it( 'does not send an unchanged block twice', async () => {
			const deps = fakeDeps( stored );

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			expect( deps.requests ).toHaveLength( 1 );

			await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: { ...saved, price: '31.00' } } ],
				deps
			);
			expect( deps.requests ).toHaveLength( 2 );
		} );

		it( 're-creates a payment that has been deleted from PayPal', async () => {
			const deps = fakeDeps( options =>
				options.method === 'POST'
					? Promise.resolve( {
							id: 'PLB-NEW1',
							payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
					  } )
					: Promise.reject( { code: 'paypal_api_resource_not_found', data: { status: 404 } } )
			);

			const changed = await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( changed ).toBe( true );
			expect( deps.updateBlockAttributes ).toHaveBeenCalledWith(
				'a',
				expect.objectContaining( { resourceId: 'PLB-NEW1' } )
			);
		} );

		it( 'reports a refusal and keeps going', async () => {
			const deps = fakeDeps( options =>
				options.method === 'PUT'
					? Promise.reject( { message: 'PayPal turned the payment down.' } )
					: Promise.resolve( {} )
			);

			const changed = await syncBlocksBeforeSave(
				[
					{ clientId: 'a', attributes: saved },
					{ clientId: 'b', attributes: { ...product, productName: 'Other Widget' } },
				],
				deps
			);

			expect( changed ).toBe( true );
			expect( deps.reportError ).toHaveBeenCalledWith(
				expect.objectContaining( { clientId: 'a' } ),
				expect.stringContaining( 'PayPal turned the payment down.' )
			);
			expect( deps.updateBlockAttributes ).toHaveBeenCalledWith( 'b', expect.anything() );
		} );
	} );
} );

describe( 'removed payments', () => {
	const block = id =>
		`<!-- wp:jetpack/paypal-payment-buttons {"isApiManaged":true,"resourceId":"${ id }"} /-->`;

	it( 'reads the payments out of post content', () => {
		expect( [ ...resourceIdsIn( `${ block( 'PLB-A1' ) }\n${ block( 'PLB-B2' ) }` ) ] ).toEqual( [
			'PLB-A1',
			'PLB-B2',
		] );
		expect( [ ...resourceIdsIn( '' ) ] ).toEqual( [] );
	} );

	it( 'names the payments the saved post had that the next save drops', () => {
		const savedContent = `${ block( 'PLB-A1' ) }\n${ block( 'PLB-B2' ) }`;

		expect( removedResourceIds( savedContent, block( 'PLB-B2' ) ) ).toEqual( [ 'PLB-A1' ] );
		expect( removedResourceIds( savedContent, savedContent ) ).toEqual( [] );
		expect( removedResourceIds( undefined, block( 'PLB-A1' ) ) ).toEqual( [] );
	} );

	it( 'asks the server to delete each one unless another post still uses it', async () => {
		const deps = fakeDeps( () => Promise.reject( new Error( 'kept' ) ) );

		await deleteRemovedPayments( [ 'PLB-A1', 'PLB-B2' ], 17, deps );

		expect( deps.requests ).toEqual( [
			{ path: '/wpcom/v2/paypal/buttons/PLB-A1?unused_only=1&post_id=17', method: 'DELETE' },
			{ path: '/wpcom/v2/paypal/buttons/PLB-B2?unused_only=1&post_id=17', method: 'DELETE' },
		] );
	} );
} );
