import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export default class SearchConfigure extends WpPage {
	static SEARCH_SETTING_API_PATTERN = /^https?:\/\/.*%2Fwp%2Fv2%2Fsettings/;

	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/admin.php?page=jetpack-search-configure`;
		super( page, {
			expectedSelectors: [ '.jp-search-configure-header__title' ],
			url,
			explicitWaitMS: 30000,
		} );
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

	async chooseNewestAsDefaultSort() {
		const defaultSortSelector = '.jp-search-configure-default-sort-select select';
		return await this.selectOption( defaultSortSelector, 'newest' );
	}

	async clickSaveButton() {
		const buttonSelector = 'button.jp-search-configure-save-button';
		await this.click( buttonSelector );
		await this.waitForUpdateSearchConfigureFinished();
		await this.waitForNetworkIdle();
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
		const pinkColorSelector = 'button.is-pressed[aria-label="Color: Pale pink"]';
		return await this.isElementVisible( pinkColorSelector, 200 );
	}

	async isFormatProduct() {
		const productFormatSelector = 'input[type=radio][value="product"]';
		return await this.page.$eval( productFormatSelector, e => e.checked );
	}

	async isDefaultSortNewest() {
		const defaultSortSelector = '.jp-search-configure-default-sort-select select';
		return await this.page.$eval( defaultSortSelector, e => e.value === 'newest' );
	}

	async isPreviewDarkTheme() {
		const darkThemeButtonSelector =
			'.jetpack-instant-search.jetpack-instant-search__overlay.jetpack-instant-search__overlay--dark';
		return await this.isElementVisible( darkThemeButtonSelector, 200 );
	}

	async isPreviewFormatProduct() {
		const productFormatSelector =
			'ol.jetpack-instant-search__search-results-list.is-format-product';
		return await this.isElementVisible( productFormatSelector, 200 );
	}

	async isPreviewDefaultSortNewest() {
		const previewDefaultSortLinkSelector =
			'.jetpack-instant-search__search-sort-option.is-selected[data-value="newest"]';
		const previewDefaultSortSelectSelector = '#jetpack-instant-search__search-sort-select';
		return (
			( await this.isElementVisible( previewDefaultSortLinkSelector, 200 ) ) ||
			( await this.page.$eval( previewDefaultSortSelectSelector, e => e.value === 'newest' ) )
		);
	}

	async waitForUpdateSearchConfigureFinished() {
		return this.page.waitForResponse( resp =>
			SearchConfigure.SEARCH_SETTING_API_PATTERN.test( resp.url() )
		);
	}
}
