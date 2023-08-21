const autoConversionSettingsSelectors = {
	getAutoConversionSettings: state => state.autoConversionSettings,
	isAutoConversionAvailable: state => state.autoConversionSettings.available,
	isAutoConversionEnabled: state => state.autoConversionSettings.image,
	isAutoConversionSettingsUpdating: state => state.autoConversionSettings.isUpdating,
};

export default autoConversionSettingsSelectors;
