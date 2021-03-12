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
		await this.waitForElementToBeVisible( '.progress-bar.is-pulsing' );

		// Click on "Hide Message"
		await this.click( ".current-plan-thank-you a[href*='my-plan']" );
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await this.waitForElementToBeHidden( this.expectedSelector );
	}
}
