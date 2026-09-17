import { useMemo } from 'react';
import { PRODUCTS_MUST_HAVE_A_STANDALONE_PLUGIN, PRODUCT_STATUSES } from '../../../constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import { getProductModules } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

export type FeatureState = {
	feature: MainFeature;
	status: 'active' | 'inactive';
	// The records behind the feature, for the card's toggle. Absent until the matching
	// store answers, or when the feature is backed by neither.
	product?: ProductCamelCase;
	module?: MyJetpackModule;
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
	modules: Record< JetpackModuleSlug, MyJetpackModule >,
	productModules: Record< string, string >
): FeatureState => {
	if ( feature.product ) {
		const product = products?.[ feature.product ];

		if ( ! product ) {
			return { feature, status: feature.status };
		}

		// A product's module is rarely named after it (Social runs 'publicize'), and the
		// catalog only names a module when no product backs the feature. Resolve it the
		// way the Products tab builds its cards, or the toggle reads as unavailable.
		const moduleSlug = ( productModules[ feature.product ] ||
			feature.product ) as JetpackModuleSlug;

		return {
			feature,
			product,
			module: modules?.[ moduleSlug ],
			status: isProductRunning( product ) ? 'active' : 'inactive',
		};
	}

	if ( feature.module ) {
		const $module = modules?.[ feature.module as JetpackModuleSlug ];

		return $module
			? { feature, module: $module, status: $module.activated ? 'active' : 'inactive' }
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
	const productModules = getProductModules();

	return useMemo(
		() => features.map( feature => stateForFeature( feature, products, modules, productModules ) ),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- productModules is rebuilt each render from a constant map.
		[ features, products, modules ]
	);
}
