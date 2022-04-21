import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class JetpackDashboardPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack#/dashboard';
		super( page, { expectedSelectors: [ '#jp-plugin-container', '.jp-at-a-glance' ], url } );
	}

	async isConnected() {
		logger.step( 'Checking if Jetpack is connected' );
		await this.waitForNetworkIdle();
		const connectionInfo = '.jp-connection-settings__info';
		return await this.isElementVisible( connectionInfo );
	}
}
