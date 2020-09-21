/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitAndType, waitForSelector } from '../../page-helper';
import { WP_USERNAME, WP_PASSWORD } from '../../setup';
import logger from '../../logger';

export default class WPLoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.login';
		const url = createURL( 'wp-login.php' );
		super( page, { expectedSelector, url } );
	}

	async login( username = WP_USERNAME, password = WP_PASSWORD, { retry = true } = {} ) {
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
