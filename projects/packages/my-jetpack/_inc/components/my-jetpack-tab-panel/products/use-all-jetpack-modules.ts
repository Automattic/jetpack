import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useSelect } from '@wordpress/data';
import { useMemo } from 'react';
import { useAllProducts } from '../../../data/products/use-all-products';
import { MyJetpackModule, JetpackModuleSlug } from '../../../types';
import { getProductModules } from './mappings';
import type { ProductCamelCase } from '../../../data/types';

/**
 * Drop the forced-on override that a product's own standalone plugin causes.
 *
 * VideoPress's plugin forces its module on through `jetpack_active_modules`, which reads the
 * same as a host pinning it; the plugin is the real switch, so it keeps its usual control.
 *
 * @param modules  - Modules keyed by slug, as the modules store returns them.
 * @param products - Products keyed by slug.
 * @return The modules, with those overrides cleared.
 */
export function withoutPluginForcedOverrides(
	modules: Record< string, MyJetpackModule >,
	products: Record< string, ProductCamelCase > | undefined
): Record< string, MyJetpackModule > {
	if ( ! modules || ! products ) {
		return modules;
	}

	const productModules = getProductModules();
	let normalized = modules;

	for ( const [ slug, product ] of Object.entries( products ) ) {
		const moduleSlug = productModules[ slug ] || slug;
		const $module = modules[ moduleSlug ];

		if ( $module?.override === 'active' && product?.standalonePluginInfo?.isStandaloneActive ) {
			normalized = normalized === modules ? { ...modules } : normalized;
			normalized[ moduleSlug ] = { ...$module, override: false };
		}
	}

	return normalized;
}

/**
 * Custom hook to retrieve all Jetpack modules.
 *
 * @return  An object containing all Jetpack modules.
 */
export function useAllJetpackModules(): {
	modules: Record< JetpackModuleSlug, MyJetpackModule >;
	isLoading: boolean;
} {
	const { modules, isLoading } = useSelect( select => {
		// TODO Check if the `jetpack/v4/module/all` endpoint is available before calling this
		return {
			modules: select( modulesStore ).getJetpackModules(),
			isLoading: select( modulesStore ).areModulesLoading(),
		};
	}, [] );
	const { data: products } = useAllProducts();

	return useMemo(
		() => ( {
			modules: withoutPluginForcedOverrides( modules, products ) as Record<
				JetpackModuleSlug,
				MyJetpackModule
			>,
			isLoading,
		} ),
		[ modules, products, isLoading ]
	);
}
