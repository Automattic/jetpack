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
		// This is a workaround for the Jetpack submenu item not being visible, but
		// these tests will be changed to test the new onboarding flow in MARTECH-66.
		return await this.page.goto( '/wp-admin/admin.php?page=jetpack' );
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

	// Fixing parent menu click redirecting to the new onboarding flow (until more detailed tests are added.
	async _selectJetpackMenuItem( menuSelector, menuItemSelector ) {
		const menuElement = await this.waitForElementToBeVisible( menuSelector );
		const classes = await this.page
			.locator( menuSelector )
			.evaluate( e => e.getAttribute( 'class' ) );

		if ( ! classes.includes( 'wp-menu-open' ) && ! classes.includes( 'wp-has-current-submenu' ) ) {
			await menuElement.hover();
		}

		return await this.click( menuItemSelector );
	}
}
