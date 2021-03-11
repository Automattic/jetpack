export default class SimplePaymentBlock {
	constructor( blockId, page ) {
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
		const titleSelector = this.getSelector( '.simple-payments__field-title' );
		const descriptionSelector = this.getSelector( '.simple-payments__field-content' );
		const priceSelector = this.getSelector( '.simple-payments__field-price' );
		const emailSelector = this.getSelector( '.simple-payments__field-email' );

		await this.page.type( titleSelector, title );
		await this.page.type( descriptionSelector, description );
		await this.page.type( priceSelector, price );
		await this.page.type( emailSelector, email );
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
		const containerSelector = '.jetpack-simple-payments-product';

		await page.waitForSelector( containerSelector );
	}
}
