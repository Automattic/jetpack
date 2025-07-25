import WpPage from '_jetpack-e2e-commons/pages/wp-page.js';
import pwConfig from '../../../playwright.config.mjs';

export default class PermalinksPage extends WpPage {
	constructor( page ) {
		const url = `${ pwConfig.use.baseURL }/wp-admin/options-permalink.php`;
		super( page, { expectedSelectors: [ '.permalink-structure' ], url } );
	}

	async usePlainStructure() {
		const selector = '[id="permalink-input-plain"]';
		await this.page.click( selector );
		await this.page.click( '[id="submit"]' );
		await this.waitForLoad();
	}

	async useDayNameStructure() {
		const selector = '[id="permalink-input-day-name"]';
		await this.page.click( selector );
		await this.page.click( '[id="submit"]' );
		await this.waitForLoad();
	}
}
