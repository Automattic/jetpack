/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';
import { takeScreenshot } from '../../reporters/screenshot';

export default class WPLoginPage extends WpPage {
	constructor( page ) {
		const expectedSelector = '.login';
		super( page, 'Login page', { expectedSelector } );
	}

	async login( username = 'admin', password = 'password', { retry = true } = {} ) {
		logger.step( 'Log in to wp-admin' );
		const ssoLoginButton = '.jetpack-sso.button';
		if ( ( await this.page.$( ssoLoginButton ) ) !== null ) {
			await this.toggleSSOLogin();
		}

		await this.type( '#user_login', username );
		await this.type( '#user_pass', password );

		const navigationPromise = this.page.waitForNavigation();
		await this.click( '#wp-submit' );
		await navigationPromise;

		try {
			await this.waitForElementToBeHidden( this.expectedSelector );
		} catch ( e ) {
			if ( retry === true ) {
				logger.warn( `The WPORG login didn't work as expected - retrying now: '${ e }'` );

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

		// save storage state to reuse later to skip log in
		await this.saveCurrentStorageState();
	}

	async loginSSO() {
		const ssoLoginButton = '.jetpack-sso.button';
		return await this.click( ssoLoginButton );
	}

	async toggleSSOLogin() {
		const ssoToggleButton = '.jetpack-sso-toggle';
		return await this.click( ssoToggleButton );
	}
}
