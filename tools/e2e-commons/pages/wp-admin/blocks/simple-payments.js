import EditorCanvas from './editor-canvas.js';
import { expect } from '@playwright/test';
import { BlockEditorPage } from '../index.js';

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

	async insertBlock() {
		const blockEditor = new BlockEditorPage( this.page );

		const responsePromise = this.page.waitForResponse(
			r =>
				decodeURIComponent( decodeURIComponent( r.url() ) ).match( /jp_pay_product/ ) &&
				r.request().method() === 'POST'
		);
		const blockId = await blockEditor.insertBlock(
			SimplePaymentBlock.name(),
			SimplePaymentBlock.title()
		);
		const response = await responsePromise;
		expect( response.ok(), 'Response status should be ok' ).toBeTruthy();
		return blockId;
	}

	async checkBlock() {
		await this.page.waitForRequest( request => {
			// eslint-disable-next-line no-unused-expressions
			console.log( `Waiting for request: ${ decodeURIComponent( request.url() ) }` );
			return (
				decodeURIComponent( request.url() ).match( /jp_pay_product/ ) && request.method() === 'POST'
			);
		} );

		// let response;
		// try {
		// 	response = await this.page.waitForResponse(
		// 		r => {
		// 			// eslint-disable-next-line no-unused-expressions
		// 			console.log( r.status() + ' ' +  r.request().method()+': ' + decodeURIComponent(r.url()) ),
		// 			decodeURIComponent( r.url() ).match( /jp_pay_product/ ) &&
		// 				r.request().method() === 'POST',
		// 				{ timeout: 10 };
		// 		}
		// 	);
		// } catch (e) {
		// 	console.log( `Timeout waiting for ${response}` );
		// 	throw e;
		// }
		// expect( response.ok(), 'Response status should be ok' ).toBeTruthy();
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
