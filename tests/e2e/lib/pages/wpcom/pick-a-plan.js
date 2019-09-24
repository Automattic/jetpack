/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitForSelector } from '../../page-helper';

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
		return await waitAndClick( this.page, freePlanButton );
	}

	async selectPremiumPlan() {
		return await this._selectPlan( 'premium' );
	}

	async selectBusinessPlan() {
		return await this._selectPlan( 'business' );
	}

	async _selectPlan( level ) {
		// We are switching from two separate designs for mobile and desktop plans to one. There will be two buttons -
		// one visible and one hidden in control and only one button in the test variation.
		let planSelector = `.plan-features__table button.is-${ level }-plan`;

		if (
			level === 'free' &&
			! ( await waitForSelector( this.page, planSelector, { timeout: 10000 } ) )
		) {
			planSelector = '.plans-features-main__banner-content button';
		}

		await waitAndClick( this.page, planSelector );
		await waitForSelector( this.page, planSelector, { hidden: true } );
	}
}
