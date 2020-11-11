/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class MyPlanPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan';
		super( page, { expectedSelector } );
	}

	async returnToWPAdmin() {
		return await page.click( ".jetpack-checklist__footer a[href*='wp-admin']" );
	}
}
