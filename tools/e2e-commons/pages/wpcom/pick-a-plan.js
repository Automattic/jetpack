import WpPage from '../wp-page.js';

export default class PickAPlanPage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ 'div.jetpack-product-store' ],
			explicitWaitMS: 40000,
		} );
	}

	async select( product = 'free' ) {
		switch ( product ) {
			case 'complete':
				return await this.selectComplete();
			case 'free':
			default:
				return await this.selectFreePlan();
		}
	}

	async selectFreePlan() {
		const freePlanButton = '.jetpack-product-store__jetpack-free a';
		return await this.click( freePlanButton );
	}

	async selectComplete() {
		const buttonSelector =
			'div[data-e2e-product-slug="jetpack_complete"] [class*="summary"] button';
		return await this.click( buttonSelector );
	}
}
