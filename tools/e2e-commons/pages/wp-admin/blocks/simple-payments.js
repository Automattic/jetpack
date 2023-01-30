import EditorCanvas from './editor-canvas.js';

export default class SimplePaymentBlock extends EditorCanvas {
	constructor( blockId, page ) {
		super( page, 'Pay with PayPal block' );
		this.blockTitle = SimplePaymentBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
	}

	static name() {
		return 'simple-payments';
	}

	static title() {
		return 'Pay with PayPal';
	}

	async fillDetails( {
		title = `SP test ${ new Date() }`,
		description = 'random product description',
		price = '23.42',
		email = 'test@example.com',
	} = {} ) {
		const titleSelector = this.getSelector( '.simple-payments__field-title input' );
		const descriptionSelector = this.getSelector( '.simple-payments__field-content textarea' );
		const priceSelector = this.getSelector( '.simple-payments__field-price input' );
		const emailSelector = this.getSelector( '.simple-payments__field-email input' );

		await this.canvas().fill( titleSelector, title );
		await this.canvas().fill( descriptionSelector, description );
		await this.canvas().fill( priceSelector, price );
		await this.canvas().fill( emailSelector, email );
		await this.waitForResponse();
	}

	async waitForResponse() {
		const response = await this.page.waitForResponse( r =>
			decodeURIComponent( r.url() ).match( /jp_pay_product/ )
		);
		expect( [ 200, 201 ], 'Response status should be 200' ).toContain( response.status() );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		await page.waitForSelector( '.jetpack-simple-payments-product' );
	}
}
