/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import { getMailchimpCredentials } from '../../utils-helper';

export default class ConnectionsPage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ '.connections__sharing-connections' ],
			explicitWaitMS: 40000,
		} );
	}

	async isEnabled() {
		return ! ( await this.isElementVisible( '.notice.is-warning a.notice__action' ) );
	}

	async selectMailchimpList( mailchimpList = 'e2etesting' ) {
		const loadingIndicatorSelector = '.foldable-card__summary button:not([disabled])';
		const mailchimpExpandSelector = '.mailchimp .foldable-card__expand';
		const warningNoticeSelector = '.mailchimp .notice.is-warning';
		const marketingSelectSelector = '.mailchimp.is-expanded select ';
		const mcOptionXpathSelector = `//option[contains(text(), '${ mailchimpList }')]`;
		const successNoticeSelector = `//span[contains(text(), '${ mailchimpList }')]`;

		await this.waitForElementToBeVisible( loadingIndicatorSelector );

		await this.click( mailchimpExpandSelector );
		// Warning notice appears with a bit of a delay, so let's wait for it to get visible
		await this.waitForElementToBeVisible( warningNoticeSelector );

		await this.waitForElementToBeAttached( mcOptionXpathSelector );
		await this.selectOption( marketingSelectSelector, { label: mailchimpList } );
		await this.waitForElementToBeVisible( successNoticeSelector, 10000 );
		await this.page.close();
	}

	async connectMailchimp() {
		const mailchimpConnectSelector =
			'div.mailchimp .foldable-card__summary-expanded button:not([disabled])';
		const mcPopupPage = await this.clickAndWaitForNewPage( mailchimpConnectSelector );

		// MC Login pop-up page. TODO: maybe extract to a new page
		const credentials = getMailchimpCredentials();
		// Locators
		const mcUsernameSelector = '#login #username';
		const mcPasswordSelector = '#login #password';
		const mcSubmitSelector = "#login input[type='submit']";

		await mcPopupPage.fill( mcUsernameSelector, credentials.username );
		await mcPopupPage.fill( mcPasswordSelector, credentials.password );
		await mcPopupPage.fill( mcSubmitSelector );
		await this.page.bringToFront();
	}
}
