/**
 * External dependencies
 */
import getRedirectUrl from '../../../../../_inc/client/lib/jp-redirect';

/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';
import fs from 'fs';
import { getAccountCredentials } from '../../utils-helper';

export default class LoginPage extends WpPage {
	constructor( page ) {
		const expectedSelector = '.wp-login__container';
		const url = getRedirectUrl( 'wpcom-log-in' );
		super( page, '.com Login page', { expectedSelector, url, explicitWaitMS: 45000 } );
	}

	async login( wpcomUser, { retry = true } = {} ) {
		logger.step( 'Log in to Wordpress.com' );
		const [ username, password ] = getAccountCredentials( wpcomUser );

		const usernameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';
		const continueButtonSelector = '//button[text()="Continue"]';
		const submitButtonSelector = '//button[text()="Log In"]';

		try {
			await this.page.type( usernameSelector, username );
			await this.page.click( continueButtonSelector );
			await this.page.waitForSelector( passwordSelector );
			// Even if we wait for the field to become visible Playwright might still type the password too fast
			// and the first characters will miss the password field. A short wait fixes this
			await this.page.waitForTimeout( 2000 );
			await this.page.type( passwordSelector, password );
			await this.page.click( submitButtonSelector );

			await this.page.waitForNavigation( { waitUntil: 'domcontentloaded' } );
			await this.page.waitForSelector( this.expectedSelector, {
				state: 'hidden',
			} );
		} catch ( e ) {
			if ( retry === true ) {
				logger.warn( `The login didn't work as expected - retrying now: '${ e }'` );
				this.page.reload();
				return await this.login( wpcomUser, { retry: false } );
			}
			throw e;
		}

		// save storage state to reuse later to skip log in
		const storage = await context.storageState();
		fs.writeFileSync( 'config/storage.json', JSON.stringify( storage ) );
	}

	async isLoggedIn() {
		const continueAsUserSelector = '#content .continue-as-user';
		return this.page.isVisible( continueAsUserSelector, { timeout: 2000 } );
	}
}
