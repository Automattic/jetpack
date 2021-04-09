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
		return await this.click( 'a.is-primary[href*="recommendations/monitor"]' );
	}

	async isEnableMonitoringButtonVisible() {
		return await this.isElementVisible( 'a.is-primary[href*="recommendations/related-posts"]' );
	}

	async enableMonitoringAndContinue() {
		return await this.click( 'a.is-primary[href*="recommendations/related-posts"]' );
	}

	async isEnableRelatedPostsButtonVisible() {
		return await this.isElementVisible( 'a.is-primary[href*="recommendations/creative-mail"]' );
	}

	async enableRelatedPostsAndContinue() {
		return await this.click( 'a.is-primary[href*="recommendations/creative-mail"]' );
	}

	async isInstallCreativeMailButtonVisible() {
		return await this.isElementVisible( 'a.is-primary[href*="recommendations/site-accelerator"]' );
	}

	async skipCreativeMailAndContinue() {
		return await this.click( 'a:not(.is-primary)[href*="recommendations/site-accelerator"]' );
	}

	async isEnableSiteAcceleratorButtonVisible() {
		return await this.isElementVisible( 'a.is-primary[href*="recommendations/summary"]' );
	}

	async skipSiteAcceleratorAndContinue() {
		return await this.click( 'a:not(.is-primary)[href*="recommendations/summary"]' );
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
