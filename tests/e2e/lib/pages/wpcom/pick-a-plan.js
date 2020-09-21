/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class PickAPlanPage extends Page {
	constructor( page ) {
		// const expectedSelector = '.plan-features__table button.is-premium-plan:not([disabled])';
		const expectedSelector = '.plans-v2__columns .jetpack-product-card__price';
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
		const freePlanButton = 'a.jetpack-free-card__button';
		return await waitAndClick( this.page, freePlanButton );
	}

	async selectComplete() {
		const buttonSelector = 'div[data-icon="jetpack_complete_v2"] .jetpack-product-card__button';
		return await waitAndClick( this.page, buttonSelector );
	}

	async selectSecurity( type ) {
		const buttonSelector = 'div[data-icon="jetpack_security_v2"] .jetpack-product-card__button';
		await waitAndClick( this.page, buttonSelector );

		// We actually redirecting to new view, so lets wait for a expected selector here.
		await this.waitForPage();
		const securityTypeSelector = `[data-icon="jetpack_security_${ type }_v2"] .jetpack-product-card__button`;
		return await waitAndClick( this.page, securityTypeSelector );
	}
}
