/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector, waitAndClick } from '../../page-helper';
import { sendMessageToSlack } from '../../reporters/slack';
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
				waitAndClick( this.page, authorizeButtonSelector ),
				this.waitToDisappear(),
				this.page.waitForNavigation( { waitUntil: 'networkidle2', timeout: 50000 } ),
			] );
		} catch ( error ) {
			if ( repeat ) {
				const message = 'Jetpack connection failed. Retrying once again.';
				logger.info( message );
				await sendMessageToSlack( message );

				return await this.approve( false );
			}
			throw error;
		}
	}

	async waitToDisappear() {
		await waitForSelector( this.page, '.jetpack-connect__logged-in-form-loading', {
			hidden: true,
		} );

		return await waitForSelector( this.page, '.jetpack-connect__authorize-form button', {
			hidden: true,
		} );
	}
}
