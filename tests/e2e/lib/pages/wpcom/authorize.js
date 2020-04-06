/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector, waitAndClick } from '../../page-helper';
import { sendMessageToSlack } from '../../reporters/slack';

export default class AuthorizePage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__logged-in-form';
		super( page, { expectedSelector } );
	}

	async approve( repeat = true ) {
		const authorizeButtonSelector = '.jetpack-connect__authorize-form button';
		await waitAndClick( this.page, authorizeButtonSelector );
		try {
			return await this.waitToDisappear();
		} catch ( error ) {
			if ( repeat ) {
				const message = 'Jetpack connection failed. Retrying once again.';
				console.log( message );
				await sendMessageToSlack( 'Jetpack connection failed. Retrying once again.' );

				return await this.approve( false );
			}
			throw error;
		}
	}

	async waitToDisappear() {
		await waitForSelector( this.page, '.jetpack-connect__logged-in-form-loading', {
			hidden: true,
		} );

		return await waitForSelector( this.page, this.expectedSelector, {
			hidden: true,
		} );
	}
}
