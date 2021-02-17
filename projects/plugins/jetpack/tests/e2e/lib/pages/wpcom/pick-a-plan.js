/**
 * Internal dependencies
 */
import Page from '../page';

export default class PickAPlanPage extends Page {
	constructor( page ) {
		const expectedSelector = 'div[data-e2e-product-slug="jetpack_complete"]';
		super( page, { expectedSelector, explicitWaitMS: 40000 } );
	}

	async waitForPage() {
		await super.waitForPage();
		await this.page.waitForSelector( '.jetpack-product-card-alt__price-placeholder', {
			state: 'hidden',
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
		const freePlanButton = '[data-e2e-product-slug="free"] a';
		await this.page.waitForTimeout( 500 );
		return await page.click( freePlanButton );
	}

	async selectComplete() {
		const buttonSelector =
			'div[data-e2e-product-slug="jetpack_complete"] [class*="summary"] button';
		return await page.click( buttonSelector );
	}
}
