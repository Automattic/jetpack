/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector, waitAndClick } from '../../page-helper';

export default class ThankYouPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan-thank-you';
		super( page, { expectedSelector } );
	}

	async waitForSetupAndProceed() {
		await waitForSelector( this.page, '.progress-bar.is-pulsing', {
			hidden: true,
			timeout: 90000,
		} );

		return await waitAndClick( this.page, ".current-plan-thank-you a.button[href*='my-plan']" );
	}
}
