/**
 * Internal dependencies
 */
import Page from '../page';
import logger from '../../logger';
import { takeScreenshot } from '../../reporters/screenshot';

export default class WPLoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.login';
		super( page, { expectedSelector } );
	}

	async login( username = 'admin', password = 'password', { retry = true } = {} ) {
		const ssoLoginButton = '.jetpack-sso.button';
		if ( ( await this.page.$( ssoLoginButton ) ) !== null ) {
			await this.toggleSSOLogin();
		}

		await page.type( '#user_login', username );
		await page.type( '#user_pass', password );

		const navigationPromise = this.page.waitForNavigation();
		await page.click( '#wp-submit' );
		await navigationPromise;

		try {
			await this.page.waitForSelector( this.expectedSelector, {
				state: 'hidden',
			} );
		} catch ( e ) {
			if ( retry === true ) {
				logger.info( `The WPORG login didn't work as expected - retrying now: '${ e }'` );

				try {
					const filePath = await takeScreenshot( 'WPORG-login-failed' );
					logger.slack( { type: 'file', message: filePath } );
				} catch ( err ) {
					logger.error( 'There was an error taking a screenshot!' );
				}

				return await this.login( username, password, { retry: false } );
			}
			throw e;
		}
	}

	async loginSSO() {
		const ssoLoginButton = '.jetpack-sso.button';
		return await this.page.click( ssoLoginButton );
	}

	async toggleSSOLogin() {
		const ssoToggleButton = '.jetpack-sso-toggle';
		return await this.page.click( ssoToggleButton );
	}
}
