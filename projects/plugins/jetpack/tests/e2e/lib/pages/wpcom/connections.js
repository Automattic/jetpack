/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import { getAccountCredentials } from '../../utils-helper';

export default class ConnectionsPage extends WpPage {
	constructor( page ) {
		super( page, {
			expectedSelectors: [ '.connections__sharing-connections' ],
			explicitWaitMS: 40000,
		} );
	}

	async selectMailchimpList( mailchimpList = 'e2etesting' ) {
		const loadingIndicatorSelector = '.foldable-card__summary button:not([disabled])';
		const mailchimpExpandSelector = '.mailchimp .foldable-card__expand';
		const marketingSelectSelector = '.mailchimp select';
		const mcOptionXpathSelector = `//option[contains(text(), '${ mailchimpList }')]`;
		const successNoticeSelector = `//span[contains(text(), '${ mailchimpList }')]`;

		await this.waitForElementToBeVisible( loadingIndicatorSelector );

		await this.click( mailchimpExpandSelector );

		// WPCOM Connections page
		await this.waitForElementToBeAttached( mcOptionXpathSelector );
		await this.selectOption( marketingSelectSelector, { label: mailchimpList } );
		await this.waitForElementToBeVisible( successNoticeSelector );
		await this.page.close();
	}

	async connectMailchimp() {
		const mailchimpConnectSelector =
			'div.mailchimp .foldable-card__summary-expanded button:not([disabled])';
		const mcPopupPage = await this.clickAndWaitForNewPage( mailchimpConnectSelector );

		// MC Login pop-up page. TODO: maybe extract to a new page
		const [ mcLogin, mcPassword ] = getAccountCredentials( 'mailchimpLogin' );
		// Locators
		const mcUsernameSelector = '#login #username';
		const mcPasswordSelector = '#login #password';
		const mcSubmitSelector = "#login input[type='submit']";

		await mcPopupPage.type( mcUsernameSelector, mcLogin );
		await mcPopupPage.type( mcPasswordSelector, mcPassword );
		await mcPopupPage.type( mcSubmitSelector );
		await this.page.bringToFront();
	}
}
