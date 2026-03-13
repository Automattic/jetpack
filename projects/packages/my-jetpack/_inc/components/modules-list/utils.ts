import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../../types';

export const JETPACK_MODULES_NOT_FOR_MULTISITE = [ 'waf', 'wordads' ];

/**
 * Check if a module is supported on the current site.
 *
 * @param {MyJetpackModule} $module - The module to check.
 *
 * @return True if the module is supported, false otherwise.
 */
export function getModuleStatus( $module: MyJetpackModule ) {
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
