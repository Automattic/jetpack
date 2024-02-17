import WpPage from '../wp-page.js';
import logger from '../../logger.js';

export default class CompletePage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ 'main.jetpack-complete-page__main' ],
			explicitWaitMS: 40000,
		} );
	}

	async viewProducts() {
		const viewProductsButton = 'a.view-all-products-link';
		await this.click( viewProductsButton );
	}

	async select( product = 'free' ) {
		switch ( product ) {
			case 'free':
				const freePlanButton = 'a.jetpack-complete-page__start-free-button';
				await this.click( freePlanButton );
				break;
			default:
				logger.error( `Selecting plan '${ product }' is not implemented! Add it yourself?` );
		}
	}
}
