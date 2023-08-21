const autoConversionSettingsSelectors = {
	getAutoConversionSettings: state => state.autoConversionSettings,
	isAutoConversionAvailable: state => state.autoConversionSettings.available,
	isAutoConversionEnabled: state => state.autoConversionSettings[ 'auto-conversion' ],
	isAutoConversionSettingsUpdating: state => state.autoConversionSettings.isUpdating,
};

export default autoConversionSettingsSelectors;
