<?php
/**
 * Test doubles for the premium-content block gate and paywall, which live in plugins/jetpack.
 *
 * The entitlement APIs record the requested plans and grant only subscriptions held by the visitor.
 * Editorial APIs keep their edit_post grant so tests can tell the two apart.
 * Tier expansion is covered by the Jetpack plugin tests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

if ( ! function_exists( __NAMESPACE__ . '\\visitor_has_subscription_access_to_plan_ids' ) ) {
	/**
	 * Record the block gate's arguments and stand in for its verdict.
	 *
	 * @param array    $selected_plan_ids Plan ids the content is gated behind.
	 * @param int|null $post_id           Post the gated content belongs to.
	 * @return bool
	 */
	function visitor_has_subscription_access_to_plan_ids( $selected_plan_ids, $post_id = null ) {
		$GLOBALS['__vp_block_gate_received'] = array(
			'plan_ids' => $selected_plan_ids,
			'post_id'  => $post_id,
		);

		return subscription_service()->visitor_has_subscription_access( $selected_plan_ids, 'paid_subscribers', $post_id );
	}
}

if ( ! function_exists( __NAMESPACE__ . '\\visitor_can_access_plan_ids' ) ) {
	/**
	 * Keep the editorial API distinct from the entitlement one.
	 *
	 * @param array    $selected_plan_ids Required plans.
	 * @param int|null $post_id           Embedding post ID.
	 * @return bool
	 */
	function visitor_can_access_plan_ids( $selected_plan_ids, $post_id = null ) {
		return current_user_can( 'edit_post', $post_id )
			|| visitor_has_subscription_access_to_plan_ids( $selected_plan_ids, $post_id );
	}
}

if ( ! function_exists( __NAMESPACE__ . '\\subscription_service' ) ) {
	/**
	 * Return a recording paywall test double.
	 *
	 * @return object
	 */
	function subscription_service() {
		return new class() {
			/**
			 * Preserve editorial preview behavior separately from subscription entitlement.
			 *
			 * @param array    $valid_plan_ids Plan ids the gate requires.
			 * @param string   $access_level   Requested access level.
			 * @param int|null $post_id        Post id the gate is checking.
			 * @return bool
			 */
			public function visitor_can_view_content( $valid_plan_ids, $access_level, $post_id = null ) {
				return current_user_can( 'edit_post', $post_id )
					|| $this->visitor_has_subscription_access( $valid_plan_ids, $access_level, $post_id );
			}

			/**
			 * Record the entitlement check without granting editorial access.
			 *
			 * @param array    $valid_plan_ids Required plans.
			 * @param string   $access_level   Requested access level.
			 * @param int|null $post_id        Embedding post ID.
			 * @return bool
			 */
			public function visitor_has_subscription_access( $valid_plan_ids, $access_level, $post_id = null ) {
				$GLOBALS['__vp_paywall_received'] = array(
					'plan_ids'     => $valid_plan_ids,
					'access_level' => $access_level,
					'post_id'      => $post_id,
				);

				$held = isset( $GLOBALS['__vp_paywall_held_plans'] ) ? (array) $GLOBALS['__vp_paywall_held_plans'] : array();
				return (bool) array_intersect( (array) $valid_plan_ids, $held );
			}
		};
	}
}
