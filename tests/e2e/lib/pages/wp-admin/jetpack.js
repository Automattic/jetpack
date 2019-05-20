/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitForSelector } from '../../pageHelper';

export default class JetpackPage extends Page {
	constructor( page ) {
		const expectedSelector = '#jp-plugin-container';
		super( page, { expectedSelector } );
	}

	async connect() {
		const connectButtonSelector = '.jp-connect-full__button-container a';
		await waitAndClick( this.page, connectButtonSelector );
		return await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}

	async jumpstartDisplayed() {
		return !! ( await waitForSelector( this.page, '.jp-jumpstart' ) );
	}
}
