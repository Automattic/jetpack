<?php
/**
 * Payment confirmation endpoint — PROTOTYPE.
 *
 * In production this route takes what the WPCOM checkout iframe posted back
 * (an ownership ID, an order ID) and verifies it server-to-server against
 * WPCOM before flipping the response to paid.
 *
 * In the prototype there is nothing to verify against, so the route trusts the
 * signed order token and a simulated outcome. The token still does real work:
 * it proves the amount was set by the server, binds the payment to one entry,
 * and cannot be replayed, because Payment_Status::mark_paid() refuses any
 * entry that is not awaiting payment.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Payments;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * REST routes for confirming a payment.
 */
class Payment_Endpoint {

	/**
	 * REST namespace. `wpcom/v2` because Simple sites do not serve custom
	 * site-specific namespaces — see the design doc.
	 *
	 * @var string
	 */
	const NAMESPACE_V2 = 'wpcom/v2';

	/**
	 * REST base.
	 *
	 * @var string
	 */
	const REST_BASE = 'jetpack-forms/payments';

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_V2,
			self::REST_BASE . '/confirm',
			array(
				'methods'  => WP_REST_Server::CREATABLE,
				'callback' => array( __CLASS__, 'confirm' ),
				// Buyers are anonymous by design — a form payment must not
				// require a login. The signed, single-use, entry-bound order
				// token is the authorization, not the current user.
				'permission_callback' => '__return_true',
				'args'                => array(
					'order_token' => array(
						'type'     => 'string',
						'required' => true,
					),
					'outcome'     => array(
						'type'     => 'string',
						'enum'     => array( 'success', 'failure' ),
						'default'  => 'success',
						'required' => false,
					),
				),
			)
		);
	}

	/**
	 * Confirm (or fail) a payment.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array|WP_Error
	 */
	public static function confirm( WP_REST_Request $request ) {
		$payload = Order::verify( (string) $request->get_param( 'order_token' ) );

		if ( is_wp_error( $payload ) ) {
			$payload->add_data( array( 'status' => 400 ) );

			return $payload;
		}

		$entry_id = (int) $payload['entry_id'];
		$record   = Payment_Status::get( $entry_id );

		if ( ! $record ) {
			return new WP_Error(
				'order_not_found',
				__( 'No pending payment was found for this order.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		if ( 'awaiting' !== $record['status'] ) {
			// Already resolved. Report the resting state rather than erroring —
			// a double-submit should be a no-op, not a failure.
			return array(
				'status'   => $record['status'],
				'amount'   => $record['amount'],
				'currency' => $record['currency'],
				'replayed' => true,
			);
		}

		// The amount is taken from the token, never from the request body. This
		// is the whole point of signing it.
		if ( (int) $payload['amount'] !== (int) $record['amount'] ) {
			Payment_Status::mark_failed( $entry_id );

			return new WP_Error(
				'order_amount_mismatch',
				__( 'The payment amount did not match the order.', 'jetpack-forms' ),
				array( 'status' => 409 )
			);
		}

		if ( 'failure' === $request->get_param( 'outcome' ) ) {
			Payment_Status::mark_failed( $entry_id );

			return array(
				'status'   => 'failed',
				'amount'   => $record['amount'],
				'currency' => $record['currency'],
			);
		}

		// PROTOTYPE: production takes this identifier from the WPCOM checkout
		// result (order_id / product_ownership_id) after verifying it upstream.
		$order_id = 'sim_' . wp_generate_password( 12, false, false );

		Payment_Status::mark_paid( $entry_id, $order_id );

		return array(
			'status'   => 'paid',
			'orderId'  => $order_id,
			'amount'   => $record['amount'],
			'currency' => $record['currency'],
			// Never true in the prototype: no processor confirmed anything.
			'verified' => false,
		);
	}
}
