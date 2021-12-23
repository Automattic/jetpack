import WpPage from '../wp-page.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class SearchConfigure extends WpPage {
	static SEARCH_SETTING_API_PATTERN = /^https?:\/\/.*\/wp%2Fv2%2Fsettings/;

	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/admin.php?page=jetpack-search-configure`;
		super( page, { expectedSelectors: [ '.jp-search-configure-header__title' ], url } );
		this.timeout = 30000; // 30s.
	}

	async chooseDarkTheme() {
		const darkThemeButtonSelector = 'span[aria-label="Dark Theme"]';
		return await this.click( darkThemeButtonSelector );
	}

	async choosePinkAsHighlightColor() {
		const pinkColorSelector = 'button[aria-label="Color: Pale pink"]';
		return await this.click( pinkColorSelector );
	}

	async chooseProductFormat() {
		const productFormatSelector = 'input.components-radio-control__input[value="product"]';
		return await this.click( productFormatSelector );
	}

	// async toggleShowPoweredByJetpack() {
	// 	const toggleSelector = '.components-toggle-control:nth-child(2) .components-toggle-control__label';
	// 	return await this.click( toggleSelector );
	// }

	async clickSaveButton() {
		const buttonSelector = 'button.jp-search-configure-save-button';
		await this.click( buttonSelector );
		await this.waitForNetworkIdle();
		// await this.waitForUpdateSearchConfigureFinished();
	}

	async isDarkTheme() {
		const darkThemeButtonSelector = 'span[aria-label="Dark Theme"]';
		return await this.page.$eval( darkThemeButtonSelector, e =>
			e.parentElement
				.getAttribute( 'class' )
				.includes( 'jp-search-configure-theme-button--selected' )
		);
	}

	async isHighlightPink() {
		const pinkColorSelector = 'button[aria-label="Color: Pale pink"]';
		return await this.page.$eval( pinkColorSelector, e =>
			e.getAttribute( 'class' ).includes( 'is-pressed' )
		);
	}

	async isFormatProduct() {
		const productFormatSelector = 'label[text()="Product (for WooCommerce stores)"]';
		return await this.page.$eval( productFormatSelector, e => e.previousSibling.checked );
	}

	async isPoweredByJetpackOff() {
		const toggleSelector = 'label[text()="Show \\"Powered by Jetpack\\""]';
		return await this.page.$eval( toggleSelector, e =>
			e.previousSibling.getAttribute( 'class' ).includes( 'is-checked' )
		);
	}

	async waitForUpdateSearchConfigureFinished() {
		return this.page.waitForResponse( resp =>
			SearchConfigure.SEARCH_SETTING_API_PATTERN.test( resp.url() )
		);
	}
}
