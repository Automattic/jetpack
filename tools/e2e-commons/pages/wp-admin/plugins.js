import WpPage from '../wp-page.js';

export default class PluginsPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.search-box' ] } );
	}

	async deactivateJetpack() {
		const selector = "tr[data-slug='jetpack'] a[href*='=deactivate']";
		const navigationPromise = this.waitForLoad();
		await this.click( selector );
		await navigationPromise;
	}

	async activateJetpack() {
		const selector = "tr[data-slug='jetpack'] a[href*='=activate']";
		const navigationPromise = this.waitForLoad();
		await this.click( selector );
		await navigationPromise;
	}

	async isFullScreenPopupShown() {
		const fullScreenCardSelector = '.jp-connect-full__container-card';
		const connectButtonSelector = ".jp-connect-full__button-container a[href*='register']";
		const isCardVisible = await this.isElementVisible( fullScreenCardSelector );
		const isConnectButtonVisible = await this.isElementVisible( connectButtonSelector );
		return isCardVisible && isConnectButtonVisible;
	}

	async getJetpackVersion() {
		const versionText = 'tr.active[data-plugin="jetpack/jetpack.php"] .plugin-version-author-uri';
		const element = await this.waitForElementToBeVisible( versionText );
		const text = await this.page.evaluate( e => e.textContent, element );
		return text.match( /\d.+?(?=\s)/ )[ 0 ];
	}

	async updateJetpack() {
		await this.waitForTimeout( 2000 );
		const updateCard = 'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"]';
		const updateLink = 'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .update-link';
		const isUpdatingMessage =
			'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .updating-message';

		const updatedMessage =
			'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .updated-message';
		await this.waitForElementToBeVisible( updateCard );
		await this.click( updateLink );
		await this.waitForElementToBeVisible( isUpdatingMessage );
		await this.waitForElementToBeVisible( updatedMessage, 5 * 30000 );
	}
}
