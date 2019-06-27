/**
 * Internal dependencies
 */
import { waitAndClick, waitForSelector, clickAndWaitForNewPage } from '../page-helper';
import LoginPage from '../pages/wpcom/login';
import ConnectionsPage from '../pages/wpcom/connections';

export default class MailchimpBlock {
	constructor( block, page ) {
		this.blockName = MailchimpBlock.name();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
	}

	static name() {
		return 'Mailchimp';
	}

	/**
	 * Sets-up a mailchimp connection. Method expects to see a "Set up Mailchimp from" button in block editor.
	 * - Starts by logging in to WPCOM account in page opened in new tab
	 * - Connects to Mailchimp once Connection page is loaded
	 * - Closes WPCOM tab
	 *
	 * @param {boolean} isLoggedIn Whether we need to login before connecting
	 *
	 */
	async connect( isLoggedIn = true ) {
		const setupFormSelector = this.getSelector( "a[href*='marketing/connections']" );
		const loginTab = await clickAndWaitForNewPage( this.page, setupFormSelector );

		if ( ! isLoggedIn ) {
			await ( await LoginPage.init( loginTab ) ).login( 'defaultUser' );
		}
		await ( await ConnectionsPage.init( loginTab ) ).connectMailchimp();

		const reCheckSelector = this.getSelector( 'button.is-link' );
		await waitAndClick( this.page, reCheckSelector );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 * @param {Page} page Puppeteer page instance
	 */
	static async isRendered( page ) {
		const containerSelector = '.wp-block-jetpack-mailchimp';
		const emailSelector = containerSelector + " input[type='email']";
		const submitSelector = containerSelector + " button[type='submit']";
		const consentSelector = containerSelector + ' #wp-block-jetpack-mailchimp_consent-text';

		await waitForSelector( page, containerSelector );
		await waitForSelector( page, emailSelector );
		await waitForSelector( page, submitSelector );
		await waitForSelector( page, consentSelector );
	}
}
