/**
 * External dependencies
 */
import getRedirectUrl from '../../../../../_inc/client/lib/jp-redirect';

/**
 * Internal dependencies
 */
import Page from '../page';
import {
	waitForSelector,
	getAccountCredentials,
	waitAndClick,
	waitAndType,
	isEventuallyVisible,
} from '../../page-helper';

export default class LoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.wp-login__container';
		const url = getRedirectUrl( 'wpcom-log-in' );
		super( page, { expectedSelector, url, explicitWaitMS: 45000 } );
	}

	async login( wpcomUser, { retry = true } = {} ) {
		const [ username, password ] = getAccountCredentials( wpcomUser );

		const usernameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';
		const continueButtonSelector = '.login__form-action button';
		const submitButtonSelector = '.login__form-action button[type="submit"]';

		await waitAndType( this.page, usernameSelector, username );
		await waitAndClick( this.page, continueButtonSelector );

		// sometimes it failing to type the whole password correctly. Trying to wait for the transition to happen
		this.page.waitFor( 1000 );
		await waitAndType( this.page, passwordSelector, password );
		this.page.waitFor( 1000 );

		await waitAndType( this.page, passwordSelector, password );

		const submitButton = await waitForSelector( this.page, submitButtonSelector );
		await submitButton.press( 'Enter' );

		try {
			await waitForSelector( this.page, passwordSelector, {
				hidden: true,
				timeout: 60000 /* 1 minute */,
			} );
		} catch ( e ) {
			if ( retry === true ) {
				console.log( `The login didn't work as expected - retrying now: '${ e }'` );
				return await this.login( wpcomUser, { retry: false } );
			}
			throw e;
		}

		await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}

	async isLoggedIn() {
		const continueAsUserSelector = '#content .continue-as-user';
		return await isEventuallyVisible( this.page, continueAsUserSelector, 4000 );
	}
}
