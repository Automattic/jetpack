/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class PlansPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.plans-features-main' ] } );
	}

	async returnToWPAdmin() {
		return await this.click( ".jetpack-checklist__footer a[href*='wp-admin']" );
	}

	async isCurrentPlan( plan = 'business' ) {
		const currentPlanSelector = `.is-current.is-${ plan }-plan`;
		return await this.waitForElementToBeVisible( currentPlanSelector );
	}
}
