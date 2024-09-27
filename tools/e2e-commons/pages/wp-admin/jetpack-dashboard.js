import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import logger from '../../logger.js';
import WpPage from '../wp-page.js';

export default class JetpackDashboardPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack#/dashboard';
		super( page, { expectedSelectors: [ '#jp-plugin-container', '.jp-at-a-glance' ], url } );
	}

	#connectionInfoContainerSel = '.jp-connection-settings__info';

	/**
	 * Determine if the site is connected to WordPress.com,
	 * based on the visibility of a connection card element and the text in this element
	 * Should be used to assert a site is connected.
	 *
	 * @return {boolean} If the site is connected.
	 */
	async isSiteConnected() {
		logger.step( 'Checking that site is connected' );
		const selector = `${ this.#connectionInfoContainerSel } >> nth=0`;
		return ( await this.page.locator( selector ).innerText() ).includes(
			'Your site is connected to WordPress.com'
		);
	}

	/**
	 * Determine if a WordPress.com is connected or not,
	 * based on the visibility of a second connection card element and the text in this element
	 * Should be used to assert a user is connected to WordPress.com. To check a user is not connected, see isUserNotConnected()
	 *
	 * @return {boolean} If a user is connected.
	 */
	async isUserConnected() {
		logger.step( 'Checking that WordPress.com user is connected' );
		const selector = `${ this.#connectionInfoContainerSel } >> nth=1`;
		return ( await this.page.locator( selector ).innerText() ).includes( 'Connected as' );
	}

	/**
	 * Determine if a WordPress.com is connected or not,
	 * based on the visibility of a second connection card element and the text in this element
	 * Should be used to assert a user is NOT connected to WordPress.com. To check a user is connected, see isUserConnected()
	 *
	 * @return {boolean} If a user is not connected.
	 */
	async isNotUserConnected() {
		logger.step( 'Checking that WordPress.com user is not connected' );
		const selector = `${ this.#connectionInfoContainerSel } >> nth=1`;
		return ( await this.page.locator( selector ).innerText() ).includes(
			'Get the most out of Jetpack by connect your WordPress.com account'
		);
	}
}
