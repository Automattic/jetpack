/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitForSelector } from '../../page-helper';

export default class InPlaceAuthorizeFrame extends Page {
	constructor( page ) {
		const expectedSelector = 'iframe.jp-jetpack-connect__iframe';
		super( page, { expectedSelector } );
	}

	static async init( page ) {
		const loadingSelector = '.jp-connect-full__button-container-loading';
		await waitForSelector( page, loadingSelector, { hidden: true } );

		return await super.init( page );
	}

	async getFrame() {
		const iframeElement = await waitForSelector( this.page, this.expectedSelector );
		return await iframeElement.contentFrame();
	}

	async approve() {
		const approveSelector = 'button#approve';
		const iframe = await this.getFrame();
		await waitAndClick( iframe, approveSelector );
	}

	async waitToDisappear() {
		const spinnerSelector = '#spinner';
		const iframe = await this.getFrame();

		waitForSelector( iframe, spinnerSelector, { hidden: true } );
	}
}
