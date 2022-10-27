import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import logger from 'jetpack-e2e-commons/logger.cjs';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export default class JetpackSocialPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack-social';
		super( page, { expectedSelectors: [ '#jetpack-social-root' ], url } );
	}

	/**
	 * Determine if the site is connected to WordPress.com,
	 * based on the visibility of a connection card element and the text in this element
	 * Should be used to assert a site is connected.
	 */
	async getStarted() {
		logger.step( 'Connect Jetpack Social' );
		//todo add connection steps
	}

	async isConnected() {
		logger.step( 'Check if Jetpack Social is connected' );
		//todo add check
		return true;
	}
}
