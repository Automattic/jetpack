/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class PickAPlanPage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-product-card-alt .jetpack-product-card-alt__raw-price';
		super( page, { expectedSelector } );
	}

	async select( product = 'free', type = 'daily' ) {
		switch ( product ) {
			case 'complete':
				return await this.selectComplete();
			case 'security':
				return await this.selectSecurity( type );
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
		const buttonSelector = 'div[data-icon="jetpack_complete_v2"] .jetpack-product-card-alt__button';
		// [data-icon="jetpack_complete_v2"] .jetpack-product-card-alt__button
		return await waitAndClick( this.page, buttonSelector );
	}

	async selectSecurity( type ) {
		const buttonSelector = 'div[data-icon="jetpack_security_v2"] .jetpack-product-card-alt__button';
		await waitAndClick( this.page, buttonSelector );

		// We actually redirecting to new view, so lets wait for a expected selector here.
		await this.waitForPage();
		const securityTypeSelector = `[data-icon="jetpack_security_${ type }_v2"] .jetpack-product-card-alt__button`;
		return await waitAndClick( this.page, securityTypeSelector );
	}
}
