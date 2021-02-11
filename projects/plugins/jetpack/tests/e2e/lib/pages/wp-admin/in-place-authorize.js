/**
 * Internal dependencies
 */
import Page from '../page';

export default class InPlaceAuthorizeFrame extends Page {
	constructor( page ) {
		const expectedSelector = 'iframe.jp-jetpack-connect__iframe';
		super( page, { expectedSelector } );
	}

	static async init( page ) {
		const loadingSelector = '.jp-connect-full__button-container-loading';
		await page.waitForSelector( loadingSelector, { state: 'hidden' } );

		return await super.init( page );
	}

	async getFrame() {
		const iframeElement = await this.page.waitForSelector( this.expectedSelector );
		return await iframeElement.contentFrame();
	}

	async approve() {
		const approveSelector = 'button#approve';
		const iframe = await this.getFrame();
		await iframe.click( approveSelector );
		return this.waitToDisappear();
	}

	async waitToDisappear() {
		return await this.page.waitForSelector( this.expectedSelector, { state: 'hidden' } );
	}
}
