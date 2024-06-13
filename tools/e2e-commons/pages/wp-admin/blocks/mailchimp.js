import { LoginPage, ConnectionsPage } from '../../wpcom/index.js';
import logger from '../../../logger.js';
import EditorCanvas from './editor-canvas.js';
import axios from 'axios';
import { resolveSiteUrl } from '../../../helpers/utils-helper.js';

export default class MailchimpBlock extends EditorCanvas {
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

			const formSelector = this.canvas().locator( this.setupFormBtnSel );
			const hrefProperty = await formSelector.getAttribute( 'href' );
			const connectionsUrl = await hrefProperty.jsonValue();
			// const wpComTab = await this.clickAndWaitForNewPage( this.setupFormBtnSel );

			const [ wpComTab ] = await Promise.all( [
				this.page.context().waitForEvent( 'page' ),
				this.canvas().click( this.setupFormBtnSel ),
			] );

			logger.action( 'Waiting for new page' );
			await wpComTab.waitForLoadState();
			await wpComTab.bringToFront();

			// Quick fix for redirect URL not working with site ID
			const workingUrl = connectionsUrl.replace(
				/\d+/,
				resolveSiteUrl().replace( 'https://', '' )
			);
			await wpComTab.goto( workingUrl );

			if ( ! isLoggedIn ) {
				await ( await LoginPage.init( wpComTab ) ).login();
			}

			// Hacky way to make sure the Calypso knows about newly created site (aka waiting for a site to get synced)
			// TODO:
			// explore a better way to sync the site. Maybe enable all the required modules as part of connection flow
			// Or implement a way to trigger a sync manually.
			let done = false;
			let count = 0;
			while ( ! done ) {
				try {
					const wpComConnectionsPage = await ConnectionsPage.init( wpComTab );
					await wpComConnectionsPage.selectMailchimpList();
					done = true;
				} catch ( e ) {
					logger.error( e );
					if ( count > 4 ) {
						throw new Error(
							`Mailchimp connection failed after ${ count } attempts.\nLast error: ${ e }`
						);
					}
					logger.warn(
						'Mailchimp connection failed. Attempt: ' + count + '; URL: ' + connectionsUrl
					);
					count++;
					await wpComTab.goto( connectionsUrl );
				}
			}

			await this.page.bringToFront();
			await this.canvas().click( this.recheckConnectionLnkSel );
		}

		await this.canvas().locator( this.joinBtnSel ).waitFor();
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
			const url = `${ resolveSiteUrl() }/index.php?rest_route=/wpcom/v2/mailchimp&_locale=user`;
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

		await page.locator( containerSelector ).waitFor();
		await page.locator( emailSelector ).waitFor();
		await page.locator( submitSelector ).waitFor();
		await page.locator( consentSelector ).waitFor();
	}
}
