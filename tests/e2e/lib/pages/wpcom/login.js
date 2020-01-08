/**
 * External dependencies
 */
import {
	waitForSelector,
	getAccountCredentials,
	waitAndClick,
	waitAndType,
	isEventuallyVisible,
	Page,
} from 'puppeteer-utils';

export default class LoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.wp-login__container';
		const url = 'https://wordpress.com/log-in';
		super( page, { expectedSelector, url, explicitWaitMS: 45000 } );
	}

	async login( wpcomUser ) {
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

		await waitAndType( this.page, passwordSelector, password );
		await waitAndClick( this.page, submitButtonSelector );

		// NOTE: here we waiting for the redirect. For some reason it might take quite some time
		await waitForSelector( this.page, passwordSelector, { hidden: true, timeout: 90000 } );
		await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}

	async isLoggedIn() {
		const publishSelector = '#header .masterbar__publish';
		return await isEventuallyVisible( this.page, publishSelector, 4000 );
	}
}
