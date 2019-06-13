/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector, waitAndClick, isEventuallyVisible } from '../../page-helper';

export default class ThankYouPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan-thank-you';
		super( page, { expectedSelector } );
	}

	async waitForSetupAndProceed() {
		// Wait for progress bar to appear first
		isEventuallyVisible( this.page, '.progress-bar.is-pulsing' );

		// Then wait it to disappear
		await waitForSelector( this.page, '.progress-bar.is-pulsing', {
			hidden: true,
			timeout: 90000,
		} );

		await waitAndClick( this.page, ".current-plan-thank-you a.button[href*='my-plan']" );
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await waitForSelector( this.page, this.expectedSelector, {
			hidden: true,
		} );
	}
}
