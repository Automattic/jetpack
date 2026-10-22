import CONNECTION_STORE from '@automattic/jetpack-connection/state/store-id';
import useConnectionErrorNotice from '@automattic/jetpack-connection/use-connection-error-notice';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';
import { useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import {
	moduleSwitchKey,
	pluginSwitchKey,
	useRequestedSwitches,
} from '../../../data/requested-switch-state';
import { getOfflineFeaturesSeed, isOfflineFeatures } from '../../../data/utils/offline-features';
import { linksTo } from '../../../utils/admin-menu-sync';
import {
	getProductModules,
	isAccountConnectEnabled,
	isAiToggleWaitingForAccount,
	PRODUCT_MODULES,
} from './mappings';
import {
	getFeatureUnavailableReason,
	getModuleAvailability,
	getModuleStatus,
	getOverrideReason,
} from './module-availability';
import { useAllJetpackModules } from './use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../data/types';
import type { JetpackModuleSlug, MyJetpackModule } from '../../../types';

// A running product reports these rather than `active` once its plan needs attention or nears expiry.
export const RUNNING_ON_PLAN_STATUSES: string[] = [
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
	// The plan decides it, whichever plugin delivers it: the card sells or renews the plan instead.
	// `activatePlugin` names the installed plugin that is off, for a site that pays already.
	| { kind: 'plan'; activatePlugin?: string }
	| { kind: 'plugin'; plugin: string; override?: 'active' | 'inactive' }
	| { kind: 'install-plugin'; plugin: string; runsWithoutPlugin?: true; blocked?: InstallBlock }
	| { kind: 'install-jetpack'; installed: boolean; blocked?: InstallBlock }
	| { kind: 'none'; override?: 'active' | 'inactive' };

type ConnectionStore = {
	getConnectionStatus?: () => {
		isRegistered: boolean;
		hasConnectedOwner: boolean;
		isUserConnected?: boolean;
	};
	getIsOfflineMode?: () => boolean;
};

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
	// the wp-admin sidebar asks the same question, and the two have to agree. A plan-driven
	// module is the exception: this says whether the plan runs it, and its menu can outlast the plan.
	status: 'active' | 'inactive';
	// The feature needs an account the site does not have: Connect, or Install for a missing plugin, starts one.
	accountNeeded?: boolean;
	control: FeatureControl;
	// The product behind the feature, for the modal's copy.
	product?: ProductCamelCase;
	unavailableReason?: string;
	moduleUnavailableReason?: string;
};

/**
 * The Open link, or empty when the feature is unavailable or its offline page isn't registered.
 *
 * @param state - The feature state.
 * @return A management URL, or an empty string.
 */
export function getFeatureManageUrl( state: FeatureState ): string {
	if ( getFeatureUnavailableReason( state ) ) {
		return '';
	}

	const url = state.feature.manage_url || '';
	if ( ! isOfflineFeatures() || ! url ) {
		return url;
	}

	const page = getQueryArg( url, 'page' );
	const registered =
		! page ||
		getOfflineFeaturesSeed()?.mainFeatures.available_admin_pages?.includes( String( page ) );
	const inSidebar = Array.from( document.querySelectorAll( '#adminmenu li' ) ).some( item =>
		linksTo( item, url )
	);
	return registered || inSidebar ? url : '';
}

/**
 * The module's limitation when the standalone plugin remains available.
 *
 * @param state - The feature's live state.
 * @return The inline note, or undefined.
 */
export function getModuleUnavailableNote( state: FeatureState ): string | undefined {
	return state.moduleUnavailableReason
		? sprintf(
				/* translators: %s is why the Jetpack module is unavailable; its standalone plugin remains available. */
				__( 'Jetpack module: %s', 'jetpack-my-jetpack' ),
				state.moduleUnavailableReason
			)
		: undefined;
}

/**
 * Why a feature can't be switched here: a host forced its module or plugin on or off, or
 * the site cannot run the module at all, as with the ones unavailable on multisite.
 *
 * @param state - The feature's live state.
 * @return The reason, or null when it can be switched.
 */
export function getForcedReason( state: FeatureState ): string | null {
	const { control } = state;

	// Off without the plan is a sale, which Upgrade offers; off with it has no Upgrade, so it says why.
	if ( control.kind === 'plan' ) {
		if ( state.status === 'active' ) {
			return __( 'Included in your plan', 'jetpack-my-jetpack' );
		}

		if ( isPlanExpired( state ) ) {
			return __( 'Your plan expired', 'jetpack-my-jetpack' );
		}

		return state.feature.included
			? __( 'Included in your plan, but not running', 'jetpack-my-jetpack' )
			: null;
	}

	if ( control.kind === 'module' ) {
		const status = getModuleStatus( control.module );

		if ( control.module.override || ! status.isAvailable ) {
			return status.reason ?? null;
		}
	}

	if ( ( control.kind === 'plugin' || control.kind === 'none' ) && control.override ) {
		return getOverrideReason( control.override );
	}

	return state.unavailableReason ?? null;
}

/**
 * Whether the plan behind a plan-driven feature has expired, which Renew offers to resume.
 *
 * @param state - The feature's live state.
 * @return True when the plan expired.
 */
export function isPlanExpired( state: FeatureState ): boolean {
	return state.control.kind === 'plan' && state.product?.status === PRODUCT_STATUSES.EXPIRED;
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
		! control.blocked ||
		// Already running on the plan, so there is nothing to ask anyone to install.
		( control.kind === 'install-plugin' && control.runsWithoutPlugin )
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
 * @param needsAccount   - Whether the site has no connected owner and the current admin is not linked.
 * @return The feature's state.
 */
export function resolveFeatureState(
	feature: MainFeature,
	jetpack: MainFeaturePluginStatus,
	product: ProductCamelCase | undefined,
	modules: Record< string, MyJetpackModule > | undefined,
	productModules: Record< string, string >,
	modulesLoading = false,
	needsAccount = false
): FeatureState {
	// Wait for the module list: without it, a feature Jetpack already runs would offer a plugin
	// install, and the account check cannot see host overrides or multisite blocks.
	if ( feature.in_jetpack && jetpack === 'active' && modulesLoading ) {
		return { feature, product, pending: true, status: 'inactive', control: { kind: 'none' } };
	}

	const moduleSlug = getFeatureModuleSlug( feature, productModules );
	const $module =
		moduleSlug && jetpack === 'active' ? modules?.[ moduleSlug as JetpackModuleSlug ] : undefined;

	// The AI gate hides the switch, not the reason the module cannot run.
	const ungatedSlug = PRODUCT_MODULES[ feature.product as keyof typeof PRODUCT_MODULES ];
	const gatedModule =
		jetpack === 'active' && ungatedSlug && ! productModules[ feature.product ]
			? modules?.[ ungatedSlug ]
			: undefined;
	const accountModule = $module || gatedModule;
	const connectionCanHelp =
		feature.plugin_override !== 'inactive' &&
		( ! accountModule ||
			( accountModule.override !== 'inactive' &&
				! getModuleAvailability( accountModule ).isMultisiteBlocked ) );
	const needsAccountHere =
		needsAccount &&
		connectionCanHelp &&
		Boolean(
			feature.needs_account ||
			$module?.requires_user_connection ||
			gatedModule?.requires_user_connection
		);
	// The AI pre-release gate hides its switch; when the account is all AI lacks, the card offers Connect past the gate.
	const aiWaitsForAccount =
		feature.product === 'jetpack-ai' && needsAccountHere && isAiToggleWaitingForAccount();
	const resolved =
		aiWaitsForAccount && gatedModule
			? resolveMechanism( feature, jetpack, product, gatedModule, undefined )
			: resolveMechanism( feature, jetpack, product, $module, gatedModule );

	return needsAccountHere ? withAccountNeeded( resolved, accountModule ) : resolved;
}

/**
 * Pick what switches the feature: its Jetpack module, its standalone plugin, or Jetpack itself.
 *
 * @param feature     - The feature, from the map-backed catalog.
 * @param jetpack     - The Jetpack plugin's status.
 * @param product     - The product behind the feature, if any.
 * @param $module     - The feature's Jetpack module, if Jetpack is active.
 * @param gatedModule - The module behind a product whose switch is still behind a pre-release gate.
 * @return The feature's state.
 */
function resolveMechanism(
	feature: MainFeature,
	jetpack: MainFeaturePluginStatus,
	product: ProductCamelCase | undefined,
	$module: MyJetpackModule | undefined,
	gatedModule: MyJetpackModule | undefined
): FeatureState {
	if ( gatedModule?.available === false ) {
		return {
			feature,
			product,
			status: 'inactive',
			control: { kind: 'none', override: gatedModule.override || undefined },
			unavailableReason: getModuleAvailability( gatedModule ).reason,
		};
	}

	// Delivered by Jetpack or the installed standalone plugin. A host forcing the module only
	// flips a switch the plan ignores, so only multisite or a missing module explain themselves below.
	const deliversPlan = $module
		? ! getModuleStatus( { ...$module, override: false } ).reason
		: feature.plugin_status !== 'not-installed' && feature.plugin_override !== 'inactive';
	// Offline Features mode never loads products, so the plugin's own switch stands in.
	if ( feature.plan_driven && deliversPlan && ( product || ! isOfflineFeatures() ) ) {
		return {
			feature,
			product,
			// Until the product arrives there is no plan to read.
			pending: ! product,
			status:
				product?.hasPaidPlanForProduct && RUNNING_ON_PLAN_STATUSES.includes( product.status )
					? 'active'
					: 'inactive',
			control: {
				kind: 'plan',
				...( ! $module &&
					feature.plugin_status === 'inactive' && { activatePlugin: feature.plugin } ),
			},
		};
	}

	if ( feature.in_jetpack && jetpack === 'active' ) {
		const moduleStatus = $module && getModuleStatus( $module );
		// A host's override decides the module whatever the plan, so it explains itself
		// rather than falling through to the standalone plugin.
		if (
			$module &&
			( moduleStatus?.isAvailable ||
				moduleStatus?.isMultisiteBlocked ||
				$module.override ||
				! feature.plugin )
		) {
			return {
				feature,
				product,
				status:
					( moduleStatus?.isAvailable || $module.override ) && $module.activated
						? 'active'
						: 'inactive',
				control: { kind: 'module', module: $module },
			};
		}
	}

	if ( feature.plugin ) {
		// Read for status even where a plugin is the switch: the wp-admin sidebar counts a
		// Hybrid product as on when either its plugin or its module is, and a card that
		// disagreed with the sidebar would be wrong on any Jetpack site running the module.
		const moduleStatus = $module && getModuleStatus( $module );
		const moduleIsOn = Boolean( moduleStatus?.isAvailable && $module?.activated );
		const moduleUnavailableReason = $module && getModuleAvailability( $module ).reason;

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
				moduleUnavailableReason,
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
			moduleUnavailableReason,
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
	const needsAccount = useFeaturesNeedsAccount();

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
						isLoadingModules,
						needsAccount
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
		[ state, products, modules, isLoadingModules, requested, needsAccount ]
	);

	return { states, isLoading: isLoadingModules };
}

/**
 * Whether the registered site is waiting for its owner's account, with the current user unlinked too.
 *
 * @return Whether account-dependent features need a connection action.
 */
export function useFeaturesNeedsAccount(): boolean {
	const off = isOfflineFeatures() || ! isAccountConnectEnabled();
	// A broken connection gets Repair in the header and Overview; a new account could not fix it.
	const { hasConnectionError } = useConnectionErrorNotice();
	const waiting = useSelect(
		select => {
			if ( off ) {
				return false;
			}
			// Read the connection store directly: useMyJetpackConnection needs page data that the offline Features page does not load.
			const store = select( CONNECTION_STORE ) as unknown as ConnectionStore;
			const connection = store?.getConnectionStatus?.();
			// A linked admin on a site whose owner left already has an account, so Connect would only loop.
			return Boolean(
				connection?.isRegistered &&
				connection.hasConnectedOwner === false &&
				! connection.isUserConnected &&
				! store.getIsOfflineMode?.()
			);
		},
		[ off ]
	);

	return waiting && ! hasConnectionError;
}

/**
 * Whether the current admin's WordPress.com account is connected and the site has an owner.
 *
 * @return Whether features waiting for an account can now be turned on.
 */
export function useAccountConnected(): boolean {
	return useSelect( select => {
		const connection = (
			select( CONNECTION_STORE ) as unknown as ConnectionStore
		 )?.getConnectionStatus?.();
		return Boolean( connection?.isUserConnected && connection.hasConnectedOwner );
	}, [] );
}

/**
 * Whether the card offers Connect for a module, installed plugin or plan-driven feature waiting for an account.
 *
 * A missing plugin keeps Install, which connects once the plugin is on.
 *
 * @param state - Live state for the feature.
 * @return Whether Connect is the feature's action.
 */
export function offersConnect( state: FeatureState ): boolean {
	return Boolean(
		state.accountNeeded && [ 'module', 'plugin', 'plan' ].includes( state.control.kind )
	);
}

/**
 * Whether a feature waits for an account with no control on its card, as Jetpack AI does while its
 * switch is gated or an install the user can't make, so its card and details say so in words instead.
 *
 * @param state - Live state for the feature.
 * @return Whether only a note can say the account is missing.
 */
export function needsAccountWithoutConnect( state: FeatureState ): boolean {
	return Boolean(
		state.accountNeeded && ( state.control.kind === 'none' || getInstallBlockReason( state ) )
	);
}

/**
 * Mark a feature that waits for an account, which Available and bulk actions then leave out.
 *
 * Jetpack reports a module needing an account as unavailable on a site without one; the card
 * offers Connect instead, and one saved as on can still be switched off from its details.
 *
 * @param state         - The feature's resolved state.
 * @param accountModule - The module behind it, if Jetpack is active.
 * @return The state, marked as waiting for an account.
 */
export function withAccountNeeded(
	state: FeatureState,
	accountModule?: MyJetpackModule
): FeatureState {
	const accountOnly = Boolean(
		accountModule?.requires_user_connection && accountModule.available === false
	);
	const { control } = state;
	const marked: FeatureState = {
		...state,
		accountNeeded: true,
		...( accountOnly && { unavailableReason: undefined, moduleUnavailableReason: undefined } ),
	};

	if ( control.kind !== 'module' || ! control.module.requires_user_connection ) {
		return marked;
	}

	return {
		...marked,
		status: control.module.activated ? 'active' : 'inactive',
		control: {
			kind: 'module',
			module: { ...control.module, available: true, unavailable_reason: false },
		},
	};
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
