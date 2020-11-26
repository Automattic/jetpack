/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, isEventuallyVisible, waitForSelector } from '../../page-helper';

export default class PluginsPage extends Page {
	constructor( page ) {
		const expectedSelector = '.search-plugins';
		super( page, { expectedSelector } );
	}

	async deactivateJetpack() {
		const selector = "tr[data-slug='jetpack'] a[href*='=deactivate']";
		const navigationPromise = this.page.waitForNavigation();
		await waitAndClick( this.page, selector );
		await navigationPromise;
	}

	async activateJetpack() {
		const selector = "tr[data-slug='jetpack'] a[href*='=activate']";
		const navigationPromise = this.page.waitForNavigation();
		await waitAndClick( this.page, selector );
		await navigationPromise;
	}

	async isFullScreenPopupShown() {
		const fullScreenCardSelector = '.jp-connect-full__container-card';
		const connectButtonSelector = ".jp-connect-full__button-container a[href*='register']";
		const isCardVisible = await isEventuallyVisible( this.page, fullScreenCardSelector );
		const isConnectButtonVisible = await isEventuallyVisible( this.page, connectButtonSelector );
		return isCardVisible && isConnectButtonVisible;
	}

	async getJetpackVersion() {
		const versionText = 'tr.active[data-plugin="jetpack/jetpack.php"] .plugin-version-author-uri';
		const element = await waitForSelector( this.page, versionText );
		const text = await page.evaluate( e => e.textContent, element );
		return text.match( /\d.+?(?=\s)/ )[ 0 ];
	}

	async updateJetpack() {
		await this.page.waitForTimeout( 2000 );
		const updateCard = 'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"]';
		const updateLink = 'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .update-link';
		const isUpdatingMessage =
			'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .updating-message';

		const updatedMessage =
			'tr.active#jetpack-update[data-plugin="jetpack/jetpack.php"] .updated-message';
		await waitForSelector( this.page, updateCard );
		await waitAndClick( this.page, updateLink );
		await waitForSelector( this.page, isUpdatingMessage );
		await waitForSelector( this.page, updatedMessage, { timeout: 3 * 30000 } );
	}
}
