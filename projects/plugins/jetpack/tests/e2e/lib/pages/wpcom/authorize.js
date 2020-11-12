/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector } from '../../page-helper';
import logger from '../../logger';

export default class AuthorizePage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__logged-in-form';
		super( page, { expectedSelector } );
	}

	async approve( repeat = true ) {
		const authorizeButtonSelector = '.jetpack-connect__authorize-form button';
		try {
			return await Promise.all( [
				page.click( authorizeButtonSelector ),
				this.waitToDisappear(),
				this.page.waitForNavigation( { waitUntil: 'networkidle', timeout: 50000 } ),
			] );
		} catch ( error ) {
			if ( repeat ) {
				const message = 'Jetpack connection failed. Retrying once again.';
				logger.info( message );
				logger.slack( { message, type: 'message' } );

				return await this.approve( false );
			}
			throw error;
		}
	}

	async waitToDisappear() {
		await waitForSelector( this.page, '.jetpack-connect__logged-in-form-loading', {
			state: 'hidden',
		} );

		return await waitForSelector( this.page, '.jetpack-connect__authorize-form button', {
			state: 'hidden',
		} );
	}
}
