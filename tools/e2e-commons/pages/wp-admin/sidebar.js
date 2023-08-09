import WpPage from '../wp-page.js';

export default class Sidebar extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '#adminmenuwrap' ] } );
	}

	async selectJetpack() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector = '#toplevel_page_jetpack a[href$="admin.php?page=my-jetpack"]';

		return await this._selectMenuItem( jetpackMenuSelector, menuItemSelector );
	}

	async selectJetpackSubMenuItem() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector = '#toplevel_page_jetpack .wp-submenu a[href$="admin.php?page=jetpack"]';

		return await this._selectMenuItem( jetpackMenuSelector, menuItemSelector );
	}

	async selectJetpackBoost() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector = '#toplevel_page_jetpack a[href$="jetpack-boost"]';

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

	async selectThemes() {
		const pluginsSelector = '#menu-appearance';
		const itemSelector = '#menu-appearance a[href*="themes.php"]';

		return await this._selectMenuItem( pluginsSelector, itemSelector );
	}

	async _selectMenuItem( menuSelector, menuItemSelector ) {
		const menuElement = await this.waitForElementToBeVisible( menuSelector );
		const classes = await this.page
			.locator( menuSelector )
			.evaluate( e => e.getAttribute( 'class' ) );

		if ( ! classes.includes( 'wp-menu-open' ) && ! classes.includes( 'wp-has-current-submenu' ) ) {
			await menuElement.click();
		}

		return await this.click( menuItemSelector );
	}
}
