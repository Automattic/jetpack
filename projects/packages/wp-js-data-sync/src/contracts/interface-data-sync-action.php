<?php
/**
 * Interface for action classes in the data sync system.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync\Contracts;

/**
 * Interface Action_Interface
 */
interface Data_Sync_Action {
	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $data JSON Data passed to the action.
	 * @param \WP_REST_Request $request The request object.
	 * @return mixed
	 */
	public function handle( $data, $request );
}
