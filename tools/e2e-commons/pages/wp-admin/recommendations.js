import WpPage from '../wp-page.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.js';

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

	get siteTypeAgencyCheckboxSel() {
		return '.jp-checkbox-answer__container input#site-type-agency';
	}

	get siteTypeStoreCheckboxSel() {
		return '.jp-checkbox-answer__container input#site-type-store';
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
		return 'a[href*="recommendations/newsletter"] >> text="Enable Related Posts"';
	}

	get enableNewsletterButtonSel() {
		return 'a[href*="recommendations/site-accelerator"] >> text="Enable Newsletter"';
	}

	get enableSiteAcceleratorButtonSel() {
		return 'a[href*="recommendations/vaultpress-backup"] >> text="Enable Site Accelerator"';
	}

	get skipSiteAcceleratorButtonSel() {
		return 'a[href*="recommendations/vaultpress-backup"] >> text="Not now"';
	}

	get tryVaultPressBackup() {
		return 'a[href*="jetpack-recommendations-product-checkout"] >> text=Get';
	}

	get skipVaultPressBackup() {
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

	get newsletterFeatureEnabledSel() {
		return '.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Newsletter"';
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

	async isPersonalSiteTypeChecked() {
		return await this.isElementChecked( this.siteTypePersonalCheckboxSel );
	}

	async isAgencyTypeUnchecked() {
		return await this.isElementChecked( this.siteTypeAgencyCheckboxSel );
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

	async isEnableNewsletterButtonVisible() {
		return await this.isElementVisible( this.enableNewsletterButtonSel );
	}

	async enableNewsletterAndContinue() {
		return await this.click( this.enableNewsletterButtonSel );
	}

	async isEnableSiteAcceleratorButtonVisible() {
		return await this.isElementVisible( this.enableSiteAcceleratorButtonSel );
	}

	async skipSiteAcceleratorAndContinue() {
		return await this.click( this.skipSiteAcceleratorButtonSel );
	}

	async isTryVaultPressBackupButtonVisible() {
		return await this.isElementVisible( this.tryVaultPressBackup );
	}

	async skipVaultPressBackupAndContinue() {
		return await this.click( this.skipVaultPressBackup );
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

	async isNewsletterFeatureEnabled() {
		return await this.isElementVisible( this.newsletterFeatureEnabledSel );
	}

	async isSiteAcceleratorFeatureEnabled() {
		return await this.isElementVisible( this.siteAcceleratorFeatureNotEnabledSel );
	}
}
