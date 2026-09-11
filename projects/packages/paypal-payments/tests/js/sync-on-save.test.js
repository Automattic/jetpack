/**
 * Tests for syncing PayPal payments with the post save.
 *
 * @package
 */

import {
	deleteRemovedPayments,
	forgetSyncedRequests,
	isReadyForPayPal,
	removedResourceIds,
	resourceIdsIn,
	syncBlocksBeforeSave,
} from '../../src/paypal-payment-buttons/utils/sync-on-save';

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
		const storedLineItem = {
			name: 'Stale name',
			product_id: 'SKU-12345',
			shipping: [ { type: 'FLAT', value: '5.00' } ],
			handling: [ { type: 'FLAT', value: '4.00' } ],
			discounts: [ { type: 'FLAT', value: '2.00' } ],
			// The block sends false, so a true in the PUT can only have come from the payment.
			collect_shipping_address: true,
		};

		/**
		 * Answer the read with the stored payment and every write with nothing.
		 *
		 * @param {object} options - The request.
		 * @return {Promise<object>} The response.
		 */
		const stored = options =>
			options.method === undefined
				? Promise.resolve( { id: 'PLB-KEEP1', line_items: [ storedLineItem ] } )
				: Promise.resolve( {} );

		it( 'reads the payment and updates it, keeping the fields set outside the form', async () => {
			const deps = fakeDeps( stored );

			const changed = await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );

			expect( changed ).toBe( false );
			expect( deps.requests.map( r => r.method ) ).toEqual( [ undefined, 'PUT' ] );
			const [ item ] = deps.requests[ 1 ].data.line_items;
			expect( item ).toMatchObject( {
				name: 'Test Widget',
				product_id: 'SKU-12345',
				shipping: storedLineItem.shipping,
				handling: storedLineItem.handling,
				discounts: storedLineItem.discounts,
				collect_shipping_address: true,
			} );
			expect( deps.updateBlockAttributes ).not.toHaveBeenCalled();
		} );

		it( 'does not send an unchanged block twice', async () => {
			const deps = fakeDeps( stored );

			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			await syncBlocksBeforeSave( [ { clientId: 'a', attributes: saved } ], deps );
			expect( deps.requests ).toHaveLength( 2 );

			await syncBlocksBeforeSave(
				[ { clientId: 'a', attributes: { ...saved, price: '31.00' } } ],
				deps
			);
			expect( deps.requests ).toHaveLength( 4 );
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
				options.method === undefined
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
