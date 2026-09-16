import { useMemo } from 'react';
import { useAllProducts } from '../../../data/products/use-all-products';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import { resolveFeatureAction } from './resolve-feature-action';
import type { FeatureActionKind } from './resolve-feature-action';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

// `link_only` is a feature with nothing local to switch, so it can only be visited.
export type FeatureAction = FeatureActionKind | 'link_only';

export type FeatureState = {
	feature: MainFeature;
	status: 'active' | 'inactive';
	action: FeatureAction;
	product?: ProductCamelCase;
	module?: MyJetpackModule;
	// Whether the row can take part in a bulk action. A feature that needs a paid plan
	// or has nothing to switch cannot, so its checkbox is disabled.
	selectable: boolean;
};

const stateForFeature = (
	feature: MainFeature,
	products: Record< string, ProductCamelCase >,
	modules: Record< JetpackModuleSlug, MyJetpackModule >
): FeatureState => {
	if ( feature.product ) {
		const product = products?.[ feature.product ];
		const action = product
			? resolveFeatureAction( product, !! feature.learn_more_route )
			: 'link_only';

		return {
			feature,
			product,
			action,
			status: action === 'running' ? 'active' : 'inactive',
			selectable: action === 'install' || action === 'activate' || action === 'running',
		};
	}

	if ( feature.module ) {
		const $module = modules?.[ feature.module as JetpackModuleSlug ];

		if ( ! $module ) {
			return { feature, action: 'link_only', status: feature.status, selectable: false };
		}

		return {
			feature,
			module: $module,
			action: $module.activated ? 'running' : 'activate',
			status: $module.activated ? 'active' : 'inactive',
			// An overridden module is pinned on or off by a filter, so it cannot be toggled.
			selectable: $module.available && ! $module.override,
		};
	}

	return { feature, action: 'link_only', status: feature.status, selectable: false };
};

/**
 * Resolve live state for the whole feature list in one pass.
 *
 * The rows and the bulk action bar read the same states, so a row can never offer
 * something the bar disagrees with. Both stores are shared queries, so this costs no
 * more requests than a single row would.
 *
 * @param features - The feature catalog.
 * @return One state per feature, in catalog order.
 */
export function useFeatureStates( features: MainFeature[] ): FeatureState[] {
	const { data: products } = useAllProducts();
	const { modules } = useAllJetpackModules();

	return useMemo(
		() => features.map( feature => stateForFeature( feature, products, modules ) ),
		[ features, products, modules ]
	);
}
