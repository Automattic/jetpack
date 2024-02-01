import { isSimpleSite } from '../site-type-utils';

const jetpackModulesSelectors = {
	getJetpackModules: state => state.data,
	// We consider simple sites to have all modules active
	// TODO: we would remove this when wrapping logic with hooks
	isModuleActive: ( state, moduleName ) =>
		isSimpleSite() || ( state?.data?.[ moduleName ]?.activated ?? false ),
	areModulesLoading: state => state.isLoading ?? false,
	isModuleUpdating: ( state, moduleName ) => state?.isUpdating?.[ moduleName ] ?? false,
};

export default jetpackModulesSelectors;
