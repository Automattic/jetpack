/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class ThankYouPage extends WpPage {
	constructor( page ) {
		const expectedSelector = '.current-plan-thank-you';
		super( page, 'ThankYouPage', { expectedSelector } );
	}

	async waitForSetupAndProceed() {
		// Wait for progress bar to appear first
		await this.page.isVisible( '.progress-bar.is-pulsing' );

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
