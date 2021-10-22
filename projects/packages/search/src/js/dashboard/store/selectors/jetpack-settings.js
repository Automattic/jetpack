const jetpackSettingSelectors = {
	getCalypsoSlug: state => state.jetpackSettings?.calypsoSlug ?? {},
	getSearchModuleStatus: state => ( {
		isModuleEnabled: state.jetpackSettings.search,
		isInstantSearchEnabled: state.jetpackSettings.instant_search_enabled,
	} ),
};

export default jetpackSettingSelectors;
