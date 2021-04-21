<?php
/**
 * List modules v1.2 endpoint.
 *
 *  @package automattic/jetpack
 */

use Automattic\Jetpack\Status;
/**
 * List modules v1.2 endpoint.
 */
class Jetpack_JSON_API_Modules_List_V1_2_Endpoint extends Jetpack_JSON_API_Modules_List_Endpoint {

	/**
	 * Override parent method to set the modules class property.
	 *
	 * @param  string $module The module slug.
	 * @return bool true
	 */
	public function validate_input( $module ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
		$is_offline_mode = ( new Status() )->is_offline_mode();

		$modules = Jetpack_Admin::init()->get_modules();
		foreach ( $modules as $slug => $properties ) {
			if ( $is_offline_mode ) {
				$requires_connection      = isset( $modules[ $slug ]['requires_connection'] ) && $modules[ $slug ]['requires_connection'];
				$requires_user_connection = isset( $modules[ $slug ]['requires_user_connection'] ) && $modules[ $slug ]['requires_user_connection'];
				if (
					$requires_connection || $requires_user_connection
				) {
					$modules[ $slug ]['activated'] = false;
				}
			}
		}

		$modules = Jetpack::get_translated_modules( $modules );

		$this->modules = $modules;

		return true;
	}

	/**
	 * Format a list of modules for public display, using the supplied offset and limit args.
	 *
	 * @uses   WPCOM_JSON_API_Endpoint::query_args()
	 * @return array         Public API modules objects
	 */
	protected function get_modules() {
		$modules = array_values( $this->modules );
		// do offset & limit - we've already returned a 400 error if they're bad numbers.
		$args = $this->query_args();

		if ( isset( $args['offset'] ) ) {
			$modules = array_slice( $modules, (int) $args['offset'] );
		}
		if ( isset( $args['limit'] ) ) {
			$modules = array_slice( $modules, 0, (int) $args['limit'] );
		}

		return $modules;
	}
}
