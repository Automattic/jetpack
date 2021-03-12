/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class MyPlanPage extends WpPage {
	constructor( page ) {
		const expectedSelector = '.current-plan';
		super( page, 'MyPlanPage', { expectedSelector } );
	}

	async returnToWPAdmin() {
		return await page.click( ".jetpack-checklist__footer a[href*='wp-admin']" );
	}
}
