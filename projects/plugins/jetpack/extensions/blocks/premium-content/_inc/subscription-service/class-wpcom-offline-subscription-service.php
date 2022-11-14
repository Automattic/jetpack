<?php
/**
 * This subscription service is used when a subscriber is offline and a token is not available.
 * This subscription service will be used when rendering content in email and reader on WPCOM only.
 * When content is being rendered, the current user and site are set.
 * This allows us to lookup a users subscriptions and determine if the
 * offline visitor can view content that has been deemed "Premium content".
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service;

/**
 * Class WPCOM_Offline_Subscription_Service
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service
 */
class WPCOM_Offline_Subscription_Service extends WPCOM_Token_Subscription_Service {

	/**
	 * Is available()
	 *
	 * @return bool
	 */
	public static function available() {
		// Return available if the user is logged in and either
		// running a job (sending email subscription) OR
		// handling API request on WPCOM (reader).
		return (
			( defined( 'WPCOM_JOBS' ) && WPCOM_JOBS ) ||
			( defined( 'IS_WPCOM' ) && IS_WPCOM === true && ( defined( 'REST_API_REQUEST' ) && REST_API_REQUEST ) )
			) && is_user_logged_in();
	}

	/**
	 * Lookup users subscriptions for a site and determine if the user has a valid subscription to match the plan ID
	 *
	 * @param array  $valid_plan_ids .
	 * @param string $access_level .
	 *
	 * @return bool
	 */
	public function visitor_can_view_content( $valid_plan_ids, $access_level ) {

		/** This filter is already documented in projects/plugins/jetpack/extensions/blocks/premium-content/_inc/subscription-service/class-token-subscription-service.php */
		$subscriptions = apply_filters( 'earn_get_user_subscriptions_for_site_id', array(), wp_get_current_user()->ID, get_current_blog_id() );
		if ( empty( $subscriptions ) ) {
			return false;
		}
		// format the subscriptions so that they can be validated.
		$subscriptions = self::abbreviate_subscriptions( $subscriptions );
		return $this->validate_subscriptions( $valid_plan_ids, $subscriptions );
	}

	/**
	 * Check if the subscriber can receive the newsletter
	 *
	 * @param int $user_id User id.
	 * @param int $blog_id Blog id.
	 * @param int $post_id Post id.
	 *
	 * @return bool
	 * @throws \Exception Throws an exception when used outside of WPCOM.
	 */
	public static function subscriber_can_receive_post_by_mail( $user_id, $blog_id, $post_id ) {
		switch_to_blog( $blog_id );

		$previous_user = wp_get_current_user();
		wp_set_current_user( $user_id );

		$access_level       = get_post_meta( $post_id, '_jetpack_newsletter_access', true );
		$valid_plan_ids     = \Jetpack_Memberships::get_all_plans_id_jetpack_recurring_payments();
		$is_paid_subscriber = static::visitor_can_view_content( $valid_plan_ids, $access_level );

		// All the users here are subscribers
		$allowed = static::user_has_access( $access_level, true, $is_paid_subscriber );

		wp_set_current_user( $previous_user );
		restore_current_blog();

		return $allowed;
	}

	/**
	 * Report the subscriptions as an ID => [ 'end_date' => ]. mapping
	 *
	 * @param array $subscriptions_from_bd .
	 *
	 * @return array<int, array>
	 */
	public static function abbreviate_subscriptions( $subscriptions_from_bd ) {
		$subscriptions = array();
		foreach ( $subscriptions_from_bd as $subscription ) {
			// We are picking the expiry date that is the most in the future.
			if (
				'active' === $subscription['status'] && (
					! isset( $subscriptions[ $subscription['product_id'] ] ) ||
					empty( $subscription['end_date'] ) || // Special condition when subscription has no expiry date - we will default to a year from now for the purposes of the token.
					strtotime( $subscription['end_date'] ) > strtotime( (string) $subscriptions[ $subscription['product_id'] ]->end_date )
				)
			) {
				$subscriptions[ $subscription['product_id'] ]           = new \stdClass();
				$subscriptions[ $subscription['product_id'] ]->end_date = empty( $subscription['end_date'] ) ? ( time() + 365 * 24 * 3600 ) : $subscription['end_date'];
			}
		}
		return $subscriptions;
	}

}
