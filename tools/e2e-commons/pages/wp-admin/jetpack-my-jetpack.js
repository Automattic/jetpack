import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class MyJetpackPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=my-jetpack';
		super( page, { expectedSelectors: [ '#my-jetpack-container' ], url } );
	}

	get connectionStatusCard() {
		return '.jp-connection-status-card';
	}

	async isConnectionStatusCardDisplaying() {
		logger.step( 'Checking if Connection card is displaying' );
		return await this.isElementVisible( this.connectionStatusCard );
	}
}
