import { store as modulesStore } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import { MyJetpackModule } from '../../types';
import { JetpackModuleSlug } from './types';

/**
 * Custom hook to retrieve all Jetpack modules.
 *
 * @return  An object containing all Jetpack modules.
 */
export function useAllJetpackModules(): {
	modules: Record< JetpackModuleSlug, MyJetpackModule >;
	isLoading: boolean;
} {
	return useSelect( select => {
		// TODO Check if the `jetpack/v4/module/all` endpoint is available before calling this
		return {
			modules: select( modulesStore ).getJetpackModules(),
			isLoading: select( modulesStore ).areModulesLoading(),
		};
	}, [] );
}
