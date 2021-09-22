import WpPage from '../wp-page';
import logger from '../../logger';

export default class AuthorizePage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.jetpack-connect__logged-in-form' ] } );
	}

	async approve( repeat = true ) {
		const authorizeButtonSelector = '.jetpack-connect__authorize-form button';
		try {
			return await Promise.all( [
				this.click( authorizeButtonSelector ),
				this.waitToDisappear(),
				this.waitForDomContentLoaded( 50000 ),
			] );
		} catch ( error ) {
			if ( repeat ) {
				const message = 'Jetpack connection failed. Retrying once again.';
				logger.error( message );
				return await this.approve( false );
			}
			throw error;
		}
	}

	async waitToDisappear() {
		await this.waitForElementToBeHidden( '.jetpack-connect__logged-in-form-loading' );
		await this.waitForElementToBeHidden( '.jetpack-connect__authorize-form button' );
	}
}
