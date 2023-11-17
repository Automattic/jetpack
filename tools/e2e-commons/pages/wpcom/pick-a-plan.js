import WpPage from '../wp-page.js';
import logger from '../../logger.js';

export default class PickAPlanPage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ 'div.jetpack-product-store' ],
			explicitWaitMS: 40000,
		} );
	}

	async select( product = 'free' ) {
		switch ( product ) {
			case 'free':
				const freePlanButton = '.jetpack-product-store__jetpack-free a';
				await this.click( freePlanButton );
				break;
			default:
				logger.error( `Selecting plan '${ product }' is not implemented! Add it yourself?` );
		}
	}
}
