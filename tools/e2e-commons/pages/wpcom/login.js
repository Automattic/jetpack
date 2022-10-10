import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { getDotComCredentials } from '../../helpers/utils-helper.cjs';
import PageActions from '../page-actions.js';

export default class LoginPage extends WpPage {
	constructor( page ) {
		const url = 'https://jetpack.com/redirect/?source=wpcom-log-in';
		super( page, {
			expectedSelectors: [ '.wp-login__container' ],
			url,
		} );
	}

	static async isDisplayed( page ) {
		const pa = new PageActions( page );
		await pa.waitForDomContentLoaded();
		return await pa.isElementVisible( '#wpcom .wp-login__container', 2000 );
	}

	async login( credentials = getDotComCredentials(), { retry = true } = {} ) {
		logger.step( 'Log in to WordPress.com' );

		const usernameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';
		const continueButtonSelector = '//button[text()="Continue"]';
		const submitButtonSelector = '//button[text()="Log In"]';

		try {
			await this.fill( usernameSelector, credentials.username );
			await this.click( continueButtonSelector );
			await this.waitForElementToBeVisible( passwordSelector );
			// Even if we wait for the field to become visible Playwright might still type the password too fast
			// and the first characters will miss the password field. A short wait fixes this
			await this.waitForTimeout( 2000 );
			await this.fill( passwordSelector, credentials.password );
			await this.click( submitButtonSelector );

			await this.waitForDomContentLoaded();
			await this.waitForElementToBeHidden( this.selectors[ 0 ] );
		} catch ( e ) {
			if ( retry === true ) {
				logger.warn( `The login didn't work as expected - retrying now: '${ e }'` );
				await this.reload();
				return await this.login( credentials, { retry: false } );
			}
			throw e;
		}

		// save storage state to reuse later to skip log in
		await this.saveCurrentStorageState();
	}

	async continueWithout() {
		const continueSelector =
			'.jetpack-connect-site-only__form a.jetpack-connect-site-only__continue-link';
		await this.click( continueSelector );
		return await this.waitForElementToBeHidden( this.selectors[ 0 ] );
	}

	async isLoggedIn() {
		const continueAsUserSelector = '#content .continue-as-user';
		return this.isElementVisible( continueAsUserSelector, 2000 );
	}
}
