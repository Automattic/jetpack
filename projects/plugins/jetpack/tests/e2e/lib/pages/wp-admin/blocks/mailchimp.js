import LoginPage from '../../wpcom/login';
import ConnectionsPage from '../../wpcom/connections';
import logger from '../../../logger';
import PageActions from '../../page-actions';

export default class MailchimpBlock extends PageActions {
	constructor( blockId, page ) {
		super( page, 'Mailchimp block' );
		this.blockTitle = MailchimpBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
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
		const setupFormSelector = this.getSelector( "a[href*='calypso-marketing-connections']" );
		const formSelector = await this.waitForElementToBeVisible( setupFormSelector );
		const hrefProperty = await formSelector.getProperty( 'href' );
		const connectionsUrl = await hrefProperty.jsonValue();

		// Hacky way to force-sync Publicize activation. The first attempt is always get redirected to stats page.
		// TODO:
		// explore a better way to sync the site. Maybe enable all the required modules as part of connection flow
		// Or implement a way to trigger a sync manually.
		let count = 0;
		let wpComTab;
		while ( count <= 3 ) {
			try {
				count++;

				wpComTab = await this.clickAndWaitForNewPage( setupFormSelector );

				if ( ! isLoggedIn ) {
					await ( await LoginPage.init( wpComTab ) ).login( 'defaultUser' );
				}

				await wpComTab.reload( { waitUntil: 'domcontentloaded' } );

				const wpComConnectionsPage = await ConnectionsPage.init( wpComTab );
				await wpComConnectionsPage.selectMailchimpList();
				await wpComTab.close();
				await this.page.bringToFront();
				const reCheckSelector = this.getSelector( 'button.is-link' );
				return await this.click( reCheckSelector );
			} catch ( e ) {
				logger.warn(
					'ConnectionsPage is not available yet. Attempt: ' + count + ' URL: ' + connectionsUrl
				);
				const url = `https://wordpress.com/marketing/connections/${ new URL( siteUrl ).host }`;
				await wpComTab.close();
				await this.page.bringToFront();
				// await wpComTab.goto( url );
			}
		}

		throw new Error( 'ConnectionsPage is not available after 5th attempt' );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		const containerSelector = '.wp-block-jetpack-mailchimp';
		const emailSelector = containerSelector + " input[type='email']";
		const submitSelector = containerSelector + " button[type='submit']";
		const consentSelector = containerSelector + ' #wp-block-jetpack-mailchimp_consent-text';

		await page.waitForSelector( containerSelector );
		await page.waitForSelector( emailSelector );
		await page.waitForSelector( submitSelector );
		await page.waitForSelector( consentSelector );
	}
}
