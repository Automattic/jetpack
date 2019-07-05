/**
 * Internal dependencies
 */
import Page from '../page';
import {
	waitForSelector,
	getAccountCredentials,
	waitAndClick,
	waitAndType,
} from '../../page-helper';

export default class LoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.wp-login__container';
		super( page, { expectedSelector } );
		this.explicitWaitMS = 45000;
	}

	async login( wpcomUser ) {
		const [ username, password ] = getAccountCredentials( wpcomUser );

		const usernameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';
		const continueButtonSelector = '.login__form-action button';
		const submitButtonSelector = '.login__form-action button[type="submit"]';

		await waitAndType( this.page, usernameSelector, username );
		await waitAndClick( this.page, continueButtonSelector );

		await waitAndType( this.page, passwordSelector, password );
		await waitAndClick( this.page, submitButtonSelector );

		await waitForSelector( this.page, passwordSelector, { hidden: true, timeout: 60000 } );
		await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}
}
