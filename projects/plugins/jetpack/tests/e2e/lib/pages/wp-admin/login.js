/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitAndType, waitForSelector } from '../../page-helper';
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

		await waitAndType( this.page, '#user_login', username );
		await waitAndType( this.page, '#user_pass', password );

		const navigationPromise = this.page.waitForNavigation();
		await waitAndClick( this.page, '#wp-submit' );
		await navigationPromise;

		try {
			await waitForSelector( this.page, this.expectedSelector, {
				hidden: true,
			} );
		} catch ( e ) {
			if ( retry === true ) {
				logger.info( `The WPORG login didn't work as expected - retrying now: '${ e }'` );

				const filePath = await takeScreenshot( 'WPORG-login-failed' );
				logger.slack( { type: 'file', message: filePath } );
				return await this.login( username, password, { retry: false } );
			}
			throw e;
		}
	}

	async loginSSO() {
		const ssoLoginButton = '.jetpack-sso.button';
		return await waitAndClick( this.page, ssoLoginButton );
	}

	async toggleSSOLogin() {
		const ssoToggleButton = '.jetpack-sso-toggle';
		return await waitAndClick( this.page, ssoToggleButton );
	}
}
