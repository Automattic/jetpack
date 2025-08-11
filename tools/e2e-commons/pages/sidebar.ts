import type { Page } from '@playwright/test';

export default class Sidebar {
	page: Page;

	constructor( page: Page ) {
		this.page = page;
	}

	async selectJetpack() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector = '#toplevel_page_jetpack a[href$="admin.php?page=my-jetpack"]';

		return await this._selectMenuItem( jetpackMenuSelector, menuItemSelector );
	}

	async selectJetpackBoost() {
		const jetpackMenuSelector = '#toplevel_page_jetpack';
		const menuItemSelector = '#toplevel_page_jetpack a[href$="jetpack-boost"]';

		return await this._selectJetpackMenuItem( jetpackMenuSelector, menuItemSelector );
	}

	async _selectMenuItem( menuSelector: string, menuItemSelector: string ) {
		const menuElement = this.page.locator( menuSelector );
		const classes = await this.page.locator( menuSelector ).getAttribute( 'class' );

		if (
			! classes?.includes( 'wp-menu-open' ) &&
			! classes?.includes( 'wp-has-current-submenu' )
		) {
			await menuElement.click();
		}

		return this.page.locator( menuItemSelector ).click();
	}

	// Fixing parent menu click redirecting to the new onboarding flow (until more detailed tests are added.
	async _selectJetpackMenuItem( menuSelector: string, menuItemSelector: string ) {
		const menuElement = this.page.locator( menuSelector );
		const classes = await this.page.locator( menuSelector ).getAttribute( 'class' );

		if (
			! classes?.includes( 'wp-menu-open' ) &&
			! classes?.includes( 'wp-has-current-submenu' )
		) {
			await menuElement.hover();
		}

		return this.page.locator( menuItemSelector ).click();
	}
}
