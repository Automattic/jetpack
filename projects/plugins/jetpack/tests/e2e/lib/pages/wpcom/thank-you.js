/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class ThankYouPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.current-plan-thank-you' ] } );
	}

	async waitForSetupAndProceed() {
		// Click on "Hide Message"
		await this.click( ".current-plan-thank-you a[href*='my-plan']" );
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await this.waitForElementToBeHidden( this.selectors[ 0 ] );
	}
}
