/**
 * Internal dependencies
 */
import Page from '../page';

export default class MyPlanPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan';
		super( page, { expectedSelector } );
	}

	async returnToWPAdmin() {
		return await this.page.click( ".jetpack-checklist__footer a[href*='wp-admin']" );
	}
}
