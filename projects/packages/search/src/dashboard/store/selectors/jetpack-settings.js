const jetpackSettingSelectors = {
	getSearchModuleStatus: state => state.jetpackSettings,
	isModuleEnabled: state => state.jetpackSettings.module_active,
	isInstantSearchEnabled: state => state.jetpackSettings.instant_search_enabled,
	isAiAnswersEnabled: state => !! state.jetpackSettings.ai_answers_enabled,
	isUpdatingJetpackSettings: state => state.jetpackSettings.is_updating,
	isTogglingModule: state => state.jetpackSettings.is_toggling_module,
	isTogglingInstantSearch: state => state.jetpackSettings.is_toggling_instant_search,
};

export default jetpackSettingSelectors;
