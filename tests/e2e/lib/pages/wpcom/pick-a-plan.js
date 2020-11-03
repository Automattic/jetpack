/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class PickAPlanPage extends Page {
	constructor( page ) {
		const expectedSelector = 'div[data-e2e-product-slug="jetpack_complete"]';
		super( page, { expectedSelector, explicitWaitMS: 40000 } );
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
		const freePlanButton = '.jetpack-free-card-alt__main a';
		return await waitAndClick( this.page, freePlanButton );
	}

	async selectComplete() {
		const buttonSelector =
			'div[data-e2e-product-slug="jetpack_complete"] [class*="summary"] button';
		return await waitAndClick( this.page, buttonSelector );
	}
}
