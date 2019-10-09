/**
 * Internal dependencies
 */
import { waitAndType, waitAndClick, waitForSelector } from '../page-helper';

export default class SimplePaymentBlock {
	constructor( block, page ) {
		this.blockName = SimplePaymentBlock.name();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
	}

	static name() {
		return 'Simple Payments';
	}

	async fillDetails( {
		title = `SP test ${ new Date() }`,
		description = 'random product description',
		price = '23.42',
		// isMultiple = false,
		email = 'test@example.com',
	} = {} ) {
		const titleSelector = this.getSelector( '.simple-payments__field-title' );
		const descriptionSelector = this.getSelector( '.simple-payments__field-content' );
		// const currencySelector = this.getSelector( '.simple-payments__field-currency' );
		const priceSelector = this.getSelector( '.simple-payments__field-price' );
		// const multipleProductButton = this.getSelector( '.simple-payments__field-multiple' );
		const emailSelector = this.getSelector( '.simple-payments__field-email' );
		// const mediaUploadSelector = this.getSelector( '.components-form-file-upload input' );

		await waitAndClick( this.page, titleSelector );
		await waitAndType( this.page, titleSelector, title );

		await waitAndClick( this.page, descriptionSelector );
		await waitAndType( this.page, descriptionSelector, description );

		await waitAndClick( this.page, priceSelector );
		await waitAndType( this.page, priceSelector, price );

		await waitAndClick( this.page, emailSelector );
		await waitAndType( this.page, emailSelector, email );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 * @param {Page} page Puppeteer page instance
	 */
	static async isRendered( page ) {
		const containerSelector = '.jetpack-simple-payments-product';

		await waitForSelector( page, containerSelector );
	}
}
