const socialImageGeneratorSettingsSelectors = {
	getSocialImageGeneratorSettings: state => state.socialImageGeneratorSettings,
	isSocialImageGeneratorEnabled: state => state.socialImageGeneratorSettings.enabled,
	isUpdatingSocialImageGeneratorSettings: state => state.socialImageGeneratorSettings.isUpdating,
	getSocialImageGeneratorDefaultTemplate: state => state.socialImageGeneratorSettings.template,
};

export default socialImageGeneratorSettingsSelectors;
