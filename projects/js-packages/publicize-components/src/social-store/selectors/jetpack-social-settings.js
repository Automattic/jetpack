const jetpackSocialSettingsSelectors = {
	isJetpackSocialSettingsUpdating: state => state.jetpackSocialSettings.isUpdating,
	getJetpackSocialSettings: state => state.jetpackSocialSettings,
	// Auto Conversion Settings
	getAutoConversionSettings: state => state.jetpackSocialSettings.autoConversionSettings,
	isAutoConversionAvailable: state => state.jetpackSocialSettings.autoConversionSettings?.available,
	isAutoConversionEnabled: state => state.jetpackSocialSettings.autoConversionSettings.image,
	isAutoConversionSettingsUpdating: state =>
		state.jetpackSocialSettings.isUpdatingAutoConversionSettings,
	// Social image generator settings
	getSocialImageGeneratorSettings: state =>
		state.jetpackSocialSettings.socialImageGeneratorSettings,
	isSocialImageGeneratorAvailable: state =>
		state.jetpackSocialSettings.socialImageGeneratorSettings?.available,
	isSocialImageGeneratorEnabled: state =>
		state.jetpackSocialSettings.socialImageGeneratorSettings?.enabled,
	getSocialImageGeneratorDefaultTemplate: state =>
		state.jetpackSocialSettings.socialImageGeneratorSettings?.defaults?.template,
	isUpdatingSocialImageGeneratorSettings: state =>
		state.jetpackSocialSettings.isUpdatingSocialImageGeneratorSettings,
};

export default jetpackSocialSettingsSelectors;
