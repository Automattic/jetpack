import { useMemo } from 'react';
import { PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN, PRODUCT_STATUSES } from '../../../constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

export type FeatureState = {
	feature: MainFeature;
	status: 'active' | 'inactive';
};

// Statuses that mean the feature is not doing its job. Everything else leaves it working
// — an expiring plan or a warning still serves the site — so the card reads Active.
const NOT_RUNNING: string[] = [
	PRODUCT_STATUSES.ABSENT,
	PRODUCT_STATUSES.ABSENT_WITH_PLAN,
	PRODUCT_STATUSES.INACTIVE,
	PRODUCT_STATUSES.MODULE_DISABLED,
	PRODUCT_STATUSES.NEEDS_ACTIVATION,
	PRODUCT_STATUSES.NEEDS_PLAN,
];

const isProductRunning = ( product: ProductCamelCase ): boolean => {
	if ( NOT_RUNNING.includes( product.status ) ) {
		return false;
	}

	// A product that ships as its own plugin is only running once that plugin is.
	if ( PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN.includes( product.slug ) ) {
		const standalone = product.standalonePluginInfo;

		return !! standalone?.isStandaloneInstalled && !! standalone?.isStandaloneActive;
	}

	return true;
};

const stateForFeature = (
	feature: MainFeature,
	products: Record< string, ProductCamelCase >,
	modules: Record< JetpackModuleSlug, MyJetpackModule >
): FeatureState => {
	if ( feature.product ) {
		const product = products?.[ feature.product ];

		return product
			? { feature, status: isProductRunning( product ) ? 'active' : 'inactive' }
			: { feature, status: feature.status };
	}

	if ( feature.module ) {
		const $module = modules?.[ feature.module as JetpackModuleSlug ];

		return $module
			? { feature, status: $module.activated ? 'active' : 'inactive' }
			: { feature, status: feature.status };
	}

	// Neither a product nor a module to read, so PHP's answer is the only one there is.
	return { feature, status: feature.status };
};

/**
 * Resolve live state for the whole feature list in one pass.
 *
 * Both stores are shared queries, so this costs no more requests than a single card
 * would. Each feature falls back to the status PHP resolved, which is what the card
 * shows until the store answers.
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
