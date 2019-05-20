/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../pageHelper';

export default class PickAPlanPage extends Page {
	constructor( page ) {
		const expectedSelector = '.plan-features__table button.is-personal-plan:not([disabled])';
		super( page, { expectedSelector } );
	}

	async selectFreePlan() {
		// During signup, we used to no longer display the Free plan, so we have to click the "Skip" button
		const skipButtonSelector = '.plans-skip-button button';
		const skipButtonDisplayed = await this.page.$( skipButtonSelector );

		if ( skipButtonDisplayed === true ) {
			return await waitAndClick( this.page, skipButtonSelector );
		}
		return await this._selectPlan( 'free' );
	}

	async selectFreeJetpackPlan() {
		const freePlanButton = '.plans-skip-button button';
		return waitAndClick( this.page, freePlanButton );
	}
}
