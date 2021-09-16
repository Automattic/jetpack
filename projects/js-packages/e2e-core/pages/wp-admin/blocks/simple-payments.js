import PageActions from '../../page-actions';

export default class SimplePaymentBlock extends PageActions {
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

		await this.fill( titleSelector, title );
		await this.fill( descriptionSelector, description );
		await this.fill( priceSelector, price );
		await this.fill( emailSelector, email );
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
