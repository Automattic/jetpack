<?php
/**
 * REST controller for the modernized Backup dashboard.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers REST routes that back the modernized dashboard.
 *
 * Each bridge class declares its routes via `register_routes()` and uses
 * the shared `permission_check()` helper for the `manage_options` gate.
 * Routes only register when the modernization filter is on, so the
 * legacy plugin is byte-identical when the flag is off.
 */
class Rest_Controller {

	/**
	 * Hook entry point. Registers all bridge routes if the modernization
	 * filter is enabled.
	 *
	 * @return void
	 */
	public static function register_routes() {
		if ( ! Jetpack_Backup::is_modernized() ) {
			return;
		}

		Capabilities_Bridge::register_routes();
		Activity_Log_Bridge::register_routes();
		File_Browser_Bridge::register_routes();
		Download_Bridge::register_routes();
		Restore_Bridge::register_routes();
	}

	/**
	 * Permission check shared by every modernized-dashboard route.
	 *
	 * @return bool True when the current user can manage options.
	 */
	public static function permission_check() {
		return current_user_can( 'manage_options' );
	}
}
