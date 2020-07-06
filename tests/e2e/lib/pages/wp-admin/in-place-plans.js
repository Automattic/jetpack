/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class InPlacePlansPage extends Page {
	constructor( page ) {
		const expectedSelector = '.plans-prompt__footer a';
		super( page, { expectedSelector, explicitWaitMS: 60000 } );
	}

	async selectFreePlan() {
		const freePlanButton = '.plans-prompt__footer a';
		return await waitAndClick( this.page, freePlanButton );
	}

	async selectProPlan() {
		const freePlanButton = ".plan-features__table-item a[href*='business']";
		return await waitAndClick( this.page, freePlanButton );
	}
}
