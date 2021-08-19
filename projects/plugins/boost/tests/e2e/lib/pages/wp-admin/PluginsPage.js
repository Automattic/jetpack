/**
 * Internal dependencies
 */
import WpPage from '../WpPage';

export default class PluginsPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.search-box' ] } );
	}

	async deactivateJetpackBoost() {
		const selector = "tr[data-slug='jetpack-boost'] a[href*='=deactivate']";
		const navigationPromise = this.waitForLoad();
		await this.click( selector );
		await navigationPromise;
	}

	async activateJetpackBoost() {
		const selector = "tr[data-slug='jetpack-boost'] a[href*='=activate']";
		const navigationPromise = this.waitForLoad();
		await this.click( selector );
		await navigationPromise;
	}
}
