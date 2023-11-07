const socialImageGeneratorSettingsSelectors = {
	getSocialImageGeneratorSettings: state => state.socialImageGeneratorSettings,
	isSocialImageGeneratorAvailable: state => state.socialImageGeneratorSettings.available,
	isSocialImageGeneratorEnabled: state => state.socialImageGeneratorSettings.enabled,
	isUpdatingSocialImageGeneratorSettings: state => state.socialImageGeneratorSettings.isUpdating,
	getSocialImageGeneratorDefaultTemplate: state =>
		state.socialImageGeneratorSettings.defaultTemplate,
};

export default socialImageGeneratorSettingsSelectors;
