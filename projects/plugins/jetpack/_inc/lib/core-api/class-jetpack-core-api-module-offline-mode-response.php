<?php
/**
 * Helper for Offline Mode module response state.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Helper for Offline Mode module response state.
 */
class Jetpack_Core_API_Module_Offline_Mode_Response {

	/**
	 * Check whether the module response should hide active state while Offline Mode is active.
	 *
	 * @param string $module      Module slug.
	 * @param array  $module_data Module metadata.
	 * @return bool
	 */
	public static function should_mark_inactive( $module, $module_data ) {
		if (
			empty( $module_data['requires_connection'] )
			|| ! ( new Status() )->is_offline_mode()
		) {
			return false;
		}

		/** This filter is documented in class.jetpack.php. */
		$allow_offline_loading = (bool) apply_filters(
			'jetpack_offline_mode_allow_module_loading',
			false,
			$module,
			$module_data
		);

		return ! $allow_offline_loading;
	}
}
