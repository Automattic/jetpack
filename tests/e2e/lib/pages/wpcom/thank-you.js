/**
 * External dependencies
 */
import { waitForSelector, waitAndClick, isEventuallyVisible, Page } from 'puppeteer-utils';

export default class ThankYouPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan-thank-you';
		super( page, { expectedSelector } );
	}

	async waitForSetupAndProceed() {
		// Wait for progress bar to appear first
		await isEventuallyVisible( this.page, '.progress-bar.is-pulsing' );

		// Click on "Hide Message"
		await waitAndClick( this.page, ".current-plan-thank-you a[href*='my-plan']" );
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await waitForSelector( this.page, this.expectedSelector, {
			hidden: true,
		} );
	}
}
