/**
 * External dependencies
 */
import getRedirectUrl from '../../../../../_inc/client/lib/jp-redirect';

/**
 * Internal dependencies
 */
import Page from '../page';
import { getAccountCredentials, isEventuallyVisible } from '../../page-helper';
import logger from '../../logger';

export default class LoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.wp-login__container';
		const url = getRedirectUrl( 'wpcom-log-in' );
		super( page, { expectedSelector, url, explicitWaitMS: 45000 } );
	}

	async login( wpcomUser, { retry = true } = {} ) {
		const [ username, password ] = getAccountCredentials( wpcomUser );

		const usernameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';
		const continueButtonSelector = '//button[text()="Continue"]';
		const submitButtonSelector = '//button[text()="Log In"]';

		await page.type( usernameSelector, username );
		await page.click( continueButtonSelector );
		await page.waitForSelector( passwordSelector, { state: 'visible', timeout: 30 } );
		// Even if we wait for the field to become visible Playwright might still type the password too fast
		// and the first characters will miss the password field. A short wait fixes this
		await page.waitForTimeout( 2000 );
		await page.type( passwordSelector, password );
		await page.click( submitButtonSelector );

		await this.page.waitForNavigation( { waitUntil: 'domcontentloaded' } );

		try {
			await this.page.waitForSelector( this.expectedSelector, {
				state: 'hidden',
				timeout: 30000 /* 30 seconds */,
			} );
		} catch ( e ) {
			if ( retry === true ) {
				logger.info( `The login didn't work as expected - retrying now: '${ e }'` );
				return await this.login( wpcomUser, { retry: false } );
			}
			throw e;
		}
	}

	async isLoggedIn() {
		const continueAsUserSelector = '#content .continue-as-user';
		return isEventuallyVisible( this.page, continueAsUserSelector, 2000 );
	}
}
