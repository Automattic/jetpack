import { useMemo } from 'react';
import { useAllProducts } from '../../../data/products/use-all-products';
import { getProductModules } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

/**
 * What a feature's card offers, decided by the feature map and what is on the site:
 *
 * - `module`: Jetpack is active and ships the feature, so its module is the switch.
 * - `plugin`: its standalone plugin is installed, so the plugin is the switch.
 * - `install-plugin`: its standalone plugin is not installed yet.
 * - `install-jetpack`: only Jetpack ships it, and Jetpack is not active.
 * - `none`: nothing on this site can switch it.
 */
export type FeatureControl =
	| { kind: 'module'; module: MyJetpackModule }
	| { kind: 'plugin'; plugin: string }
	| { kind: 'install-plugin'; plugin: string }
	| { kind: 'install-jetpack'; installed: boolean }
	| { kind: 'none' };

export type FeatureState = {
	feature: MainFeature;
	status: 'active' | 'inactive';
	control: FeatureControl;
	// The product behind the feature, for the modal's copy.
	product?: ProductCamelCase;
};

/**
 * Resolve one feature's state.
 *
 * @param feature        - The feature, from the map-backed catalog.
 * @param jetpack        - The Jetpack plugin's status.
 * @param product        - The product behind the feature, if any.
 * @param modules        - Every Jetpack module on the site.
 * @param productModules - Product slug to module slug, where the two differ.
 * @return The feature's state.
 */
export function resolveFeatureState(
	feature: MainFeature,
	jetpack: MainFeaturePluginStatus,
	product: ProductCamelCase | undefined,
	modules: Record< string, MyJetpackModule > | undefined,
	productModules: Record< string, string >
): FeatureState {
	if ( feature.in_jetpack && jetpack === 'active' ) {
		// A product's module is rarely named after it (Social runs 'publicize'). Resolved
		// the way the Products tab builds its cards, which also keeps the pre-release gate
		// on Jetpack AI: with the flag off that map drops AI, so no module resolves.
		const moduleSlug =
			feature.module ||
			( feature.product ? productModules[ feature.product ] || feature.product : '' );
		const $module = moduleSlug ? modules?.[ moduleSlug as JetpackModuleSlug ] : undefined;

		if ( $module?.available ) {
			return {
				feature,
				product,
				status: $module.activated ? 'active' : 'inactive',
				control: { kind: 'module', module: $module },
			};
		}
	}

	if ( feature.plugin ) {
		if ( feature.plugin_status === 'not-installed' ) {
			return {
				feature,
				product,
				status: 'inactive',
				control: { kind: 'install-plugin', plugin: feature.plugin },
			};
		}

		return {
			feature,
			product,
			status: feature.plugin_status === 'active' ? 'active' : 'inactive',
			control: { kind: 'plugin', plugin: feature.plugin },
		};
	}

	if ( feature.in_jetpack && jetpack !== 'active' ) {
		return {
			feature,
			product,
			status: 'inactive',
			control: { kind: 'install-jetpack', installed: jetpack === 'inactive' },
		};
	}

	// Jetpack is active but the feature's module is not available here.
	return { feature, product, status: feature.status, control: { kind: 'none' } };
}

/**
 * Resolve live state for the whole feature list in one pass.
 *
 * @param state - The Features tab's state: Jetpack's status and the catalog.
 * @return One state per feature, in catalog order.
 */
export function useFeatureStates( state: MainFeaturesState ): FeatureState[] {
	const { data: products } = useAllProducts();
	const { modules } = useAllJetpackModules();
	const productModules = getProductModules();

	return useMemo(
		() =>
			state.features.map( feature =>
				resolveFeatureState(
					feature,
					state.jetpack,
					feature.product ? products?.[ feature.product ] : undefined,
					modules,
					productModules
				)
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- productModules is rebuilt each render from a constant map.
		[ state, products, modules ]
	);
}
