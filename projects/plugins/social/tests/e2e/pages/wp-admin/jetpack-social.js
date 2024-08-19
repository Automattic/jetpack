import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.js';
import logger from 'jetpack-e2e-commons/logger.js';
import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';

export default class JetpackSocialPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack-social';
		super( page, { expectedSelectors: [], url } );
	}

	async getStarted() {
		logger.step( 'Connect Jetpack Social to wordpress.com' );
		await this.click( 'button >> text=Get Started' );
		await this.waitForElementToBeHidden( 'button > svg.components-spinner', 40000 );
	}

	async startForFree() {
		logger.step( 'Selecting free plan' );
		await this.click( 'text=Start for free' );
	}

	async getSocial() {
		logger.step( 'Selecting Social premium plan' );
		await this.click( 'text=Get Social' );
	}

	/**
	 * Checks it connection to WordPress.com is made
	 * @returns {boolean} If connected.
	 */
	async isConnected() {
		logger.step( 'Check if Jetpack Social is connected' );
		return (
			( await this.isElementVisible( 'text=Connect accounts' ) ) &&
			( await this.isElementVisible( 'text=Write a post' ) )
		);
	}
}
