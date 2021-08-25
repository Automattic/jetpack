import LoginPage from '../../wpcom/login';
import ConnectionsPage from '../../wpcom/connections';
import logger from '../../../logger';
import PageActions from '../../page-actions';
import axios from 'axios';

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

	//region selectors

	get setupFormBtnSel() {
		return `${ this.blockSelector } a[href*='calypso-marketing-connections']`;
	}

	get recheckConnectionLnkSel() {
		return `${ this.blockSelector } button.is-link`;
	}

	get joinBtnSel() {
		return `${ this.blockSelector } div >> text="Join my Mailchimp audience"`;
	}

	//endregion

	/**
	 * Sets-up a mailchimp connection. Method expects to see a "Set up Mailchimp from" button in block editor.
	 * - Starts by logging in to WPCOM account in page opened in new tab
	 * - Connects to Mailchimp once Connection page is loaded
	 * - Closes WPCOM tab
	 *
	 * @param {boolean} isLoggedIn Whether we need to login before connecting
	 */
	async connect( isLoggedIn = true ) {
		if ( await this.isMailchimpConnected() ) {
			logger.info( `Mailchimp seems to be already connected` );
		} else {
			logger.step( `Connecting Mailchimp` );

			const formSelector = await this.waitForElementToBeVisible( this.setupFormBtnSel );
			const hrefProperty = await formSelector.getProperty( 'href' );
			const connectionsUrl = await hrefProperty.jsonValue();
			const wpComTab = await this.clickAndWaitForNewPage( this.setupFormBtnSel );

			if ( ! isLoggedIn ) {
				await ( await LoginPage.init( wpComTab ) ).login( 'defaultUser' );
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
					const connections = await ConnectionsPage.init( wpComTab );
					if ( ! ( await connections.isEnabled() ) ) {
						throw 'Publicise not enabled/synced';
					}

					loaded = true;
				} catch ( e ) {
					logger.warn(
						'ConnectionsPage is not available yet. Attempt: ' + count,
						' URL: ' + connectionsUrl
					);
					await wpComTab.goto( connectionsUrl );
					if ( count > 2 ) {
						throw new Error( 'ConnectionsPage is not available after 3rd attempt' );
					}
				}
			}

			await wpComTab.reload( { waitUntil: 'domcontentloaded' } );

			const wpComConnectionsPage = await ConnectionsPage.init( wpComTab );
			await wpComConnectionsPage.selectMailchimpList();

			await this.page.bringToFront();
			await this.click( this.recheckConnectionLnkSel );
		}

		await this.waitForElementToBeVisible( this.joinBtnSel );
	}

	/**
	 * Determine if Mailchimp account is already set up
	 * Calls rest_route=/wpcom/v2/mailchimp and checks response for connected status
	 * "code":"connected" => Mailchimp was connected
	 *
	 * @return {Promise<boolean>} true is connected, false if not_connected status code is found or call fails for any reason
	 */
	async isMailchimpConnected() {
		let connectionStatus = '';
		try {
			const url = `${ siteUrl }/index.php?rest_route=/wpcom/v2/mailchimp&_locale=user`;
			const res = await axios.get( url );
			logger.debug( JSON.stringify( res.data ) );
			connectionStatus = res.data.code;
		} catch ( error ) {
			logger.error( error.message );
		}

		logger.debug( `Mailchimp connection status: ${ connectionStatus }` );
		return connectionStatus === 'connected';
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
