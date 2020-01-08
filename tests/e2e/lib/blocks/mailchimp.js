/**
 * External dependencies
 */
import { waitAndClick, waitForSelector, clickAndWaitForNewPage } from 'puppeteer-utils';
/**
 * Internal dependencies
 */
import LoginPage from '../pages/wpcom/login';
import ConnectionsPage from '../pages/wpcom/connections';

export default class MailchimpBlock {
	constructor( block, page ) {
		this.blockTitle = MailchimpBlock.title();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
	}

	static name() {
		return 'mailchimp';
	}

	static title() {
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
		const connectionsUrl = await ( await ( await waitForSelector(
			this.page,
			setupFormSelector
		) ).getProperty( 'href' ) ).jsonValue();
		const loginTab = await clickAndWaitForNewPage( this.page, setupFormSelector );
		global.page = loginTab;

		if ( ! isLoggedIn ) {
			await ( await LoginPage.init( loginTab ) ).login( 'defaultUser' );
		}

		// Hacky way to force-sync Publicize activation. The first attempt is always get redirected to stats page.
		// TODO:
		// explore a better way to sync the site. Maybe enable all the required modules as part of connection flow
		// Or implement a way to trigger a sync manually.
		let loaded = false;
		let count = 0;
		while ( ! loaded ) {
			try {
				count++;
				await ConnectionsPage.init( loginTab );
				loaded = true;
			} catch ( e ) {
				console.log(
					'ConnectionsPage is not available yet. Attempt: ' + count,
					' URL: ' + connectionsUrl
				);
				await loginTab.goto( connectionsUrl, { timeout: 120000 } );
				if ( count > 9 ) {
					throw new Error( 'ConnectionsPage is not available is not available after 10th attempt' );
				}
			}
		}

		await ( await ConnectionsPage.init( loginTab ) ).selectMailchimpList();

		global.page = this.page;
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
