import { REST_API_SITE_MODULES_ENDPOINT, QUERY_SITE_MODULES_KEY } from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
import { MyJetpackModule, JetpackModuleSlug } from '../../../types';

type JetpackModulesMap = Record< JetpackModuleSlug, MyJetpackModule >;

/**
 * Custom hook to retrieve all Jetpack modules.
 *
 * Fetches from the portable `my-jetpack/v1/site/modules` endpoint, which is available on Simple,
 * Atomic and self-hosted Jetpack sites (mirroring how Jetpack Forms exposes a locally-registered
 * route everywhere). The list is always fetched — including in products-only mode, where the
 * modules are shown read-only (no activate/deactivate toggle).
 *
 * @return  An object containing all Jetpack modules.
 */
export function useAllJetpackModules(): {
	modules: JetpackModulesMap;
	isLoading: boolean;
} {
	const { data, isLoading } = useSimpleQuery< JetpackModulesMap >( {
		name: QUERY_SITE_MODULES_KEY,
		query: { path: REST_API_SITE_MODULES_ENDPOINT },
	} );

	return {
		modules: data ?? ( {} as JetpackModulesMap ),
		isLoading,
	};
}
