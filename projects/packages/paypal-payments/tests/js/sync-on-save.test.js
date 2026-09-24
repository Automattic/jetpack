/**
 * Tests for syncing PayPal payments with the post save.
 *
 * @package
 */

import {
	forgetExistingLinks,
	getExistingLinks,
	loadExistingLinks,
} from '../../src/paypal-payment-buttons/utils/existing-links';
import {
	getResourceAttributeUpdates,
	normalizeResourceVariants,
} from '../../src/paypal-payment-buttons/utils/resource-sync';
import {
	forgetSyncedRequests,
	getCardRevision,
	heldBackReason,
	isReadyForPayPal,
	recordBlockMounted,
	recordPaymentRead,
	syncBlocksBeforeSave,
} from '../../src/paypal-payment-buttons/utils/sync-on-save';
import { REQUIRED_FIELD_ERROR } from '../../src/paypal-payment-buttons/utils/validation';
const apiFetch = require( '@wordpress/api-fetch' );

const product = {
	productName: 'Test Widget',
	price: '29.99',
	currencyCode: 'USD',
	collectShippingAddress: false,
};

const priced = [ '10.00', '20.00' ];

/**
 * Let the pending read settle.
 *
 * @return {Promise} Resolves once it has.
 */
const settle = () => new Promise( resolve => setTimeout( resolve ) );

/**
 * Read the list of existing links, as a picker would, and let the read settle.
 *
 * @return {Promise} Resolves once it has.
 */
const readList = () => {
	loadExistingLinks();
	return settle();
};

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
					// The server maps the created payment onto block attributes, so the
					// block takes what PayPal decided in the same save.
					attributes: {
						...product,
						paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
						integrationMode: 'LINK',
					},
				} );
	} );
	return {
		requests,
		request,
		updateBlockAttributes: jest.fn(),
		reportError: jest.fn(),
		reportHeldBack: jest.fn(),
		reportSaved: jest.fn(),
	};
}

beforeEach( () => {
	apiFetch.mockReset();
	apiFetch.mockResolvedValue( { resources: [] } );
	forgetSyncedRequests();
	forgetExistingLinks();
} );

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

	// PHP answers a bad one with a 400, so sending it would fail on every save.
	it( 'holds back a bad return URL', () => {
		expect( heldBackReason( { ...product, returnUrl: '//example.com/thanks' } ) ).toBe(
			'Return URL must be a valid URL (e.g., https://example.com/thank-you).'
		);
	} );

	it( 'accepts an http return URL', () => {
		expect( isReadyForPayPal( { ...product, returnUrl: 'http://example.com/thanks' } ) ).toBe(
			true
		);
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
			integrationMode: 'LINK',
		} );
		expect( deps.reportSaved ).toHaveBeenCalledWith( true );
	} );

	describe( 'stacked buttons PayPal has yet to grant', () => {
		const stacked = { ...product, format: 'STACKED' };
		const unavailable =
			"Stacked buttons aren't available for this PayPal account yet. Please choose another format.";

		// PayPal grants the mode per account, and an empty scriptSrc on a create is the
		// only signal of that. Choosing another format is left to the merchant.
		it( 'tells the merchant to choose another format when a create brings back an empty SDK URL', async () => {
			const deps = fakeDeps();

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: stacked } ], deps );

			expect( deps.reportError ).toHaveBeenCalledWith(
				expect.objectContaining( { clientId: 'a' } ),
				unavailable
			);
			// The payment was still created.
			expect( deps.reportSaved.mock.calls ).toEqual( [ [ true ] ] );
		} );

		it( 'stores the SDK URL a create brings back, and stays quiet', async () => {
			const deps = fakeDeps( () =>
				Promise.resolve( {
					id: 'PLB-NEW1',
					payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
					attributes: {
						...stacked,
						paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
						integrationMode: 'BUTTON',
						scriptSrc: 'https://www.paypal.com/sdk/js?client-id=abc',
					},
				} )
			);

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: stacked } ], deps );

			expect( deps.updateBlockAttributes ).toHaveBeenCalledWith(
				'a',
				expect.objectContaining( { scriptSrc: 'https://www.paypal.com/sdk/js?client-id=abc' } )
			);
			expect( deps.reportError ).not.toHaveBeenCalled();
		} );

		// The create sends a smaller body than the save that follows it, so the dedup cache
		// is keyed on what the save asked for. Keyed on the request instead, every stacked
		// create would buy PayPal a round trip on the next save.
		it( 'sends only the create when a stacked block adopts the SDK URL it brought back', async () => {
			const granted = {
				id: 'PLB-NEW1',
				payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
				attributes: {
					...stacked,
					paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
					integrationMode: 'BUTTON',
					scriptSrc: 'https://www.paypal.com/sdk/js?client-id=abc',
				},
			};
			const deps = fakeDeps( () => Promise.resolve( granted ) );

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: stacked } ], deps );
			await syncBlocksBeforeSave(
				[
					{
						clientId: 'a',
						attributes: {
							...stacked,
							...granted.attributes,
							isApiManaged: true,
							resourceId: 'PLB-NEW1',
						},
					},
				],
				deps
			);

			expect( deps.requests.map( r => r.method ) ).toEqual( [ 'POST' ] );
			// Deduped, rather than held back for an unread payment.
			expect( deps.reportHeldBack ).not.toHaveBeenCalled();
		} );

		// A response with no attributes means the server skipped the read-back, so
		// nothing yet says whether the account has stacked buttons.
		it( 'asks the merchant to try again when the read-back is missing', async () => {
			const deps = fakeDeps( options => Promise.resolve( { id: 'PLB-1', ...options.data } ) );
			recordPaymentRead( 'a', 'PLB-1' );

			await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: { ...stacked, resourceId: 'PLB-1' } } ],
				deps
			);

			expect( deps.reportError ).toHaveBeenCalledWith(
				expect.objectContaining( { clientId: 'a' } ),
				'There was an issue saving your stacked buttons. Please try again.'
			);
			expect( deps.reportError ).not.toHaveBeenCalledWith( expect.anything(), unavailable );
			// The PUT still went through.
			expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );
		} );

		it( 'leaves a link block alone when the read-back is missing', async () => {
			const deps = fakeDeps( options => Promise.resolve( { id: 'PLB-1', ...options.data } ) );
			recordPaymentRead( 'a', 'PLB-1' );

			await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: { ...product, format: 'LINK', resourceId: 'PLB-1' } } ],
				deps
			);

			expect( deps.reportError ).not.toHaveBeenCalled();
		} );

		// Nothing is recorded for a missing read-back, so the next save asks PayPal again.
		it( 'saves again after a missing read-back, then asks for another format once PayPal answers', async () => {
			let readBack = false;
			const deps = fakeDeps( options =>
				Promise.resolve(
					readBack
						? { id: 'PLB-1', attributes: { ...stacked, resourceId: 'PLB-1' } }
						: { id: 'PLB-1', ...options.data }
				)
			);
			const block = { clientId: 'a', attributes: { ...stacked, resourceId: 'PLB-1' } };
			recordPaymentRead( 'a', 'PLB-1' );

			await syncBlocksBeforeSave( [ block ], deps );
			expect( deps.reportError ).toHaveBeenCalledWith(
				expect.anything(),
				'There was an issue saving your stacked buttons. Please try again.'
			);
			deps.reportError.mockClear();

			readBack = true;
			await syncBlocksBeforeSave( [ block ], deps );

			expect( deps.requests.filter( ( { method } ) => method === 'PUT' ) ).toHaveLength( 2 );
			expect( deps.reportError ).toHaveBeenCalledWith( expect.anything(), unavailable );
		} );

		it( 'stays quiet on a create for another format', async () => {
			const deps = fakeDeps();

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: product } ], deps );

			expect( deps.reportError ).not.toHaveBeenCalled();
		} );

		// Nothing is stored, so an account granted the mode later just starts working.
		it( 'asks for another format on every save until PayPal grants the mode', async () => {
			let scriptSrc = '';
			const deps = fakeDeps( () =>
				Promise.resolve( {
					attributes: {
						...stacked,
						resourceId: 'PLB-1',
						integrationMode: 'BUTTON',
						scriptSrc,
					},
				} )
			);
			const block = { clientId: 'a', attributes: { ...stacked, resourceId: 'PLB-1' } };
			recordPaymentRead( 'a', 'PLB-1' );

			await syncBlocksBeforeSave( [ block ], deps );
			expect( deps.reportError ).toHaveBeenCalledWith( expect.anything(), unavailable );
			expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );

			// The body is unchanged, so the sync short-circuits and the block still
			// has an empty scriptSrc.
			deps.reportError.mockClear();
			await syncBlocksBeforeSave( [ block ], deps );
			expect( deps.reportError ).toHaveBeenCalledWith( expect.anything(), unavailable );
			// Only the first save sent a PUT.
			expect( deps.reportSaved ).toHaveBeenCalledTimes( 1 );

			// PayPal grants it. A changed body gets through, and the message stops.
			scriptSrc = 'https://www.paypal.com/sdk/js?client-id=abc';
			deps.reportError.mockClear();
			await syncBlocksBeforeSave(
				[ { ...block, attributes: { ...block.attributes, price: '31.00' } } ],
				deps
			);
			expect( deps.reportError ).not.toHaveBeenCalled();
		} );
	} );

	it( 'lists a new payment first and reads the list again', async () => {
		apiFetch.mockResolvedValueOnce( { resources: [ { id: 'PLB-OLD1' } ] } );
		await readList();

		await syncBlocksBeforeSave( [ { clientId: 'a', attributes: product } ], fakeDeps() );

		expect( getExistingLinks().links.map( link => link.id ) ).toEqual( [ 'PLB-NEW1', 'PLB-OLD1' ] );
		await readList();
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
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
		expect( deps.reportSaved ).not.toHaveBeenCalled();
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

		// These tests are about what gets sent, so mark the payment read and let the save run.
		beforeEach( () => recordPaymentRead( 'a', 'PLB-KEEP1' ) );

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
			// The read recorded no values, so the PUT counts as a change.
			expect( deps.reportSaved ).toHaveBeenCalledWith( false );
		} );

		describe( 'sharing a payment with a stacked block', () => {
			const sibling = {
				clientId: 'b',
				attributes: { ...saved, format: 'LINK', integrationMode: 'LINK' },
			};
			const stackedBlock = { clientId: 'a', attributes: { ...saved, format: 'STACKED' } };
			const sdkUrl = 'https://www.paypal.com/sdk/js?client-id=abc';

			/**
			 * Answer a PUT the way the server does: the payment for a caller that asked
			 * for the snippets, PayPal's empty echo for everyone else.
			 *
			 * @param {object} options - The request.
			 * @return {Promise<object>} The response.
			 */
			const readsBackWhenAsked = options =>
				Promise.resolve(
					options.data.include_snippets
						? {
								id: 'PLB-KEEP1',
								attributes: { ...saved, integrationMode: 'BUTTON', scriptSrc: sdkUrl },
							}
						: {}
				);

			/**
			 * Apply what a mount GET would write, through the same helper the editor's
			 * read-back uses.
			 *
			 * @param {object} attributes - The block's stored attributes.
			 * @return {object} The attributes it holds once it has read the payment back.
			 */
			const afterMountReadBack = attributes => ( {
				...attributes,
				...getResourceAttributeUpdates( attributes, {
					...saved,
					integrationMode: 'BUTTON',
					scriptSrc: sdkUrl,
				} ),
			} );

			beforeEach( () => recordPaymentRead( 'b', 'PLB-KEEP1' ) );

			it( 'sends BUTTON mode for the sibling too', async () => {
				const deps = fakeDeps( stored );

				await syncBlocksBeforeSave(
					[ { clientId: 'a', attributes: { ...saved, format: 'STACKED' } }, sibling ],
					deps
				);

				expect( deps.requests.map( r => r.data.integration_mode ) ).toEqual( [
					'BUTTON',
					'BUTTON',
				] );
			} );

			// Only the stacked block renders the SDK, and the read-back costs PayPal a
			// round trip.
			it( 'asks for the payment back only for the stacked block', async () => {
				const deps = fakeDeps( readsBackWhenAsked );

				await syncBlocksBeforeSave( [ stackedBlock, sibling ], deps );

				expect( deps.requests.map( r => r.data.include_snippets ) ).toEqual( [ true, undefined ] );
			} );

			it( 'writes the SDK URL to the stacked block and nothing to the sibling', async () => {
				const deps = fakeDeps( readsBackWhenAsked );

				await syncBlocksBeforeSave( [ stackedBlock, sibling ], deps );

				expect( deps.updateBlockAttributes ).toHaveBeenCalledWith( 'a', {
					integrationMode: 'BUTTON',
					scriptSrc: sdkUrl,
				} );
				expect( deps.updateBlockAttributes ).not.toHaveBeenCalledWith( 'b', expect.anything() );
			} );

			// The sibling's next mount GET hands it the payment in BUTTON mode, so it adopts
			// the mode and keeps sending it even once the stacked block is deleted. That is
			// safe: a BUTTON-mode payment still carries the payment_link a link or QR block
			// draws on, checked against a live one.
			it( 'keeps the sibling on BUTTON once it has read the shared payment back', async () => {
				const deps = fakeDeps( readsBackWhenAsked );

				await syncBlocksBeforeSave( [ stackedBlock, sibling ], deps );
				expect( deps.updateBlockAttributes ).not.toHaveBeenCalledWith( 'b', expect.anything() );

				// Reload the post with the stacked block deleted: the module state goes with the
				// page, and the mount GET hands the sibling what PayPal now holds.
				forgetSyncedRequests();
				recordPaymentRead( 'b', 'PLB-KEEP1' );
				await syncBlocksBeforeSave(
					[ { clientId: 'b', attributes: afterMountReadBack( sibling.attributes ) } ],
					deps
				);

				expect( deps.requests.map( r => r.data.integration_mode ) ).toEqual( [
					'BUTTON',
					'BUTTON',
					'BUTTON',
				] );
			} );

			// The guard keys on the payment, so a stacked block pulls only the blocks sharing
			// its payment into BUTTON mode.
			it( 'leaves a block on another payment in its own mode', async () => {
				const deps = fakeDeps( readsBackWhenAsked );
				recordPaymentRead( 'c', 'PLB-OTHER1' );

				await syncBlocksBeforeSave(
					[
						stackedBlock,
						sibling,
						{
							clientId: 'c',
							attributes: { ...sibling.attributes, resourceId: 'PLB-OTHER1' },
						},
					],
					deps
				);

				expect( deps.requests.map( r => r.data.integration_mode ) ).toEqual( [
					'BUTTON',
					'BUTTON',
					'LINK',
				] );
			} );

			// Switched to stacked, the sibling sends the same payment fields it sent as a link;
			// the read-back flag is the only difference, and it sits in the key for exactly that.
			// Keyed on the payment fields alone, the switch would read as unchanged and leave the
			// block reporting that PayPal refused the mode.
			it( 'writes the SDK URL to the sibling when the merchant switches it to stacked', async () => {
				const deps = fakeDeps( readsBackWhenAsked );

				await syncBlocksBeforeSave( [ stackedBlock, sibling ], deps );
				await syncBlocksBeforeSave(
					[
						stackedBlock,
						{ ...sibling, attributes: { ...sibling.attributes, format: 'STACKED' } },
					],
					deps
				);

				expect( deps.updateBlockAttributes ).toHaveBeenCalledWith( 'b', {
					integrationMode: 'BUTTON',
					scriptSrc: sdkUrl,
				} );
				// The account does have the mode, so saying otherwise would be a lie.
				expect( deps.reportError ).not.toHaveBeenCalledWith(
					expect.objectContaining( { clientId: 'b' } ),
					expect.anything()
				);
			} );

			// A 404 replaces the payment, and the create goes out in the block's own mode
			// rather than the shared one.
			it( 'creates the sibling a replacement payment in its own mode', async () => {
				const deps = fakeDeps( options =>
					options.method === 'PUT'
						? Promise.reject( { code: 'paypal_api_resource_not_found', data: { status: 404 } } )
						: Promise.resolve( { id: 'PLB-NEW1' } )
				);

				await syncBlocksBeforeSave( [ stackedBlock, sibling ], deps );

				const created = deps.requests.filter( r => r.method === 'POST' );
				expect( created.map( r => r.data.integration_mode ).sort() ).toEqual( [
					'BUTTON',
					'LINK',
				] );
			} );

			// The stacked block is held back before it sends, so BUTTON has to come from the
			// block list rather than from a request.
			it( 'sends BUTTON mode even when the stacked block is held back', async () => {
				const deps = fakeDeps( stored );

				await syncBlocksBeforeSave(
					[
						{ clientId: 'a', attributes: { ...saved, format: 'STACKED', productName: '' } },
						sibling,
					],
					deps
				);

				expect( deps.requests.map( r => r.data.integration_mode ) ).toEqual( [ 'BUTTON' ] );
			} );
		} );

		it( 'reads the list of existing links again after an update', async () => {
			await readList();

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], fakeDeps( stored ) );
			await readList();

			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'does not send an unchanged block twice', async () => {
			const deps = fakeDeps( stored );

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			expect( deps.requests ).toHaveLength( 1 );
			expect( deps.reportSaved ).toHaveBeenCalledTimes( 1 );

			await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: { ...saved, price: '31.00' } } ],
				deps
			);
			expect( deps.requests ).toHaveLength( 2 );
		} );

		it( 're-creates a payment that has been deleted from PayPal', async () => {
			const dead = { ...saved, paymentLink: 'https://www.paypal.com/ncp/payment/PLB-KEEP1' };
			const deps = fakeDeps( options =>
				options.method === 'POST'
					? Promise.resolve( {
							id: 'PLB-NEW1',
							payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
							attributes: {
								...product,
								paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
								integrationMode: 'LINK',
							},
						} )
					: Promise.reject( { code: 'paypal_api_resource_not_found', data: { status: 404 } } )
			);

			const changed = await syncBlocksBeforeSave( [ { clientId: 'a', attributes: dead } ], deps );

			expect( changed ).toBe( true );
			expect( deps.updateBlockAttributes ).toHaveBeenCalledWith(
				'a',
				expect.objectContaining( {
					resourceId: 'PLB-NEW1',
					// The old link points at a payment PayPal dropped, so keeping it would
					// send every buyer to a not-found page.
					paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
				} )
			);
			expect( deps.reportSaved.mock.calls ).toEqual( [ [ true ] ] );
		} );

		it( 'swaps the deleted link for the new one in the list of existing links', async () => {
			apiFetch.mockResolvedValueOnce( { resources: [ { id: saved.resourceId } ] } );
			await readList();
			const deps = fakeDeps( options =>
				options.method === 'POST'
					? Promise.resolve( { id: 'PLB-NEW1' } )
					: Promise.reject( { code: 'paypal_api_resource_not_found', data: { status: 404 } } )
			);

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( getExistingLinks().links ).toEqual( [ { id: 'PLB-NEW1' } ] );
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
			// Only the create went through.
			expect( deps.reportSaved.mock.calls ).toEqual( [ [ true ] ] );
		} );
	} );

	// A PUT replaces the payment outright, so a block still holding its block.json defaults
	// would wipe the product id and description set at PayPal.
	describe( 'a block still waiting for its payment', () => {
		const saved = { ...product, isApiManaged: true, resourceId: 'PLB-KEEP1' };
		const unread = 'Its current settings have not loaded yet. Reload the post and try again.';

		// A block is only held back once its editor has rendered.
		beforeEach( () => recordBlockMounted( 'a' ) );

		it( 'holds back a block that has yet to read its payment, and says why', async () => {
			const deps = fakeDeps();

			const changed = await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( changed ).toBe( false );
			expect( deps.request ).not.toHaveBeenCalled();
			expect( deps.reportError ).not.toHaveBeenCalled();
			expect( deps.reportSaved ).not.toHaveBeenCalled();
			expect( deps.reportHeldBack ).toHaveBeenCalledWith(
				{ clientId: 'a', attributes: saved },
				unread
			);
		} );

		it( 'holds back a block pointed at a payment other than the one it read', async () => {
			recordPaymentRead( 'a', 'PLB-OTHER1' );
			const deps = fakeDeps();

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( deps.request ).not.toHaveBeenCalled();
			expect( deps.reportHeldBack ).toHaveBeenCalledWith( expect.anything(), unread );
		} );

		it( 'holds back one block and sends the other', async () => {
			recordBlockMounted( 'b' );
			recordPaymentRead( 'b', 'PLB-KEEP1' );
			const deps = fakeDeps();

			await syncBlocksBeforeSave(
				[
					{ clientId: 'a', attributes: saved },
					{ clientId: 'b', attributes: saved },
				],
				deps
			);

			expect( deps.requests.map( r => r.method ) ).toEqual( [ 'PUT' ] );
			expect( deps.reportHeldBack ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'sends the block on the next save once it has read its payment', async () => {
			const deps = fakeDeps();

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			recordPaymentRead( 'a', 'PLB-KEEP1' );
			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( deps.requests.map( r => r.method ) ).toEqual( [ 'PUT' ] );
		} );

		// There is nothing at PayPal to overwrite yet, so the create runs.
		it( 'creates a payment for a block that has none', async () => {
			const deps = fakeDeps();

			const changed = await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: product } ],
				deps
			);

			expect( changed ).toBe( true );
			expect( deps.requests.map( r => r.method ) ).toEqual( [ 'POST' ] );
			expect( deps.reportHeldBack ).not.toHaveBeenCalled();
		} );

		// In code editor mode the save still runs over blocks that were only parsed from the
		// post, so their attributes came from block.json defaults. Only the message differs.
		it( 'holds back a block whose editor has yet to render, and points to the visual editor', async () => {
			const deps = fakeDeps();

			await syncBlocksBeforeSave( [ { clientId: 'z', attributes: saved } ], deps );

			expect( deps.request ).not.toHaveBeenCalled();
			expect( deps.reportHeldBack ).toHaveBeenCalledWith(
				{ clientId: 'z', attributes: saved },
				'Open this block in the visual editor and save again.'
			);
		} );

		// The save created this payment, so the next save can update it straight away.
		it( 'updates a payment the previous save created', async () => {
			// PayPal echoes back what it was sent. Answering with the old price instead
			// would hide a read-back that reverts the merchant's edit.
			const deps = fakeDeps( options =>
				Promise.resolve( {
					id: 'PLB-NEW1',
					payment_link: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
					attributes: {
						...product,
						price: options.data.line_items[ 0 ].unit_amount.value,
						paymentLink: 'https://www.paypal.com/ncp/payment/PLB-NEW1',
						integrationMode: 'LINK',
					},
				} )
			);

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: product } ], deps );
			await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: { ...product, resourceId: 'PLB-NEW1', price: '31.00' } } ],
				deps
			);

			expect( deps.requests.map( r => r.method ) ).toEqual( [ 'POST', 'PUT' ] );
			expect( deps.reportHeldBack ).not.toHaveBeenCalled();
			expect( deps.updateBlockAttributes ).not.toHaveBeenCalledWith(
				'a',
				expect.objectContaining( { price: expect.anything() } )
			);
		} );
	} );
} );

// PayPal's SDK draws the stacked card once, so the preview remounts when the revision goes up.
describe( 'the card revision', () => {
	const saved = { ...product, isApiManaged: true, resourceId: 'PLB-1' };
	const echo = () => Promise.resolve( {} );
	const image = { imageUrl: 'https://example.test/widget.png' };

	/**
	 * Save one block per change, each pointed at PLB-1.
	 *
	 * @param {Array}    changes - Attributes each block changes, one entry per block.
	 * @param {Function} respond - Answers each request.
	 * @return {Promise<object>} The deps the save ran with.
	 */
	const save = async ( changes, respond = echo ) => {
		const deps = fakeDeps( respond );
		await syncBlocksBeforeSave(
			changes.map( ( change, i ) => ( {
				clientId: `block-${ i }`,
				attributes: { ...saved, ...change },
			} ) ),
			deps
		);
		return deps;
	};

	beforeEach( () => {
		recordPaymentRead( 'block-0', 'PLB-1', product );
		recordPaymentRead( 'block-1', 'PLB-1', product );
	} );

	// Any value a PUT changes at PayPal may show on the card.
	it.each( [
		[ 'the name', { productName: 'Deluxe Widget' } ],
		[ 'the price', { price: '31.00' } ],
		[ 'the currency', { currencyCode: 'EUR' } ],
		[ 'the options', { variantsEnabled: true, variants: variantsWithPrices( priced ) } ],
		[ 'the tax', { taxEnabled: true, taxType: 'PERCENTAGE', taxValue: '10' } ],
		[ 'the return URL', { returnUrl: 'https://example.test/thanks' } ],
	] )( 'goes up when %s changes', async ( _label, change ) => {
		await save( [ change ] );

		expect( getCardRevision( 'PLB-1' ) ).toBe( 1 );
	} );

	// The first save after a load writes every block, and each new revision loads the SDK again.
	it.each( [
		[ 'the values are unchanged', {} ],
		[ 'only the format changes', { format: 'LINK' } ],
		[ 'only the image changes', image ],
	] )( 'stays put when %s', async ( _label, change ) => {
		const deps = await save( [ change ] );

		expect( deps.request ).toHaveBeenCalledTimes( 1 );
		expect( getCardRevision( 'PLB-1' ) ).toBe( 0 );
	} );

	// The read has PayPal's variants, and the block has them with the editor keys added.
	it( 'stays put when the options are unchanged', async () => {
		const variants = variantsWithPrices( priced );
		recordPaymentRead( 'block-0', 'PLB-1', { ...product, variantsEnabled: true, variants } );

		await save( [ { variantsEnabled: true, variants: normalizeResourceVariants( variants ) } ] );

		expect( getCardRevision( 'PLB-1' ) ).toBe( 0 );
	} );

	it( 'goes up once when several blocks share the payment', async () => {
		const deps = await save( [
			{ productName: 'Deluxe Widget' },
			{ productName: 'Deluxe Widget', format: 'LINK' },
		] );

		expect( deps.request ).toHaveBeenCalledTimes( 2 );
		expect( getCardRevision( 'PLB-1' ) ).toBe( 1 );
	} );

	// Two PUTs in one save can disagree, and PayPal keeps whichever it applied last, so
	// the next save counts any PUT as a change.
	it( 'goes up for every PUT after a save has written the payment', async () => {
		await save( [ { productName: 'Deluxe Widget' }, {} ] );
		await save( [ { productName: 'Deluxe Widget' }, image ] );

		expect( getCardRevision( 'PLB-1' ) ).toBe( 2 );
	} );

	// A read that 404s records the payment without its values.
	it( 'goes up for a PUT to a payment read without its values', async () => {
		recordPaymentRead( 'block-0', 'PLB-2' );

		await syncBlocksBeforeSave(
			[ { clientId: 'block-0', attributes: { ...saved, resourceId: 'PLB-2' } } ],
			fakeDeps( echo )
		);

		expect( getCardRevision( 'PLB-2' ) ).toBe( 1 );
	} );

	it.each( [
		[ 'refuses the PUT', { code: 'paypal_api_error', message: 'No.' } ],
		[ 'returns resource not found', { code: 'paypal_api_resource_not_found' } ],
	] )( 'stays put when PayPal %s', async ( _label, err ) => {
		await save( [ { productName: 'Deluxe Widget' } ], ( { method } ) =>
			'PUT' === method ? Promise.reject( err ) : Promise.resolve( { id: 'PLB-NEW1' } )
		);

		expect( getCardRevision( 'PLB-1' ) ).toBe( 0 );
	} );

	// The block takes the create response: variants without the editor keys, and the price
	// as PayPal formats it.
	it( 'stays put when the save after a create writes back the created values', async () => {
		const variants = variantsWithPrices( priced );
		const block = {
			...product,
			variantsEnabled: true,
			variants: normalizeResourceVariants( variants ),
		};
		const created = { ...block, price: '30.00', variants };
		const deps = fakeDeps( () => Promise.resolve( { id: 'PLB-NEW1', attributes: created } ) );
		const taken = { ...block, price: '30.00', isApiManaged: true, resourceId: 'PLB-NEW1' };

		await syncBlocksBeforeSave(
			[ { clientId: 'a', attributes: { ...block, price: '30' } } ],
			deps
		);
		await syncBlocksBeforeSave( [ { clientId: 'a', attributes: { ...taken, ...image } } ], deps );

		expect( deps.requests.map( r => r.method ) ).toEqual( [ 'POST', 'PUT' ] );
		expect( getCardRevision( 'PLB-NEW1' ) ).toBe( 0 );
	} );
} );

describe( 'reportSaved after a PUT', () => {
	const saved = { ...product, isApiManaged: true, resourceId: 'PLB-1' };
	const echo = () => Promise.resolve( {} );

	/**
	 * Save one block per change, each pointed at PLB-1.
	 *
	 * @param {Array} changes - Attributes each block changes, one entry per block.
	 * @return {Promise<object>} The deps the save ran with.
	 */
	const save = async changes => {
		const deps = fakeDeps( echo );
		await syncBlocksBeforeSave(
			changes.map( ( change, i ) => ( {
				clientId: `block-${ i }`,
				attributes: { ...saved, ...change },
			} ) ),
			deps
		);
		return deps;
	};

	beforeEach( () => {
		recordPaymentRead( 'block-0', 'PLB-1', product );
		recordPaymentRead( 'block-1', 'PLB-1', product );
	} );

	// The first save after a reload PUTs every block. The image is sent but never compared.
	it.each( [
		[ 'nothing changed', {} ],
		[ 'only the image changed', { imageUrl: 'https://example.test/widget.png' } ],
		[ 'only a format with the same mode changed', { format: 'QR' } ],
	] )( 'skips reportSaved when %s', async ( _label, change ) => {
		const deps = await save( [ change ] );

		expect( deps.requests.map( r => r.method ) ).toEqual( [ 'PUT' ] );
		expect( deps.reportSaved ).not.toHaveBeenCalled();
	} );

	it( 'skips reportSaved for a stacked block and its sibling on a payment already in BUTTON mode', async () => {
		const button = { ...product, integrationMode: 'BUTTON' };
		recordPaymentRead( 'block-0', 'PLB-1', button );
		recordPaymentRead( 'block-1', 'PLB-1', button );

		const deps = await save( [
			{ format: 'STACKED', integrationMode: 'BUTTON' },
			{ format: 'LINK', integrationMode: 'BUTTON' },
		] );

		expect( deps.requests.map( r => r.data.integration_mode ) ).toEqual( [ 'BUTTON', 'BUTTON' ] );
		expect( deps.reportSaved ).not.toHaveBeenCalled();
	} );

	// The create records what PayPal made as the read to compare with.
	it( 'skips reportSaved for an image-only PUT after a create', async () => {
		const deps = fakeDeps( ( { method } ) =>
			Promise.resolve( 'POST' === method ? { id: 'PLB-NEW1', attributes: product } : {} )
		);
		await syncBlocksBeforeSave( [ { clientId: 'c', attributes: product } ], deps );
		deps.reportSaved.mockClear();

		await syncBlocksBeforeSave(
			[
				{
					clientId: 'c',
					attributes: {
						...product,
						isApiManaged: true,
						resourceId: 'PLB-NEW1',
						imageUrl: 'https://example.test/widget.png',
					},
				},
			],
			deps
		);

		expect( deps.requests.map( r => r.method ) ).toEqual( [ 'POST', 'PUT' ] );
		expect( deps.reportSaved ).not.toHaveBeenCalled();
	} );

	it( 'calls reportSaved for a changed price', async () => {
		const deps = await save( [ { price: '31.00' } ] );

		expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );
	} );

	// Only the mode sent changes.
	it( 'calls reportSaved for a switch to stacked and keeps the card revision', async () => {
		const deps = await save( [ { format: 'STACKED' } ] );

		expect( deps.requests[ 0 ].data.integration_mode ).toBe( 'BUTTON' );
		expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );
		expect( getCardRevision( 'PLB-1' ) ).toBe( 0 );
	} );

	it( 'calls reportSaved once when one of two blocks sharing a payment changes it', async () => {
		const deps = await save( [ {}, { price: '31.00' } ] );

		expect( deps.requests ).toHaveLength( 2 );
		expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );
	} );

	// The first PUT drops the read to compare with.
	it( 'calls reportSaved for a second changed save in the same page load', async () => {
		await save( [ { price: '31.00' } ] );
		const deps = await save( [ { price: '32.00' } ] );

		expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );
	} );

	// A read that 404s records the payment without its values.
	it( 'calls reportSaved for a PUT to a payment read without its values', async () => {
		recordPaymentRead( 'block-0', 'PLB-2' );
		const deps = fakeDeps( echo );

		await syncBlocksBeforeSave(
			[ { clientId: 'block-0', attributes: { ...saved, resourceId: 'PLB-2' } } ],
			deps
		);

		expect( deps.reportSaved.mock.calls ).toEqual( [ [ false ] ] );
	} );
} );
