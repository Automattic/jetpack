import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export default class SearchDashboard extends WpPage {
	static SEARCH_SETTING_API_PATTERN = /^https?:\/\/.*jetpack\/v4\/search\/settings/;

	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/admin.php?page=jetpack-search`;
		super( page, {
			expectedSelectors: [ '.jp-search-dashboard-top__title' ],
			url,
			explicitWaitMS: 30000,
		} );
	}

	async isSearchModuleToggleVisibile() {
		const moduleToggleSelector = '.form-toggle__switch[aria-label="Enable Jetpack Search"]';
		return await this.isElementVisible( moduleToggleSelector );
	}

	async isInstantSearchToggleVisible() {
		const instantSearchSelector =
			'.form-toggle__switch[aria-label="Enable instant search experience (recommended)"]';
		return await this.isElementVisible( instantSearchSelector );
	}

	async isTitleVisible() {
		const titleSelector = '.jp-search-dashboard-top__title';
		return await this.isElementVisible( titleSelector );
	}

	async isHeaderVisible() {
		const logoSelector = '.jetpack-logo';
		return await this.isElementVisible( logoSelector );
	}

	async isFooterVisible() {
		const footerSelector = '.jp-dashboard-footer';
		return await this.isElementVisible( footerSelector );
	}

	async toggleSearchModule() {
		const moduleToggleSelector = '.form-toggle__switch[aria-label="Enable Jetpack Search"]';
		await this.click( moduleToggleSelector );
		await this.waitForToggling();
	}

	async toggleInstantSearch() {
		const instantSearchToggleSelector =
			'.form-toggle__switch[aria-label="Enable instant search experience (recommended)"]';
		await this.click( instantSearchToggleSelector );
		await this.waitForToggling();
	}

	async isSearchModuleToggleOn() {
		const moduleToggleSelector = '.form-toggle__switch[aria-label="Enable Jetpack Search"]';
		return await this.page.$eval(
			moduleToggleSelector,
			e => e.getAttribute( 'aria-checked' ) === 'true'
		);
	}

	async isInstantSearchToggleOn() {
		const instantSearchToggleSelector =
			'.form-toggle__switch[aria-label="Enable instant search experience (recommended)"]';
		return await this.page.$eval(
			instantSearchToggleSelector,
			e => e.getAttribute( 'aria-checked' ) === 'true'
		);
	}

	async waitForToggling() {
		await this.waitForUpdateSearchSettingFinished();
		const moduleToggleSelector = 'span.form-toggle__switch:not([disabled])';
		await this.waitForElementToBeVisible( moduleToggleSelector );
	}

	async waitForUpdateSearchSettingFinished() {
		return await this.page.waitForResponse( resp =>
			SearchDashboard.SEARCH_SETTING_API_PATTERN.test( resp.url() )
		);
	}

	async isCustomizeButtonVisible() {
		const customizeButtonSelector =
			'.jp-form-search-settings-group-buttons__button.is-customize-search';
		return await this.isElementVisible( customizeButtonSelector );
	}

	async isCustomizeButtonDisabled() {
		const customizeButtonSelector =
			'.jp-form-search-settings-group-buttons__button.is-customize-search';
		return await this.page.$eval( customizeButtonSelector, e => e.disabled );
	}

	async isEditWidgetButtonVisible() {
		const widgetButtonSelector = '.jp-form-search-settings-group-buttons__button.is-widgets-editor';
		return await this.isElementVisible( widgetButtonSelector );
	}
}
