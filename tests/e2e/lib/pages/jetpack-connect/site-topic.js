/**
 * External dependencies
 */
import { waitAndClick, waitForSelector, Page } from 'puppeteer-utils';

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
			visible: true,
		} );
		await siteTopicElement.click( { clickCount: 3 } );
		await siteTopicElement.type( siteTopic );

		await waitForSelector( this.page, siteTopicSpinnerSelector, { hidden: true } );
		return await waitAndClick( this.page, siteTopicButtonSelector );
	}
}
