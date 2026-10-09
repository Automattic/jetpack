<?php
/**
 * The environment does not have a subscription service available.
 * This represents this scenario.
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service;

use function site_url;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable

/**
 * Class Unconfigured_Subscription_Service
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service
 */
class Unconfigured_Subscription_Service implements Subscription_Service {

	/**
	 * Is always available because it is the fallback.
	 *
	 * @inheritDoc
	 */
	public static function available() {
		return true;
	}

	/**
	 * Function: initialize()
	 *
	 * @inheritDoc
	 */
	public function initialize() {
		// noop.
	}

	/**
	 * No subscription service available, no users can see this content.
	 *
	 * @param array    $valid_plan_ids .
	 * @param string   $access_level   .
	 * @param int|null $post_id Unused; accepted for callers that pass a post id.
	 */
	public function visitor_can_view_content( $valid_plan_ids, $access_level, $post_id = null ) {
		return false;
	}

	/**
	 * An unconfigured service cannot establish subscription entitlement.
	 *
	 * @since $$next-version$$
	 *
	 * @param array    $valid_plan_ids Required subscription plan IDs.
	 * @param string   $access_level   Required access level.
	 * @param int|null $post_id        Post to check.
	 * @return bool Always false.
	 */
	public function visitor_has_subscription_access( $valid_plan_ids, $access_level, $post_id = null ) {
		return false;
	}

	/**
	 * is the current user a pending subscriber for the current site?
	 *
	 * @return bool
	 */
	public function is_current_user_pending_subscriber(): bool
	{
		return false;
	}

	/**
	 * The current visitor would like to obtain access. Where do they go?
	 *
	 * @param string $mode .
	 */
	public function access_url( $mode = 'subscribe' ) {
		return site_url();
	}

}
// phpcs:enable
