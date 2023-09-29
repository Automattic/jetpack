const jetpackModulesSelectors = {
	getJetpackModules: state => state.data,
	isModuleActive: ( state, moduleName ) => state?.data?.[ moduleName ]?.activated ?? false,
	areModulesLoading: state => state.isLoading ?? false,
	areModulesUpdating: state => state.isUpdating ?? false,
};

export default jetpackModulesSelectors;
