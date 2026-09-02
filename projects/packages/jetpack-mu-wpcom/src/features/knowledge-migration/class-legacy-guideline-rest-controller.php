<?php
/**
 * REST controller for temporary legacy guideline post types.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Restrict legacy guideline REST access to site administrators.
 */
class Legacy_Guideline_REST_Controller extends \WP_REST_Posts_Controller {
	/**
	 * Check whether the current user can inspect legacy guidelines.
	 *
	 * @return true|\WP_Error
	 */
	private function check_access() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new \WP_Error(
			'rest_cannot_read_legacy_guidelines',
			__( 'Sorry, you are not allowed to view legacy guidelines.', 'jetpack-mu-wpcom' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Check collection read access.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		$access = $this->check_access();
		return is_wp_error( $access ) ? $access : parent::get_items_permissions_check( $request );
	}

	/**
	 * Check single-item read access.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		$access = $this->check_access();
		return is_wp_error( $access ) ? $access : parent::get_item_permissions_check( $request );
	}

	/**
	 * Check create access.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		$access = $this->check_access();
		return is_wp_error( $access ) ? $access : parent::create_item_permissions_check( $request );
	}

	/**
	 * Check update access.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		$access = $this->check_access();
		return is_wp_error( $access ) ? $access : parent::update_item_permissions_check( $request );
	}

	/**
	 * Check delete access.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return true|\WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		$access = $this->check_access();
		return is_wp_error( $access ) ? $access : parent::delete_item_permissions_check( $request );
	}
}
