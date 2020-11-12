/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector } from '../../page-helper';

export default class InPlaceAuthorizeFrame extends Page {
	constructor( page ) {
		const expectedSelector = 'iframe.jp-jetpack-connect__iframe';
		super( page, { expectedSelector } );
	}

	static async init( page ) {
		const loadingSelector = '.jp-connect-full__button-container-loading';
		await waitForSelector( page, loadingSelector, { state: 'hidden' } );

		return await super.init( page );
	}

	async getFrame() {
		const iframeElement = await waitForSelector( this.page, this.expectedSelector );
		return await iframeElement.contentFrame();
	}

	async approve() {
		const approveSelector = 'button#approve';
		const iframe = await this.getFrame();
		await iframe.click( approveSelector );
		return this.waitToDisappear();
	}

	async waitToDisappear() {
		return await waitForSelector( this.page, this.expectedSelector, { state: 'hidden' } );
	}
}
