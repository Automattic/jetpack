<?php
/**
 * This class hooks the main sync actions.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Actions;

/**
 * Jetpack Sync main class.
 */
class Main {
	/**
	 * Initialize the main sync actions.
	 */
	public static function init() {
		// We need to define this here so that it's hooked before `updating_jetpack_version` is called.
		add_action( 'updating_jetpack_version', array( 'Automattic\\Jetpack\\Sync\\Actions', 'cleanup_on_upgrade' ), 10, 2 );
		add_action( 'jetpack_user_authorized', array( 'Automattic\\Jetpack\\Sync\\Actions', 'do_initial_sync' ), 10, 0 );
	}
}
