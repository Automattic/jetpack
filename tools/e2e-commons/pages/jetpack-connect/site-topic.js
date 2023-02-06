import WpPage from '../wp-page.js';

export default class JetpackSiteTopicPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.jetpack-connect__step .site-topic__content' ] } );
	}

	async selectSiteTopic( siteTopic ) {
		const siteTopicInputSelector = '.suggestion-search input';
		const siteTopicButtonSelector = '.site-topic__content button[type="submit"]';
		const siteTopicSpinnerSelector = '.suggestion-search .spinner';

		await this.click( siteTopicInputSelector, { clickCount: 3 } );
		await this.fill( siteTopicInputSelector, siteTopic );

		await this.waitForElementToBeHidden( siteTopicSpinnerSelector );
		await this.click( siteTopicButtonSelector );
	}
}
