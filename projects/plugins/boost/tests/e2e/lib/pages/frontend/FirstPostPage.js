import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.js';

export default class FirstPostPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/?p=1`;
		super( page, { url } );
	}

	async isImageGuideScriptPresent() {
		const selector = '#jetpack-boost-guide-js';
		return ( await this.page.locator( selector ).count() ) > 0;
	}

	async isImageGuideAdminBarItemPresent() {
		const selector = '#wp-toolbar #jetpack-boost-guide-bar';
		return ( await this.page.locator( selector ).count() ) > 0;
	}

	async isImageGuideUIPresent() {
		const selector = '.jetpack-boost-guide > .guide';
		return this.waitForElementToBeVisible( selector, 5 * 1000 );
	}
}
