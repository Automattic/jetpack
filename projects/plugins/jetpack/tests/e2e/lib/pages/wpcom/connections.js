/**
 * Internal dependencies
 */
import Page from '../page';
import { clickAndWaitForNewPage, getAccountCredentials } from '../../page-helper';

export default class ConnectionsPage extends Page {
	constructor( page ) {
		const expectedSelector = '.connections__sharing-connections';
		super( page, { expectedSelector, explicitWaitMS: 40000 } );
	}

	async selectMailchimpList( mailchimpList = 'e2etesting' ) {
		const loadingIndicatorSelector = '.foldable-card__summary button:not([disabled])';
		const mailchimpExpandSelector = '.mailchimp .foldable-card__expand';
		const marketingSelectSelector = '.mailchimp select';
		const mcOptionXpathSelector = `//option[contains(text(), '${ mailchimpList }')]`;
		const successNoticeSelector = `//span[contains(text(), '${ mailchimpList }')]`;

		await this.page.waitForSelector( loadingIndicatorSelector );

		await this.page.click( mailchimpExpandSelector );

		// WPCOM Connections page
		await this.page.waitForSelector( mcOptionXpathSelector, { state: 'attached' } );
		await this.page.selectOption( marketingSelectSelector, { label: mailchimpList } );
		await this.page.waitForSelector( successNoticeSelector );
		await this.page.close();
	}

	async connectMailchimp() {
		const mailchimpConnectSelector =
			'div.mailchimp .foldable-card__summary-expanded button:not([disabled])';
		const mcPopupPage = await clickAndWaitForNewPage( this.page, mailchimpConnectSelector );

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
