/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector } from '../../page-helper';

export default class AuthorizePage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__logged-in-form';
		super( page, { expectedSelector } );
	}

	async approve() {
		const authorizeButtonSelector = '.jetpack-connect__authorize-form button';
		await ( await waitForSelector( this.page, authorizeButtonSelector ) ).click();
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await waitForSelector( this.page, '.jetpack-connect__logged-in-form-loading', {
			hidden: true,
		} );
	}
}
