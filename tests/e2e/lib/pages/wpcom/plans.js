/**
 * External dependencies
 */
import { waitAndClick, waitForSelector, Page } from 'puppeteer-utils';

export default class PlansPage extends Page {
	constructor( page ) {
		const expectedSelector = '.plans-features-main';
		super( page, { expectedSelector } );
	}

	async returnToWPAdmin() {
		return await waitAndClick( this.page, ".jetpack-checklist__footer a[href*='wp-admin']" );
	}

	async isCurrentPlan( plan = 'business' ) {
		const currentPlanSelector = `.is-current.is-${ plan }-plan`;
		return await waitForSelector( this.page, currentPlanSelector );
	}
}
