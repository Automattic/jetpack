import WpPage from '../wp-page.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class PluginsPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/plugins.php`;
		super( page, { expectedSelectors: [ '.search-box' ], url } );
	}

	async deactivatePlugin( pluginSlug ) {
		const selector = `tr[data-slug='${ pluginSlug }'] a[href*='=deactivate']`;
		await this.click( selector );
		await this.waitForLoad();
	}

	async activatePlugin( pluginSlug ) {
		const selector = `tr[data-slug='${ pluginSlug }'] a[href*='=activate']`;
		await this.click( selector );
		await this.waitForLoad();
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
		const updateCard = 'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"]';
		const updateLink = 'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .update-link';
		const isUpdatingMessage =
			'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .updating-message';

		const updatedMessage =
			'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .updated-message';
		await this.waitForElementToBeVisible( updateCard );
		await this.click( updateLink );
		await this.waitForElementToBeVisible( isUpdatingMessage );
		await this.waitForElementToBeVisible( updatedMessage, 6 * 30000 );
	}

	async clickOnJetpackBoostSettingsLink() {
		const selector = "tr[data-slug='jetpack-boost'] .row-actions a[href*='=jetpack-boost']";
		return await this.page.click( selector );
	}
}
