<?php
/**
 * Test stub for Connection Manager.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Connection;

/**
 * Minimal stub used by admin-ui unit tests when connection package is unavailable.
 */
class Manager {
	/**
	 * Mimic connection state based on Jetpack options.
	 *
	 * @return bool
	 */
	public function is_connected() {
		$jetpack_options = get_option( 'jetpack_options', array() );
		return ! empty( $jetpack_options['id'] );
	}
}
