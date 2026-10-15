import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../../../types';
import { getActivationStatusLabel } from '../utils';
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
 * Whether the module can run on this site, ignoring any host override: an override only forces the switch on or off, and does not lift the module's own limits, such as multisite.
 *
 * @param $module - The module to check.
 * @return The module's availability, the reason when it is unavailable, and whether multisite blocks it, as if no host override were set.
 */
export function getModuleAvailability( $module: MyJetpackModule ) {
	return getModuleStatus( { ...$module, override: false } );
}

/**
 * Why the feature cannot run on this site, if something stops it, including a missing WordPress.com account.
 *
 * @param state - The feature's live state.
 * @return The reason to show, or undefined when nothing stops the feature, for example when its plugin is installed or its module is available.
 */
export function getFeatureUnavailableReason( state: FeatureState ): string | undefined {
	if ( state.control.kind === 'connect-account' ) {
		return state.unavailableReason;
	}
	if ( state.control.kind === 'module' ) {
		return getModuleAvailability( state.control.module ).reason;
	}
	if ( state.feature.plugin && state.feature.plugin_status !== 'not-installed' ) {
		return undefined;
	}
	return state.unavailableReason;
}

/**
 * The status badge text on the feature card and in its details dialog: Account needed, Unavailable, Active or Inactive.
 *
 * @param state - The feature's live state.
 * @return The status label.
 */
export function getFeatureStatusLabel( state: FeatureState ): string {
	if ( state.control.kind === 'connect-account' ) {
		return __( 'Account needed', 'jetpack-my-jetpack' );
	}
	return getFeatureUnavailableReason( state )
		? __( 'Unavailable', 'jetpack-my-jetpack' )
		: getActivationStatusLabel( state.status === 'active' );
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
		control.kind !== 'connect-account' &&
		( control.kind !== 'install-jetpack' || ! control.blocked ) &&
		( control.kind !== 'install-plugin' ||
			! control.blocked ||
			Boolean( control.runsWithoutPlugin ) ) &&
		( control.kind !== 'module' || control.module.override !== 'inactive' ) &&
		( control.kind !== 'plugin' || control.override !== 'inactive' ) &&
		! getFeatureUnavailableReason( state )
	);
}
