import logger from '../../logger.js';
import WpPage from '../wp-page.js';

export default class AuthorizePage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.jetpack-connect__logged-in-form' ] } );
	}

	async approve( options ) {
		const { redirectUrl, repeat = true } = options;
		const authorizeButtonSelector = '.jetpack-connect__authorize-form button';
		try {
			await this.click( authorizeButtonSelector );

			await this.page.waitForURL( redirectUrl );
		} catch ( error ) {
			if ( repeat ) {
				const message = 'Jetpack connection failed. Retrying once again.';
				logger.error( message );
				return await this.approve( { ...options, repeat: false } );
			}
			throw error;
		}
	}
}
