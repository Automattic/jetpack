/**
 * Internal dependencies
 */
import Page from '../page';
import { isEventuallyVisible } from '../../page-helper';

export default class ThankYouPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan-thank-you';
		super( page, { expectedSelector } );
	}

	async waitForSetupAndProceed() {
		// Wait for progress bar to appear first
		await isEventuallyVisible( this.page, '.progress-bar.is-pulsing' );

		// Click on "Hide Message"
		await page.click( ".current-plan-thank-you a[href*='my-plan']" );
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await this.page.waitForSelector( this.expectedSelector, {
			state: 'hidden',
		} );
	}
}
