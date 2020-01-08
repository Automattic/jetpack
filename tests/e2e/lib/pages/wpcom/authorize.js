/**
 * External dependencies
 */
import { waitForSelector, waitAndClick, Page } from 'puppeteer-utils';

export default class AuthorizePage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__logged-in-form';
		super( page, { expectedSelector } );
	}

	async approve() {
		const authorizeButtonSelector = '.jetpack-connect__authorize-form button';
		await waitAndClick( this.page, authorizeButtonSelector );
		return await this.waitToDisappear();
	}

	async waitToDisappear() {
		return await waitForSelector( this.page, '.jetpack-connect__logged-in-form-loading', {
			hidden: true,
		} );
	}
}
