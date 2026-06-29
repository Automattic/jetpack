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

/**
 * Extends WP_REST_Posts_Controller to disable create, update, and delete operations.
 */
class Order_REST_Controller extends WP_REST_Posts_Controller {

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
