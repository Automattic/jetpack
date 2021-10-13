import { WpPage } from '..';

export default class PickAPlanPage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ 'div[data-e2e-product-slug="jetpack_complete"]' ],
			explicitWaitMS: 40000,
		} );
	}

	async waitForPage() {
		await super.waitForPage();
		await this.waitForElementToBeHidden( '.jetpack-product-card-alt__price-placeholder' );
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
		await this.waitForTimeout( 500 );
		return await this.click( freePlanButton );
	}

	async selectComplete() {
		const buttonSelector =
			'div[data-e2e-product-slug="jetpack_complete"] [class*="summary"] button';
		return await this.click( buttonSelector );
	}
}
