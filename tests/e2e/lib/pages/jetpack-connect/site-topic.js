/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector } from '../../page-helper';

export default class JetpackSiteTopicPage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__step .site-topic__content';
		super( page, { expectedSelector } );
	}

	async selectSiteTopic( siteTopic ) {
		const siteTopicInputSelector = '.suggestion-search input';
		const siteTopicButtonSelector = '.site-topic__content button[type="submit"]';
		const siteTopicSpinnerSelector = '.suggestion-search .spinner';

		const siteTopicElement = await waitForSelector( this.page, siteTopicInputSelector, {
			state: 'visible',
		} );
		await siteTopicElement.click( { clickCount: 3 } );
		await siteTopicElement.type( siteTopic );

		await waitForSelector( this.page, siteTopicSpinnerSelector, {
			state: 'hidden',
		} );
		return await page.click( siteTopicButtonSelector );
	}
}
