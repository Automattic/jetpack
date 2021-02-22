/**
 * Internal dependencies
 */
import Page from '../page';

export default class Sidebar extends Page {
	constructor( page ) {
		const expectedSelector = '#adminmenuwrap';
		super( page, { expectedSelector } );
	}

	async selectJetpack() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector =
			'#toplevel_page_jetpack a[href$="jetpack#/dashboard"], #toplevel_page_jetpack a[href$="jetpack"]';

		return await this._selectMenuItem( jetpackMenuSelector, menuItemSelector );
	}

	async selectNewPost() {
		const postsSelector = '#menu-posts';
		const itemSelector = '#menu-posts a[href*="post-new"]';

		return await this._selectMenuItem( postsSelector, itemSelector );
	}

	async selectInstalledPlugins() {
		const pluginsSelector = '#menu-plugins';
		const itemSelector = '#menu-plugins a[href*="plugins.php"]';

		return await this._selectMenuItem( pluginsSelector, itemSelector );
	}

	async selectDashboard() {
		const mainSelector = '#menu-dashboard';
		const itemSelector = '#menu-dashboard a[href*="index.php"]';

		return await this._selectMenuItem( mainSelector, itemSelector );
	}

	async _selectMenuItem( menuSelector, menuItemSelector ) {
		const menuElement = await this.page.waitForSelector( menuSelector );
		const classes = await page.$eval( menuSelector, e => e.getAttribute( 'class' ) );

		if ( ! classes.includes( 'wp-menu-open' ) && ! classes.includes( 'wp-has-current-submenu' ) ) {
			await menuElement.click();
		}

		return await page.click( menuItemSelector );
	}
}
