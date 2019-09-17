/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, isEventuallyVisible } from '../../page-helper';

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
}
