const jetpackSettingSelectors = {
	getPublicizeModuleStatus: state => state.jetpackSettings,
	isModuleEnabled: state => state.jetpackSettings.publicize_active,
	isUpdatingJetpackSettings: state => state.jetpackSettings.is_updating,
	// TODO: Replace this with a real endpoint
	hasPaidUpgrade: () => false,
};

export default jetpackSettingSelectors;
