import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import {
	moduleSwitchKey,
	pluginSwitchKey,
	useRequestedSwitches,
} from '../../../data/requested-switch-state';
import { getModuleStatus, getOverrideReason } from '../../modules-list/utils';
import { getProductModules } from '../products/mappings';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

// A running product reports these rather than `active` once its plan needs attention or nears expiry.
const RUNNING_ON_PLAN_STATUSES: string[] = [
	PRODUCT_STATUSES.ACTIVE,
	PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING,
	PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR,
	PRODUCT_STATUSES.EXPIRING_SOON,
];

/**
 * What a feature's card offers, decided by the feature map and what is on the site.
 *
 * Resolved in the order listed: a module Jetpack already runs wins over the feature's
 * standalone plugin, so an installed plugin is only the switch when no module applies.
 */
export type FeatureControl =
	| { kind: 'module'; module: MyJetpackModule }
	| { kind: 'plugin'; plugin: string; override?: 'active' | 'inactive' }
	| { kind: 'install-plugin'; plugin: string; runsWithoutPlugin?: true; blocked?: InstallBlock }
	| { kind: 'install-jetpack'; installed: boolean; blocked?: InstallBlock }
	| { kind: 'none' };

// Why the current user can't make an install the card would otherwise offer.
export type InstallBlock = Exclude< MainFeatureInstallAccess, 'allowed' >;

export type FeatureState = {
	feature: MainFeature;
	// True while this feature's live state is still being fetched. Its copy is already
	// right; its status and control are not known yet.
	pending?: boolean;
	// True while this feature's own switch has a request out.
	isSwitching?: boolean;
	// Whether the feature is switched on here, which is not whether a plan covers it:
	// the wp-admin sidebar asks the same question, and the two have to agree.
	status: 'active' | 'inactive';
	control: FeatureControl;
	// The product behind the feature, for the modal's copy.
	product?: ProductCamelCase;
};

/**
 * Why a feature can't be switched here: a host forced its module or plugin on or off, or
 * the site cannot run the module at all, as with the ones unavailable on multisite.
 *
 * @param state - The feature's live state.
 * @return The reason, or null when it can be switched.
 */
export function getForcedReason( state: FeatureState ): string | null {
	const { control } = state;

	if ( control.kind === 'module' ) {
		const status = getModuleStatus( control.module );

		if ( control.module.override || ! status.isAvailable ) {
			return status.reason ?? null;
		}
	}

	if ( control.kind === 'plugin' && control.override ) {
		return getOverrideReason( control.override );
	}

	return null;
}

/**
 * Why the current user can't install what a feature needs, and what to do instead.
 *
 * @param state - The feature's live state.
 * @return The reason, or null when nothing blocks the install.
 */
export function getInstallBlockReason( state: FeatureState ): string | null {
	const { control, feature } = state;

	if (
		( control.kind !== 'install-plugin' && control.kind !== 'install-jetpack' ) ||
		! control.blocked
	) {
		return null;
	}

	const pluginName =
		control.kind === 'install-jetpack' ? 'Jetpack' : feature.plugin_name || feature.name;

	return control.blocked === 'disabled'
		? sprintf(
				/* translators: %s is a plugin name, such as "Jetpack Boost". */
				__(
					'Plugin installs are turned off on this site. Ask your host or site administrator to install %s.',
					'jetpack-my-jetpack'
				),
				pluginName
			)
		: sprintf(
				/* translators: %s is a plugin name, such as "Jetpack Boost". */
				__(
					'Your account can’t install plugins. Ask a site administrator to install %s.',
					'jetpack-my-jetpack'
				),
				pluginName
			);
}

/**
 * The Jetpack module behind a feature, if any.
 *
 * A product's module is rarely named after it (Social runs 'publicize'). Resolved the way
 * the Products tab builds its cards, which also keeps the pre-release gate on Jetpack AI:
 * with the flag off that map drops AI, so no module resolves.
 *
 * @param feature        - The feature, from the map-backed catalog.
 * @param productModules - Product slug to module slug, where the two differ.
 * @return The module slug, or an empty string.
 */
export function getFeatureModuleSlug(
	feature: MainFeature,
	productModules: Record< string, string >
): string {
	return (
		feature.module ||
		( feature.product ? productModules[ feature.product ] || feature.product : '' )
	);
}

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
	const moduleSlug = getFeatureModuleSlug( feature, productModules );
	const $module =
		moduleSlug && jetpack === 'active' ? modules?.[ moduleSlug as JetpackModuleSlug ] : undefined;

	if ( feature.in_jetpack && jetpack === 'active' ) {
		// Answering from an empty module list would offer to install a plugin for a
		// feature Jetpack is already running.
		if ( modulesLoading ) {
			return { feature, product, pending: true, status: 'inactive', control: { kind: 'none' } };
		}

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
		// Read for status even where a plugin is the switch: the wp-admin sidebar counts a
		// Hybrid product as on when either its plugin or its module is, and a card that
		// disagreed with the sidebar would be wrong on any Jetpack site running the module.
		const moduleIsOn = Boolean( $module?.available && $module.activated );

		if ( feature.plugin_status === 'not-installed' ) {
			// A plan runs Backup and Scan in the cloud with no plugin. Shim until JETPACK-2620,
			// JETPACK-2805 and JETPACK-2806 settle where those land.
			const runsWithoutPlugin =
				Boolean( product?.hasPaidPlanForProduct ) &&
				RUNNING_ON_PLAN_STATUSES.includes( product?.status ?? '' );

			return {
				feature,
				product,
				status: moduleIsOn || runsWithoutPlugin ? 'active' : 'inactive',
				control: {
					kind: 'install-plugin',
					plugin: feature.plugin,
					...( runsWithoutPlugin && { runsWithoutPlugin: true as const } ),
				},
			};
		}

		return {
			feature,
			product,
			status: feature.plugin_status === 'active' || moduleIsOn ? 'active' : 'inactive',
			control: {
				kind: 'plugin',
				plugin: feature.plugin,
				override: feature.plugin_override || undefined,
			},
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
	const { modules } = useAllJetpackModules();
	const productModules = getProductModules();

	// Until the modules land, every module lookup misses and a feature Jetpack runs would
	// read as "install its plugin instead". Only Jetpack-active sites consult them.
	// Keyed on an empty list, not the store's loading flag: a refresh keeps the last list on
	// screen, and a failed first fetch leaves nothing to read either way.
	const isLoadingModules = state.jetpack === 'active' && Object.keys( modules ?? {} ).length === 0;

	// What each switch with a request out asked for. Applied over the fetched state rather
	// than written into it, so a response carrying the whole site cannot overwrite a
	// feature someone is still toggling — each one settles when its own request resolves.
	const requested = useRequestedSwitches();

	const states = useMemo(
		() =>
			state.features
				.map( feature => applyRequestedPlugin( feature, requested ) )
				.map( feature =>
					resolveFeatureState(
						feature,
						state.jetpack,
						feature.product ? products?.[ feature.product ] : undefined,
						modules,
						productModules,
						isLoadingModules
					)
				)
				.map( resolved => applyRequestedModule( resolved, requested ) )
				.map( resolved => applyInstallAccess( resolved, state.plugin_installs ) )
				.map( resolved =>
					requested[ pluginSwitchKey( resolved.feature.plugin ) ] === undefined
						? resolved
						: { ...resolved, isSwitching: true }
				),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- productModules is rebuilt each render from a constant map.
		[ state, products, modules, isLoadingModules, requested ]
	);

	return { states, isLoading: isLoadingModules };
}

/**
 * Mark an install the current user can't make, so the card says why rather than offering it.
 *
 * @param state  - The feature's resolved state.
 * @param access - Whether the current user may install plugins here.
 * @return The state, with the reason on its install control where one applies.
 */
function applyInstallAccess(
	state: FeatureState,
	access: MainFeaturesState[ 'plugin_installs' ]
): FeatureState {
	const { control } = state;

	if ( ! access || access === 'allowed' ) {
		return state;
	}

	if (
		control.kind === 'install-plugin' ||
		( control.kind === 'install-jetpack' && ! control.installed )
	) {
		return { ...state, control: { ...control, blocked: access } };
	}

	return state;
}

/**
 * Show the value a module's switch asked for, until its store catches up.
 *
 * @param state     - The feature's resolved state.
 * @param requested - Switch key to the value asked of it.
 * @return The state, with the asked-for status where one is in flight.
 */
function applyRequestedModule(
	state: FeatureState,
	requested: Record< string, boolean >
): FeatureState {
	if ( state.control.kind !== 'module' ) {
		return state;
	}

	const asked = requested[ moduleSwitchKey( state.control.module.module ) ];

	return asked === undefined
		? state
		: { ...state, isSwitching: true, status: asked ? 'active' : 'inactive' };
}

/**
 * Show the plugin status a switch asked for, before resolving what the card offers.
 *
 * Applied to the feature rather than to the resolved state, because resolving reads the
 * plugin's status. An install never asks for one: it says "Installing…" until it lands.
 *
 * @param feature   - The feature, as the site last reported it.
 * @param requested - Switch key to the value asked of it.
 * @return The feature, with the asked-for plugin status where a request is in flight.
 */
function applyRequestedPlugin(
	feature: MainFeature,
	requested: Record< string, boolean >
): MainFeature {
	const asked = requested[ pluginSwitchKey( feature.plugin ) ];

	return asked === undefined
		? feature
		: { ...feature, plugin_status: asked ? 'active' : 'inactive' };
}
