import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../../../types';
import type { FeatureState } from './feature-state';

export const JETPACK_MODULES_NOT_FOR_MULTISITE = [ 'backup', 'waf', 'wordads' ];

/**
 * Why a feature forced on or off by the host has no switch.
 *
 * @param {string} override - 'active' when forced on, 'inactive' when forced off.
 * @return The note shown in place of the switch.
 */
export function getOverrideReason( override: 'active' | 'inactive' ) {
	return override === 'active'
		? __( 'Enabled by your host or site administrator', 'jetpack-my-jetpack' )
		: __( 'Disabled by your host or site administrator', 'jetpack-my-jetpack' );
}

/**
 * Check whether the site owner can toggle a module, and why not when they can't.
 *
 * @param {MyJetpackModule} $module - The module to check.
 *
 * @return Whether the module is actionable, with a reason when it isn't.
 */
export function getModuleStatus( $module: MyJetpackModule ) {
	// A toggle for a module forced through `jetpack_active_modules` would only flip back.
	if ( $module.override === 'active' || $module.override === 'inactive' ) {
		return { isAvailable: false, reason: getOverrideReason( $module.override ) };
	}

	// If the module is not supported on multisite, we set the availability to false and provide a reason.
	// Optional: a surface that renders before the page prints its script data would
	// otherwise throw here.
	if ( getScriptData()?.site?.is_multisite ) {
		if ( JETPACK_MODULES_NOT_FOR_MULTISITE.includes( $module.module ) ) {
			return {
				isAvailable: false,
				isMultisiteBlocked: true,
				reason: __( 'Not available on multisite', 'jetpack-my-jetpack' ),
			};
		}
	}

	if ( $module.available === false ) {
		return {
			isAvailable: false,
			reason: $module.unavailable_reason || __( 'Unavailable', 'jetpack-my-jetpack' ),
		};
	}

	return { isAvailable: true };
}

/**
 * Why a feature has no available route on this site.
 *
 * @param state - The feature's live state.
 * @return The unavailable reason, or undefined when a plugin or host provides a route.
 */
export function getFeatureUnavailableReason( state: FeatureState ): string | undefined {
	if ( state.control.kind === 'module' ) {
		return state.control.module.override
			? undefined
			: getModuleStatus( state.control.module ).reason;
	}
	if ( state.feature.plugin && state.feature.plugin_status !== 'not-installed' ) {
		return undefined;
	}
	return state.unavailableReason;
}

/**
 * Whether the feature can run here without changing the host's policy.
 *
 * @param state - The feature's live state.
 * @return Whether it belongs in the Available filter.
 */
export function isFeatureAvailable( state: FeatureState ): boolean {
	const { control } = state;
	return (
		! state.pending &&
		( control.kind !== 'module' || control.module.override !== 'inactive' ) &&
		( control.kind !== 'plugin' || control.override !== 'inactive' ) &&
		! getFeatureUnavailableReason( state )
	);
}
