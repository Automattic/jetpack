/**
 * Internal dependencies
 */
import { waitForSelector } from '../page-helper';

export default class SimplePaymentBlock {
	constructor( block, page ) {
		this.blockTitle = SimplePaymentBlock.title();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
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

		await page.click( titleSelector );
		await page.type( titleSelector, title );

		await page.click( descriptionSelector );
		await page.type( descriptionSelector, description );

		await page.click( priceSelector );
		await page.type( priceSelector, price );

		await page.click( emailSelector );
		await page.type( emailSelector, email );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Puppeteer page instance
	 */
	static async isRendered( page ) {
		const containerSelector = '.jetpack-simple-payments-product';

		await waitForSelector( page, containerSelector );
	}
}
