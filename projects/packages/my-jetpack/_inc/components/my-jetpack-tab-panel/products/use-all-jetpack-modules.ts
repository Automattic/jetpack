import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useSelect } from '@wordpress/data';
import { MyJetpackModule, JetpackModuleSlug } from '../../../types';
import { isProductsOnlyMode } from '../../../utils/is-products-only-mode';

/**
 * Custom hook to retrieve all Jetpack modules.
 *
 * @return  An object containing all Jetpack modules.
 */
export function useAllJetpackModules(): {
	modules: Record< JetpackModuleSlug, MyJetpackModule >;
	isLoading: boolean;
} {
	// In products-only mode the site can't manage modules and the `jetpack/v4/module/all`
	// endpoint is not available (it returns a 404), so skip the request entirely.
	const productsOnly = isProductsOnlyMode();

	return useSelect(
		select => {
			if ( productsOnly ) {
				return {
					modules: {} as Record< JetpackModuleSlug, MyJetpackModule >,
					isLoading: false,
				};
			}

			return {
				modules: select( modulesStore ).getJetpackModules(),
				isLoading: select( modulesStore ).areModulesLoading(),
			};
		},
		[ productsOnly ]
	);
}
