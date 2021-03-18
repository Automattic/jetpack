/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';
import config from 'config';
import { takeScreenshot } from '../../reporters/screenshot';

export default class WPLoginPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.login' ] } );
	}

	async login(
		username = config.WP_ADMIN_USER.username,
		password = config.WP_ADMIN_USER.password,
		{ retry = true } = {}
	) {
		logger.step( 'Log in to wp-admin' );
		const ssoLoginButton = '.jetpack-sso.button';
		if ( ( await this.page.$( ssoLoginButton ) ) !== null ) {
			await this.toggleSSOLogin();
		}

		await this.fill( '#user_login', username );
		await this.fill( '#user_pass', password );

		const navigationPromise = this.waitForLoad();
		await this.click( '#wp-submit' );
		await navigationPromise;

		try {
			await this.waitForElementToBeHidden( this.selectors[ 0 ] );
		} catch ( e ) {
			if ( retry === true ) {
				logger.warn( `The WPORG login didn't work as expected - retrying now: '${ e }'` );
				await takeScreenshot( this.page, 'WPORG-login-failed', true );

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
