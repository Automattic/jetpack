const jetpackSettingSelectors = {
	getCalypsoSlug: state => state.jetpackSettings?.calypsoSlug ?? {},
	getSearchModuleStatus: state => ( {
		isModuleEnabled: state.jetpackSettings.module_active,
		isInstantSearchEnabled: state.jetpackSettings.instant_search_enabled,
	} ),
	isUpdatingOptions: state => state.jetpackSettings.isUpdatingOptions,
	isTogglingModule: state => state.jetpackSettings.is_toggling_module,
	isTogglingInstantSearch: state => state.jetpackSettings.is_toggling_instant_search,
};

export default jetpackSettingSelectors;
