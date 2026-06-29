import { REST_API_SITE_MODULES_ENDPOINT, QUERY_SITE_MODULES_KEY } from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
import { MyJetpackModule, JetpackModuleSlug } from '../../../types';
import { isProductsOnlyMode } from '../../../utils/is-products-only-mode';

type JetpackModulesMap = Record< JetpackModuleSlug, MyJetpackModule >;

/**
 * Custom hook to retrieve all Jetpack modules.
 *
 * Fetches from the portable `my-jetpack/v1/site/modules` endpoint, which is available on Simple,
 * Atomic and self-hosted Jetpack sites (mirroring how Jetpack Forms exposes a locally-registered
 * route everywhere). In products-only mode the site can't manage modules, so the request is
 * skipped entirely.
 *
 * @return  An object containing all Jetpack modules.
 */
export function useAllJetpackModules(): {
	modules: JetpackModulesMap;
	isLoading: boolean;
} {
	const productsOnly = isProductsOnlyMode();

	const { data, isLoading } = useSimpleQuery< JetpackModulesMap >( {
		name: QUERY_SITE_MODULES_KEY,
		query: { path: REST_API_SITE_MODULES_ENDPOINT },
		options: { enabled: ! productsOnly },
	} );

	return {
		modules: data ?? ( {} as JetpackModulesMap ),
		isLoading: productsOnly ? false : isLoading,
	};
}
