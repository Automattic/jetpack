import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../../../types';
import { getActivationStatusLabel } from '../utils';
import { isAccountConnectEnabled } from './mappings';
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
	if ( state.accountNeeded ) {
		return __( 'Requires a connected WordPress.com account', 'jetpack-my-jetpack' );
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
 * The status badge text on the feature card and in its details dialog: Unavailable, Active or Inactive.
 *
 * With the account-connect flag on, Active and Inactive show only once loaded and only where no switch
 * shows the state: a control of kind `none`, such as Jetpack AI while its switch is gated, or a card whose
 * control is only a link, such as Manage in Protect. Nothing shows while an account is needed.
 *
 * @param state         - The feature's live state.
 * @param controlIsLink - Whether the card's control is only a link, which cannot say whether the feature is on.
 * @return The status label, or null when the feature's own control already says it.
 */
export function getFeatureStatusLabel( state: FeatureState, controlIsLink = false ): string | null {
	// Only set with the account-connect flag on. Connect or Install says what is missing;
	// see `needsAccountWithoutConnect()` for a feature with neither.
	if ( state.accountNeeded ) {
		return null;
	}
	if ( getFeatureUnavailableReason( state ) ) {
		return __( 'Unavailable', 'jetpack-my-jetpack' );
	}
	if (
		isAccountConnectEnabled() &&
		( state.pending || ( state.control.kind !== 'none' && ! controlIsLink ) )
	) {
		return null;
	}
	return getActivationStatusLabel( state.status === 'active' );
}

/**
 * Whether the feature can run here without changing the host's policy.
 *
 * @param state - The feature's live state.
 * @return Whether it belongs in the Available filter.
 */
export function isFeatureAvailable( state: FeatureState ): boolean {
	const { control } = state;
	// With the account-connect flag off, Available still lists installs the user cannot make.
	const skipsBlockedInstalls = isAccountConnectEnabled();
	return (
		! state.pending &&
		( ! skipsBlockedInstalls || control.kind !== 'install-jetpack' || ! control.blocked ) &&
		( ! skipsBlockedInstalls ||
			control.kind !== 'install-plugin' ||
			! control.blocked ||
			Boolean( control.runsWithoutPlugin ) ) &&
		( control.kind !== 'module' || control.module.override !== 'inactive' ) &&
		( control.kind !== 'plugin' || control.override !== 'inactive' ) &&
		! getFeatureUnavailableReason( state )
	);
}
