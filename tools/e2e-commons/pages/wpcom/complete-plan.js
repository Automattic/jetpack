import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';

export default class CompletePage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ 'div.jetpack-complete-page__main' ],
			explicitWaitMS: 40000,
		} );
	}

	async viewProducts() {
		const viewProductsButton = '.view-all-products-link a';
		await this.click( viewProductsButton );
	}

	async select( product = 'free' ) {
		switch ( product ) {
			case 'free':
				const freePlanButton = '.jetpack-complete-page__start-free-button a';
				await this.click( freePlanButton );
				break;
			default:
				logger.error( `Selecting plan '${ product }' is not implemented! Add it yourself?` );
		}
	}
}
