import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../../types';

export const JETPACK_MODULES_NOT_FOR_MULTISITE = [ 'waf', 'wordads' ];

/**
 * Check whether the site owner can toggle a module, and why not when they can't.
 *
 * @param {MyJetpackModule} $module - The module to check.
 *
 * @return Whether the module is actionable, with a reason when it isn't.
 */
export function getModuleStatus( $module: MyJetpackModule ) {
	// A toggle for a module forced through `jetpack_active_modules` would only flip back.
	if ( $module.override === 'active' ) {
		return {
			isAvailable: false,
			reason: __( 'Enabled by your host or site administrator', 'jetpack-my-jetpack' ),
		};
	}

	if ( $module.override === 'inactive' ) {
		return {
			isAvailable: false,
			reason: __( 'Disabled by your host or site administrator', 'jetpack-my-jetpack' ),
		};
	}

	// If the module is not supported on multisite, we set the availability to false and provide a reason.
	if ( getScriptData().site.is_multisite ) {
		if ( JETPACK_MODULES_NOT_FOR_MULTISITE.includes( $module.module ) ) {
			return {
				isAvailable: false,
				reason: __( 'Not available on multisite', 'jetpack-my-jetpack' ),
			};
		}
	}

	return { isAvailable: true };
}
