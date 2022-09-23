import WpPage from '../wp-page.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class RecommendationsPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/admin.php?page=jetpack#/recommendations`;
		super( page, { expectedSelectors: [ '[class^=jp-recommendations-]' ], url } );
	}

	// selectors section

	get siteTypeCheckboxesSel() {
		return '.jp-recommendations-question__site-type-checkboxes';
	}

	get siteTypePersonalCheckboxSel() {
		return '.jp-checkbox-answer__container input#site-type-personal';
	}

	get siteTypeBusinessCheckboxSel() {
		return '.jp-checkbox-answer__container input#site-type-business';
	}

	get siteTypeStoreCheckboxSel() {
		return '.jp-checkbox-answer__container input#site-type-store';
	}

	get siteTypeOtherCheckboxSel() {
		return '.jp-checkbox-answer__container input#site-type-other';
	}

	get saveSiteTypeButtonSel() {
		return 'a[href*="recommendations/monitor"] >> text="Continue"';
	}

	get skipProductSuggestionsButtonSel() {
		return 'a[href*="recommendations/monitor"] >> text="Decide later"';
	}

	get enableMonitoringButtonSel() {
		return 'a[href*="recommendations/related-posts"] >> text="Enable Downtime Monitoring"';
	}

	get enableRelatedPostsButtonSel() {
		return 'a[href*="recommendations/creative-mail"] >> text="Enable Related Posts"';
	}

	get installCreativeMailButtonSel() {
		return 'a[href*="recommendations/site-accelerator"] >> text="Install Creative Mail"';
	}

	get skipCreativeMailButtonSel() {
		return 'a[href*="recommendations/site-accelerator"] >> text="Not now"';
	}

	get enableSiteAcceleratorButtonSel() {
		return 'a[href*="recommendations/summary"] >> text="Enable Site Accelerator"';
	}

	get skipSiteAcceleratorButtonSel() {
		return 'a[href*="recommendations/summary"] >> text="Not now"';
	}

	get summaryContentSel() {
		return '.jp-recommendations-summary__content';
	}

	get summarySidebarSel() {
		return '.jp-recommendations-summary__sidebar';
	}

	get monitoringFeatureEnabledSel() {
		return '.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Downtime Monitoring"';
	}

	get relatedPostsFeatureEnabledSel() {
		return '.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Related Posts"';
	}

	get creativeMailFeatureNotEnabledSel() {
		return '.jp-recommendations-feature-summary:not(.is-feature-enabled) >> a >> text="Creative Mail"';
	}

	get siteAcceleratorFeatureNotEnabledSel() {
		return '.jp-recommendations-feature-summary:not(.is-feature-enabled) >> a >> text="Site Accelerator"';
	}

	// end selectors section

	isUrlInSyncWithStepName( stepName ) {
		const url = this.page.url();
		return url.includes( stepName );
	}

	async areSiteTypeQuestionsVisible() {
		return await this.waitForElementToBeVisible( this.siteTypeCheckboxesSel );
	}

	async checkPersonalSiteType() {
		return await this.click( this.siteTypePersonalCheckboxSel );
	}

	async checkOtherSiteType() {
		return await this.click( this.siteTypeOtherCheckboxSel );
	}

	async isPersonalSiteTypeChecked() {
		return await this.isElementChecked( this.siteTypePersonalCheckboxSel );
	}

	async isOtherSiteTypeChecked() {
		return await this.isElementChecked( this.siteTypeOtherCheckboxSel );
	}

	async isBusinessTypeUnchecked() {
		return await this.isElementChecked( this.siteTypeBusinessCheckboxSel );
	}

	async isStoreTypeUnchecked() {
		return await this.isElementChecked( this.siteTypeStoreCheckboxSel );
	}

	async saveSiteTypeAndContinue() {
		return await this.click( this.saveSiteTypeButtonSel );
	}

	async isSkipProductSuggestionsButtonVisible() {
		return await this.isElementVisible( this.skipProductSuggestionsButtonSel );
	}

	async skipProductSuggestionsAndContinue() {
		return await this.click( this.skipProductSuggestionsButtonSel );
	}

	async isEnableMonitoringButtonVisible() {
		return await this.isElementVisible( this.enableMonitoringButtonSel );
	}

	async enableMonitoringAndContinue() {
		return await this.click( this.enableMonitoringButtonSel );
	}

	async isEnableRelatedPostsButtonVisible() {
		return await this.isElementVisible( this.enableRelatedPostsButtonSel );
	}

	async enableRelatedPostsAndContinue() {
		return await this.click( this.enableRelatedPostsButtonSel );
	}

	async isInstallCreativeMailButtonVisible() {
		return await this.isElementVisible( this.installCreativeMailButtonSel );
	}

	async skipCreativeMailAndContinue() {
		return await this.click( this.skipCreativeMailButtonSel );
	}

	async isEnableSiteAcceleratorButtonVisible() {
		return await this.isElementVisible( this.enableSiteAcceleratorButtonSel );
	}

	async skipSiteAcceleratorAndContinue() {
		return await this.click( this.skipSiteAcceleratorButtonSel );
	}

	async isSummaryContentVisible() {
		return await this.isElementVisible( this.summaryContentSel );
	}

	async isSummarySidebarVisible() {
		return await this.isElementVisible( this.summarySidebarSel );
	}

	async isMonitoringFeatureEnabled() {
		return await this.isElementVisible( this.monitoringFeatureEnabledSel );
	}

	async isRelatedPostsFeatureEnabled() {
		return await this.isElementVisible( this.relatedPostsFeatureEnabledSel );
	}

	async isCreativeMailFeatureEnabled() {
		return await this.isElementVisible( this.creativeMailFeatureNotEnabledSel );
	}

	async isSiteAcceleratorFeatureEnabled() {
		return await this.isElementVisible( this.siteAcceleratorFeatureNotEnabledSel );
	}
}
