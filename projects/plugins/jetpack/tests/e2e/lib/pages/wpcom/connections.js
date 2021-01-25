/**
 * Internal dependencies
 */
import Page from '../page';
import {
	waitAndClick,
	waitAndType,
	clickAndWaitForNewPage,
	getAccountCredentials,
	waitForSelector,
} from '../../page-helper';

export default class ConnectionsPage extends Page {
	constructor( page ) {
		const expectedSelector = '.connections__sharing-connections';
		super( page, { expectedSelector, explicitWaitMS: 40000 } );
	}

	async selectMailchimpList( mailchimpList = 'e2etesting' ) {
		const loadingIndicatorSelector = '.foldable-card__summary button:not([disabled])';
		const mailchimpExpandSelector = '.mailchimp .foldable-card__expand svg[height="24"]';
		const marketingSelectSelector = '.mailchimp select';
		const mcOptionXpathSelector = `//option[contains(text(), '${ mailchimpList }')]`;
		const successNoticeSelector = `//span[contains(text(), '${ mailchimpList }')]`;

		await waitForSelector( this.page, loadingIndicatorSelector );
		await waitAndClick( this.page, mailchimpExpandSelector );

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
		await this.page.bringToFront();
	}
}
