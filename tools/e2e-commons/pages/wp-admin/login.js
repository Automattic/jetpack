import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { takeScreenshot } from '../../reporters/index.js';
import { getSiteCredentials, resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class WPLoginPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-login.php`;
		super( page, { expectedSelectors: [ '#loginform' ], url } );
	}

	async login( credentials = getSiteCredentials(), { retry = true } = {} ) {
		logger.step( 'Log in to wp-admin' );

		await this.fill( '#user_login', credentials.username );
		await this.fill( '#user_pass', credentials.password );
		await this.click( '#wp-submit' );
		await this.waitForDomContentLoaded();

		try {
			await this.waitForElementToBeHidden( this.selectors[ 0 ] );
		} catch ( e ) {
			if ( retry === true ) {
				logger.warn( `The WPORG login didn't work as expected - retrying now: '${ e }'` );
				await takeScreenshot( this.page, 'WPORG-login-failed' );

				return await this.login( credentials, { retry: false } );
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
