/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class MyPlanPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.current-plan' ] } );
	}

	async returnToWPAdmin() {
		return await this.click( ".jetpack-checklist__footer a[href*='wp-admin']" );
	}
}
