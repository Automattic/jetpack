/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitForSelector } from '../../page-helper';
import { sendMessageToSlack } from '../../reporters/slack';
import logger from '../../logger';
import InPlacePlansPage from './in-place-plans';
import JetpackPage from './jetpack';

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

	async approve( repeat = true ) {
		const approveSelector = 'button#approve';
		const iframe = await this.getFrame();
		await waitAndClick( iframe, approveSelector );
		try {
			return await InPlacePlansPage.init( this.page );
		} catch ( error ) {
			if ( repeat ) {
				const message = 'Jetpack in-place connection failed. Retrying once again.';
				logger.info( message );
				await sendMessageToSlack( message );

				await this.page.reload();
				await ( await JetpackPage.init( this.page ) ).connect();
				return await this.approve( false );
			}
			throw error;
		}
	}

	async waitToDisappear() {
		const spinnerSelector = '#spinner';
		const iframe = await this.getFrame();

		waitForSelector( iframe, spinnerSelector, { hidden: true } );
	}
}
