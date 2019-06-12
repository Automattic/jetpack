/**
 * Internal dependencies
 */
import Page from '../page';
import { waitForSelector, waitAndClick } from '../../page-helper';

export default class Sidebar extends Page {
	constructor( page ) {
		const expectedSelector = '#adminmenumain';
		super( page, { expectedSelector } );
	}

	async selectJetpack() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector =
			'#toplevel_page_jetpack a[href$="jetpack#/dashboard"], #toplevel_page_jetpack a[href$="jetpack"]';

		return await Promise.all( [
			this.page.waitForNavigation( { waitFor: 'networkidle2' } ),
			this._selectMenuItem( jetpackMenuSelector, menuItemSelector ),
		] );
	}

	async _selectMenuItem( menuSelector, menuItemSelector ) {
		const menuElement = await waitForSelector( this.page, menuSelector );
		const classes = await page.$eval( menuSelector, e => e.getAttribute( 'class' ) );

		if ( ! classes.includes( 'wp-menu-open' ) && ! classes.includes( 'wp-has-current-submenu' ) ) {
			await menuElement.click();
		}

		return await waitAndClick( this.page, menuItemSelector );
	}
}
