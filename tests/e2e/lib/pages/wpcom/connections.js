/**
 * External dependencies
 */
import {
	waitAndClick,
	waitAndType,
	clickAndWaitForNewPage,
	getAccountCredentials,
	isEventuallyPresent,
	Page,
} from 'puppeteer-utils';

export default class ConnectionsPage extends Page {
	constructor( page ) {
		const expectedSelector = '.connections__sharing-connections';
		super( page, { expectedSelector, explicitWaitMS: 40000 } );
	}

	async selectMailchimpList( mailchimpList = 'e2etesting' ) {
		const mailchimpExpandSelector = '.mailchimp .foldable-card__expand';
		const marketingSelectSelector = '.mailchimp select';
		const mcOptionXpathSelector = `//option[contains(text(), '${ mailchimpList }')]`;
		const successNoticeSelector = `//span[contains(text(), '${ mailchimpList }')]`;

		await waitAndClick( this.page, mailchimpExpandSelector );

		// If user account is already connected to Mailchimp, we don't really need to connect it once again
		// TODO: It's actually a default state, since connections are shared between sites. So we could get rid of chunk entirely
		const isConnectedAlready = await isEventuallyPresent( this.page, marketingSelectSelector, {
			timeout: 10000,
		} );
		if ( ! isConnectedAlready ) {
			await this.connectMailchimp();
		}

		// WPCOM Connections page
		await this.page.waitForXPath( mcOptionXpathSelector );

		const optionHandle = ( await this.page.$x( mcOptionXpathSelector ) )[ 0 ];
		const optionValue = await ( await optionHandle.getProperty( 'value' ) ).jsonValue();
		await this.page.select( marketingSelectSelector, optionValue );

		await this.page.waitForXPath( successNoticeSelector );
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

		await waitAndType( mcPopupPage, mcUsernameSelector, mcLogin );
		await waitAndType( mcPopupPage, mcPasswordSelector, mcPassword );
		await waitAndClick( mcPopupPage, mcSubmitSelector );
	}
}
