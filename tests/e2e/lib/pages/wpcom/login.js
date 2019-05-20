/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector } from '../../pageHelper';

export default class LoginPage extends Page {
	constructor( page ) {
		const expectedSelector = '.wp-login__container';
		super( page, { expectedSelector } );
	}

	async login( username, password ) {
		const userNameSelector = '#usernameOrEmail';
		const passwordSelector = '#password';

		const userNameInput = await this.page.waitForSelector( userNameSelector, { visible: true } );
		await userNameInput.click( { clickCount: 3 } );
		await userNameInput.type( username );
		await ( await this.page.waitForSelector( '.login__form-action button' ) ).click();

		const passwordInput = await waitForSelector( this.page, passwordSelector, { visible: true } );
		await passwordInput.click( { clickCount: 3 } );
		await passwordInput.type( password );

		await ( await this.page.waitForSelector(
			'.login__form-action button[type="submit"]'
		) ).click();

		await waitForSelector( this.page, passwordSelector, { hidden: true, timeout: 60000 } );
		await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}
}
