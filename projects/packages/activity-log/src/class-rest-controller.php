<?php
/**
 * The Activity Log REST Controller.
 *
 * Registers the `/jetpack/v4/activity-log/*` routes that back the admin
 * UI. Phase 0 reserves the namespace; concrete endpoints land in Phase 2.
 *
 * @package automattic/jetpack-activity-log
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Activity_Log\V0001;

use function current_user_can;

/**
 * REST routes for the Activity Log UI.
 */
class REST_Controller {

	/**
	 * REST namespace used by this package.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * Register the Activity Log REST routes.
	 *
	 * Hooked on `rest_api_init` by {@see Jetpack_Activity_Log::initialize()}.
	 */
	public static function register_rest_routes() {
		// Routes land in Phase 2:
		// - GET    /jetpack/v4/activity-log           list with filters + pagination
		// - GET    /jetpack/v4/activity-log/counts    counts per group for filter UI
		// - GET    /jetpack/v4/activity-log/{id}      single event lookup
	}

	/**
	 * Permission callback for Activity Log endpoints.
	 *
	 * @return bool
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}
}
