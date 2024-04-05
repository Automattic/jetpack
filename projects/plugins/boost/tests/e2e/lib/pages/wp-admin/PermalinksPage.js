import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.js';

export default class PermalinksPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/options-permalink.php`;
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
