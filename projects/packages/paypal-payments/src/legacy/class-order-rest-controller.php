<?php
/**
 * Read-only REST controller for jp_pay_order.
 *
 * Orders should only be created through the internal payment processing flow,
 * not directly via the REST API.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\Paypal_Payments;

use WP_Error;
use WP_REST_Posts_Controller;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Extends WP_REST_Posts_Controller to restrict reads and disable create, update, and delete operations.
 */
class Order_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Require the capability to read private posts before listing orders.
	 *
	 * Orders hold buyer details, so reading them requires an explicit capability.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! $this->current_user_can_read_orders() ) {
			return new WP_Error(
				'rest_cannot_view',
				__( 'Sorry, you are not allowed to view orders.', 'jetpack-paypal-payments' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Gate every single-order read, and every order the collection route would return.
	 *
	 * @param \WP_Post $post Post object.
	 * @return bool
	 */
	public function check_read_permission( $post ) {
		return $this->current_user_can_read_orders() && parent::check_read_permission( $post );
	}

	/**
	 * Whether the current user may read orders.
	 *
	 * @return bool
	 */
	private function current_user_can_read_orders() {
		$post_type = get_post_type_object( $this->post_type );

		return $post_type !== null && current_user_can( $post_type->cap->read_private_posts );
	}

	/**
	 * Deny order creation via the REST API.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return WP_Error
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return new WP_Error(
			'rest_cannot_create',
			__( 'Orders can only be created through the payment processing flow.', 'jetpack-paypal-payments' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * Deny order updates via the REST API.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return WP_Error
	 */
	public function update_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return new WP_Error(
			'rest_cannot_update',
			__( 'Orders cannot be modified via the REST API.', 'jetpack-paypal-payments' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * Deny order deletion via the REST API.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return WP_Error
	 */
	public function delete_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return new WP_Error(
			'rest_cannot_delete',
			__( 'Orders cannot be deleted via the REST API.', 'jetpack-paypal-payments' ),
			array( 'status' => 403 )
		);
	}
}
