/**
 * Internal dependencies
 */
import Page from '../page';

export default class PlansPage extends Page {
	constructor( page ) {
		const expectedSelector = '.plans-features-main';
		super( page, { expectedSelector } );
	}

	async returnToWPAdmin() {
		return await page.click( ".jetpack-checklist__footer a[href*='wp-admin']" );
	}

	async isCurrentPlan( plan = 'business' ) {
		const currentPlanSelector = `.is-current.is-${ plan }-plan`;
		return await this.page.waitForSelector( currentPlanSelector );
	}
}
