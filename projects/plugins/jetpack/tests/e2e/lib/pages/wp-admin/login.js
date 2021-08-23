/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';
import { takeScreenshot } from '../../reporters/screenshot';
import PageActions from '../page-actions';
import { getSiteCredentials } from '../../utils-helper';

export default class WPLoginPage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/wp-login.php`;
		super( page, { expectedSelectors: [ '.login' ], url } );
	}

	static async isLoggedIn( page ) {
		return ! ( await new PageActions( page ).isElementVisible( '#user_login' ) );
	}

	async login( credentials = getSiteCredentials(), { retry = true } = {} ) {
		logger.step( 'Log in to wp-admin' );

		await this.fill( '#user_login', credentials.username );
		await this.fill( '#user_pass', credentials.password );

		const navigationPromise = this.waitForDomContentLoaded();
		await this.click( '#wp-submit' );
		await navigationPromise;

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
