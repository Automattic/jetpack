const jetpackSettingSelectors = {
	getJetpackSettings: state => state.jetpackSettings,
	isModuleEnabled: state => state.jetpackSettings.publicize_active,
	showPricingPage: state => state.jetpackSettings.show_pricing_page,
	isUpdatingJetpackSettings: state => state.jetpackSettings.is_updating,
	hasPaidPlan: state => ! ( state.jetpackSettings?.showNudge ?? true ),
	isEnhancedPublishingEnabled: state => state.jetpackSettings?.isEnhancedPublishingEnabled ?? false,
	getDismissedNotices: state => state.jetpackSettings?.dismissedNotices,
	isInstagramConnectionSupported: state => state.jetpackSettings?.isInstagramConnectionSupported,
	isMastodonConnectionSupported: state => state.jetpackSettings?.isMastodonConnectionSupported,
};

export default jetpackSettingSelectors;
