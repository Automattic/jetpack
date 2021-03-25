/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';
import config from 'config';
import { takeScreenshot } from '../../reporters/screenshot';
import PageActions from '../page-actions';

export default class WPLoginPage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/wp-login.php`;
		super( page, { expectedSelectors: [ '.login' ], url } );
	}

	static async isLoggedIn( page ) {
		return ! ( await new PageActions( page ).isElementVisible( '#user_login' ) );
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

		const navigationPromise = this.waitForDomContentLoaded();
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
		logger.step( 'Login SSO' );
		const ssoLoginButton = '.jetpack-sso.button';
		return await this.click( ssoLoginButton );
	}

	async toggleSSOLogin() {
		logger.step( 'Toggle SSO login' );
		const ssoToggleButton = '.jetpack-sso-toggle';
		return await this.click( ssoToggleButton );
	}
}
