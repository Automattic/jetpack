/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitAndType } from '../../page-helper';
import { WP_USERNAME, WP_PASSWORD } from '../../setup';

export default class WPLoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.login';
		const url = createURL( 'wp-login.php' );
		super( page, { expectedSelector, url } );
	}

	async login( username = WP_USERNAME, password = WP_PASSWORD ) {
		const ssoLoginButton = '.jetpack-sso.button';
		if ( ( await this.page.$( ssoLoginButton ) ) !== null ) {
			await this.toggleSSOLogin();
		}

		await waitAndType( this.page, '#user_login', username );
		await waitAndType( this.page, '#user_pass', password );

		// await Promise.all( [ this.page.waitForNavigation(), this.page.click( '#wp-submit' ) ] );
		return await this.page.click( '#wp-submit' );
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
