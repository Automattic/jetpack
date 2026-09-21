import { useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import { getProductModules } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

/**
 * What a feature's card offers, decided by the feature map and what is on the site.
 *
 * Resolved in the order listed: a module Jetpack already runs wins over the feature's
 * standalone plugin, so an installed plugin is only the switch when no module applies.
 */
export type FeatureControl =
	| { kind: 'module'; module: MyJetpackModule }
	| { kind: 'plugin'; plugin: string }
	| { kind: 'install-plugin'; plugin: string }
	| { kind: 'install-jetpack'; installed: boolean }
	| { kind: 'none' };

export type FeatureState = {
	feature: MainFeature;
	// True while this feature's live state is still being fetched. Its copy is already
	// right; its status and control are not known yet.
	pending?: boolean;
	// Whether the feature is switched on here, which is not whether a plan covers it:
	// the wp-admin sidebar asks the same question, and the two have to agree.
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
 * @param modulesLoading - Whether the module list is still being fetched.
 * @return The feature's state.
 */
export function resolveFeatureState(
	feature: MainFeature,
	jetpack: MainFeaturePluginStatus,
	product: ProductCamelCase | undefined,
	modules: Record< string, MyJetpackModule > | undefined,
	productModules: Record< string, string >,
	modulesLoading = false
): FeatureState {
	if ( feature.in_jetpack && jetpack === 'active' ) {
		// Answering from an empty module list would offer to install a plugin for a
		// feature Jetpack is already running.
		if ( modulesLoading ) {
			return { feature, product, pending: true, status: 'inactive', control: { kind: 'none' } };
		}

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

	// Nothing here switches the feature: Jetpack ships it but exposes no module, as with a
	// product still behind a pre-release gate. The product still knows whether it is running.
	return {
		feature,
		product,
		status: product?.status === PRODUCT_STATUSES.ACTIVE ? 'active' : 'inactive',
		control: { kind: 'none' },
	};
}

/**
 * Resolve live state for the whole feature list in one pass.
 *
 * @param state - The Features tab's state: Jetpack's status and the catalog.
 * @return One state per feature, in catalog order.
 */
export function useFeatureStates( state: MainFeaturesState ): {
	states: FeatureState[];
	isLoading: boolean;
} {
	const { data: products } = useAllProducts();
	const { modules, isLoading } = useAllJetpackModules();
	const productModules = getProductModules();

	// Until the modules land, every module lookup misses and a feature Jetpack runs would
	// read as "install its plugin instead". Only Jetpack-active sites consult them.
	const isLoadingModules = state.jetpack === 'active' && isLoading;

	const states = useMemo(
		() =>
			state.features.map( feature =>
				resolveFeatureState(
					feature,
					state.jetpack,
					feature.product ? products?.[ feature.product ] : undefined,
					modules,
					productModules,
					isLoadingModules
				)
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- productModules is rebuilt each render from a constant map.
		[ state, products, modules, isLoadingModules ]
	);

	return { states, isLoading: isLoadingModules };
}
