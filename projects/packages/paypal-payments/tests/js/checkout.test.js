/**
 * Tests for the on-site checkout script.
 *
 * PayPal's SDK is stood in for: the test grabs the callbacks the script hands to
 * `Buttons()` and drives them the way the SDK would.
 *
 * @package
 */

const ORDERS_URL = 'https://example.test/wp-json/wpcom/v2/paypal/orders';

/**
 * Render the checkout format's markup and run the script against it.
 *
 * @param {object} options            - What the page holds.
 * @param {string} options.quantity   - Value of the quantity field, or '' for none.
 * @param {string} options.max        - The `data-max-quantity` attribute.
 * @param {string} options.selects    - Option selects markup, if any.
 * @param {string} options.resourceId - The `data-resource-id` attribute.
 * @return {object} The callbacks handed to Buttons(), the block, and the container.
 */
function setUp( { quantity = '', max = '1', selects = '', resourceId = 'PLB-1' } = {} ) {
	const quantityField = quantity
		? `<label class="jetpack-paypal-button__quantity"><input type="number" class="jetpack-paypal-button__quantity-input" value="${ quantity }" min="1" max="${ max }" /></label>`
		: '';
	document.body.innerHTML = `
		<div class="wp-block-jetpack-paypal-payment-buttons">
			<div class="jetpack-paypal-button jetpack-paypal-button--checkout-format">
				${ selects }
				${ quantityField }
				<div class="jetpack-paypal-button__inline-checkout" data-resource-id="${ resourceId }" data-orders-url="${ ORDERS_URL }" data-max-quantity="${ max }" data-success-message="Thank you!" data-error-message="Payment failed."></div>
				<p class="jetpack-paypal-button__checkout-message" hidden></p>
			</div>
		</div>`;

	const render = jest.fn();
	const buttons = jest.fn( () => ( { render } ) );
	window.paypal_inline_checkout = { Buttons: buttons };

	jest.isolateModules( () => require( '../../src/paypal-payment-buttons/checkout' ) );

	return {
		buttons,
		render,
		callbacks: buttons.mock.calls[ 0 ]?.[ 0 ],
		block: document.querySelector( '.jetpack-paypal-button' ),
		container: document.querySelector( '.jetpack-paypal-button__inline-checkout' ),
	};
}

/**
 * Stand in for fetch with one JSON answer.
 *
 * @param {number} status - HTTP status.
 * @param {object} body   - JSON body.
 * @return {jest.Mock} The mock, for its calls.
 */
function answer( status, body ) {
	const fetch = jest.fn( () =>
		Promise.resolve( { ok: status < 400, status, json: () => Promise.resolve( body ) } )
	);
	global.fetch = fetch;
	return fetch;
}

describe( 'checkout script', () => {
	afterEach( () => {
		delete window.paypal_inline_checkout;
		delete window.paypal;
		delete global.fetch;
		document.body.innerHTML = '';
	} );

	it( 'renders PayPal buttons into the container', () => {
		const { buttons, render, container } = setUp();

		expect( buttons ).toHaveBeenCalledTimes( 1 );
		expect( render ).toHaveBeenCalledWith( container );
	} );

	it( 'does nothing without the SDK', () => {
		document.body.innerHTML = `<div class="jetpack-paypal-button__inline-checkout" data-resource-id="PLB-1" data-orders-url="${ ORDERS_URL }"></div>`;

		expect( () =>
			jest.isolateModules( () => require( '../../src/paypal-payment-buttons/checkout' ) )
		).not.toThrow();
	} );

	it( 'creates the order from the link, the quantity and the chosen options', async () => {
		const fetch = answer( 201, { id: 'ORDER1' } );
		const { callbacks } = setUp( {
			quantity: '3',
			max: '5',
			selects:
				'<select class="jetpack-paypal-button__variant-select" data-dimension="Size"><option value="Large" selected>Large</option></select>',
		} );

		await expect( callbacks.createOrder() ).resolves.toBe( 'ORDER1' );

		expect( fetch ).toHaveBeenCalledWith(
			ORDERS_URL,
			expect.objectContaining( { method: 'POST' } )
		);
		expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ) ).toEqual( {
			resource_id: 'PLB-1',
			quantity: 3,
			selection: { Size: 'Large' },
		} );
	} );

	it( 'keeps the quantity within the payment link', async () => {
		const fetch = answer( 201, { id: 'ORDER1' } );
		const { callbacks } = setUp( { quantity: '9', max: '5' } );

		await callbacks.createOrder();

		expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).quantity ).toBe( 5 );
	} );

	it( 'sends 1 when there is no quantity field', async () => {
		const fetch = answer( 201, { id: 'ORDER1' } );
		const { callbacks } = setUp();

		await callbacks.createOrder();

		expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).quantity ).toBe( 1 );
	} );

	it( 'captures the approved order and thanks the buyer', async () => {
		const fetch = answer( 200, { id: 'ORDER1', status: 'COMPLETED' } );
		const { callbacks, block } = setUp();

		await callbacks.onApprove( { orderID: 'ORDER1' } );

		expect( fetch ).toHaveBeenCalledWith(
			`${ ORDERS_URL }/ORDER1/capture`,
			expect.objectContaining( { method: 'POST' } )
		);
		const message = block.querySelector( '.jetpack-paypal-button__checkout-message' );
		expect( message.hidden ).toBe( false );
		expect( message ).toHaveTextContent( 'Thank you!' );
		expect( block ).toHaveClass( 'is-paid' );
	} );

	it( "shows the route's own message when the order cannot be created", async () => {
		answer( 400, { code: 'paypal_order_invalid_option', message: 'Please choose a Size.' } );
		const { callbacks, block } = setUp();

		await expect( callbacks.createOrder() ).rejects.toThrow( 'Please choose a Size.' );
		callbacks.onError( await callbacks.createOrder().catch( error => error ) );

		const message = block.querySelector( '.jetpack-paypal-button__checkout-message' );
		expect( message ).toHaveTextContent( 'Please choose a Size.' );
		expect( message ).toHaveClass( 'is-error' );
	} );

	it( 'shows the generic line for an error that is not ours', () => {
		const { callbacks, block } = setUp();

		callbacks.onError( new Error( 'Detected popup close' ) );

		expect( block.querySelector( '.jetpack-paypal-button__checkout-message' ) ).toHaveTextContent(
			'Payment failed.'
		);
	} );
} );
