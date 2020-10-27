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
import logger from '../../logger';

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

		// sometimes it failing to type the whole password correctly for the first time.
		let count = 0;
		while ( count < 5 ) {
			await waitAndType( this.page, passwordSelector, password, { delay: 10 } );
			const passwordEl = await this.page.$( passwordSelector );
			await page.focus( submitButtonSelector );

			const fieldValue = await page.evaluate( x => x.value, passwordEl );
			if ( fieldValue === password ) {
				break;
			}
			logger.info( `Failed to type password properly. retrying...` );

			count += 1;
		}

		const submitButton = await waitForSelector( this.page, submitButtonSelector );
		await submitButton.press( 'Enter' );

		try {
			await waitForSelector( this.page, this.expectedSelector, {
				hidden: true,
				timeout: 30000 /* 30 seconds */,
			} );
		} catch ( e ) {
			if ( retry === true ) {
				logger.info( `The login didn't work as expected - retrying now: '${ e }'` );
				return await this.login( wpcomUser, { retry: false } );
			}
			throw e;
		}

		await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}

	async isLoggedIn() {
		const continueAsUserSelector = '#content .continue-as-user';
		return await isEventuallyVisible( this.page, continueAsUserSelector, 2000 );
	}
}
