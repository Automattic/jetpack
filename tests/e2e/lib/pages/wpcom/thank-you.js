/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector, waitAndClick } from '../../page-helper';

export default class ThankYouPage extends Page {
	constructor( page ) {
		const expectedSelector = '.current-plan-thank-you-card__content';
		super( page, { expectedSelector } );
	}

	async waitForSetupAndProceed() {
		await waitForSelector( this.page, '.progress-bar.is-pulsing', {
			hidden: true,
			timeout: 60000,
		} );

		return await waitAndClick(
			this.page,
			".current-plan-thank-you-card__content a.button[href*='my-plan']"
		);
	}
}
