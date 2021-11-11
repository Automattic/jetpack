import WpPage from '../wp-page.js';

export default class InPlacePlansPage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ '.plans-prompt__footer a' ],
			explicitWaitMS: 60000,
		} );
	}

	async selectFreePlan() {
		const freePlanButton = '.plans-prompt__footer a';
		return await this.click( freePlanButton );
	}

	async selectProPlan() {
		const freePlanButton = ".plan-features__table-item a[href*='business']";
		return await this.click( freePlanButton );
	}
}
