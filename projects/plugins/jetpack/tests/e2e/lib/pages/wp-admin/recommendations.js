/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

const PERSONAL_CHECKBOX_SELECTOR = '.jp-checkbox-answer__container:nth-child(1) input';
const BUSINESS_CHECKBOX_SELECTOR = '.jp-checkbox-answer__container:nth-child(2) input';
const STORE_CHECKBOX_SELECTOR = '.jp-checkbox-answer__container:nth-child(3) input';
const OTHER_CHECKBOX_SELECTOR = '.jp-checkbox-answer__container:nth-child(4) input';

export default class RecommendationsPage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/wp-admin/admin.php?page=jetpack#/recommendations`;
		super( page, { expectedSelectors: [ '[class^=jp-recommendations-]' ], url } );
	}

	isUrlInSyncWithStepName( stepName ) {
		const url = this.page.url();
		return url.includes( stepName );
	}

	async areSiteTypeQuestionsVisible() {
		const siteTypeQuestionsSelector = '.jp-recommendations-question__site-type-checkboxes';
		return await this.waitForElementToBeVisible( siteTypeQuestionsSelector );
	}

	async checkPersonalSiteType() {
		const personalSiteTypeSelector = PERSONAL_CHECKBOX_SELECTOR;
		return await this.click( personalSiteTypeSelector );
	}

	async checkOtherSiteType() {
		const otherSiteTypeSelector = OTHER_CHECKBOX_SELECTOR;
		return await this.click( otherSiteTypeSelector );
	}

	async isPersonalSiteTypeChecked() {
		return await this.isElementVisible( `${ PERSONAL_CHECKBOX_SELECTOR }:checked` );
	}

	async isOtherSiteTypeChecked() {
		return await this.isElementVisible( `${ OTHER_CHECKBOX_SELECTOR }:checked` );
	}

	async isBusinessTypeUnchecked() {
		return await this.isElementVisible( `${ BUSINESS_CHECKBOX_SELECTOR }:checked` );
	}

	async isStoreTypeUnchecked() {
		return await this.isElementVisible( `${ STORE_CHECKBOX_SELECTOR }:checked` );
	}

	async saveSiteTypeAndContinue() {
		return await this.click( 'a[href*="recommendations/monitor"] >> text="Continue"' );
	}

	async isEnableMonitoringButtonVisible() {
		return await this.isElementVisible(
			'a[href*="recommendations/related-posts"] >> text="Enable Downtime Monitoring"'
		);
	}

	async enableMonitoringAndContinue() {
		return await this.click(
			'a[href*="recommendations/related-posts"] >> text="Enable Downtime Monitoring"'
		);
	}

	async isEnableRelatedPostsButtonVisible() {
		return await this.isElementVisible(
			'a[href*="recommendations/creative-mail"] >> text="Enable Related Posts"'
		);
	}

	async enableRelatedPostsAndContinue() {
		return await this.click(
			'a[href*="recommendations/creative-mail"] >> text="Enable Related Posts"'
		);
	}

	async isInstallCreativeMailButtonVisible() {
		return await this.isElementVisible(
			'a[href*="recommendations/site-accelerator"] >> text="Install Creative Mail"'
		);
	}

	async skipCreativeMailAndContinue() {
		return await this.click( 'a[href*="recommendations/site-accelerator"] >> text="Not now"' );
	}

	async isEnableSiteAcceleratorButtonVisible() {
		return await this.isElementVisible(
			'a[href*="recommendations/summary"] >> text="Enable Site Accelerator"'
		);
	}

	async skipSiteAcceleratorAndContinue() {
		return await this.click( 'a[href*="recommendations/summary"] >> text="Not now"' );
	}

	async isSummaryContentVisible() {
		return await this.isElementVisible( '.jp-recommendations-summary__content' );
	}

	async isSummarySidebarVisible() {
		return await this.isElementVisible( '.jp-recommendations-summary__sidebar' );
	}

	async isMonitoringFeatureEnabled() {
		const monitorFeatureEnabledSelector =
			'.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Downtime Monitoring"';

		return await this.isElementVisible( monitorFeatureEnabledSelector );
	}

	async isRelatedPostsFeatureEnabled() {
		const relatedPostsFeatureEnabledSelector =
			'.jp-recommendations-feature-summary.is-feature-enabled >> a >> text="Related Posts"';

		return await this.isElementVisible( relatedPostsFeatureEnabledSelector );
	}

	async isCreativeMailFeatureEnabled() {
		const creativeMailFeatureEnabledSelector =
			'.jp-recommendations-feature-summary:not(.is-feature-enabled) >> a >> text="Creative Mail"';

		return await this.isElementVisible( creativeMailFeatureEnabledSelector );
	}

	async isSiteAcceleratorFeatureEnabled() {
		const siteAcceleratorFeatureEnabledSelector =
			'.jp-recommendations-feature-summary:not(.is-feature-enabled) >> a >> text="Site Accelerator"';

		return await this.isElementVisible( siteAcceleratorFeatureEnabledSelector );
	}
}
