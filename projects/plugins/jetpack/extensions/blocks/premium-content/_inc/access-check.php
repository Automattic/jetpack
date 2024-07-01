<?php
/**
 * Determine access to premium content.
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/subscription-service/include.php';

/**
 * Determines if the memberships module is set up.
 *
 * @return bool Whether the memberships module is set up.
 */
function membership_checks() {
	// If Jetpack is not yet configured, don't show anything ...
	if ( ! class_exists( '\Jetpack_Memberships' ) ) {
		return false;
	}
	// if stripe not connected don't show anything...
	if ( ! \Jetpack_Memberships::has_connected_account() ) {
		return false;
	}
	return true;
}

/**
 * Determines if the site has a plan that supports the
 * Premium Content block.
 *
 * @return bool
 */
function required_plan_checks() {
	$availability = \Jetpack_Gutenberg::get_cached_availability();
	$slug         = 'premium-content/container';
	return ( isset( $availability[ $slug ] ) && $availability[ $slug ]['available'] );
}

/**
 * Determines if the block should be rendered. Returns true
 * if the block passes all required checks, or if the user is
 * an editor.
 *
 * @return bool Whether the block should be rendered.
 */
function pre_render_checks() {
	return ( current_user_can_edit() || membership_checks() );
}

/**
 * Determines whether the current user can edit.
 *
 * @return bool Whether the user can edit.
 */
function current_user_can_edit() {
	$user = wp_get_current_user();

	return 0 !== $user->ID && current_user_can( 'edit_post', get_the_ID() );
}

/**
 * Determines if the current user can view the protected content of the given block.
 *
 * @param array  $attributes Block attributes.
 * @param object $block Block to check.
 *
 * @return bool Whether the use can view the content.
 */
function current_visitor_can_access( $attributes, $block ) {
	/**
	 * If the current WordPress install has as signed in user
	 * they can see the content.
	 */

	if ( current_user_can_edit() ) {
		return true;
	}

	$selected_plan_ids = array();

	if ( isset( $attributes['selectedPlanIds'] ) ) {
		$selected_plan_ids = $attributes['selectedPlanIds'];
	} elseif ( isset( $attributes['selectedPlanId'] ) ) {
		$selected_plan_ids = array( $attributes['selectedPlanId'] );
	}

	if ( isset( $block ) && ! empty( $block->context['premium-content/planId'] ) ) {
		$selected_plan_ids = array( $block->context['premium-content/planId'] );
	} elseif ( isset( $block ) && ! empty( $block->context['premium-content/planIds'] ) ) {
		$selected_plan_ids = $block->context['premium-content/planIds'];
	}

	if ( empty( $selected_plan_ids ) ) {
		return false;
	}

	$can_view     = false;
	$paywall      = subscription_service();
	$access_level = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS; // Only paid subscribers should be granted access to the premium content
	$tier_ids     = \Jetpack_Memberships::get_all_newsletter_plan_ids();
	$tier_ids     = array_intersect( $tier_ids, $selected_plan_ids );
	if ( ! empty( $tier_ids ) ) {
		// If the selected plan is a tier, we want to check directly if user has a higher "tier".
		// This is to prevent situation where the user upgrades and lose access to premium-gated content

		$subscriptions = array();
		if ( ( new Host() )->is_wpcom_simple() && is_user_logged_in() ) {
			$user_id = wp_get_current_user()->ID;
			/**
			 * Filter the subscriptions attached to a specific user on a given site.
			 *
			 * @since 9.4.0
			 *
			 * @param array $subscriptions Array of subscriptions.
			 * @param int   $user_id The user's ID.
			 * @param int   $site_id ID of the current site.
			 */
			$subscriptions = apply_filters( 'earn_get_user_subscriptions_for_site_id', array(), $user_id, get_current_blog_id() );
			// format the subscriptions so that they can be validated.
			$subscriptions = WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $subscriptions );
		} else {
			$token          = $paywall->get_and_set_token_from_request();
			$payload        = $paywall->decode_token( $token );
			$is_valid_token = ! empty( $payload );

			if ( $is_valid_token ) {
				$subscriptions = (array) $payload['subscriptions'];
			}
		}

		foreach ( $tier_ids as $tier_id ) {
			$can_view = ! $paywall->maybe_gate_access_for_user_if_tier( $tier_id, $subscriptions );
			if ( $can_view ) {
				break;
			}
		}
	}

	$non_tier_ids = array_diff( $selected_plan_ids, $tier_ids );
	if ( ! $can_view ) {
		// For selected plans that are not tiers, we want to check if the user has any of the selected plans.
		$can_view = $paywall->visitor_can_view_content( $non_tier_ids, $access_level );
	}

	if ( $can_view ) {
		/**
		 * Fires when a visitor can view protected content on a site.
		 *
		 * @since 9.4.0
		 */
		do_action( 'jetpack_earn_remove_cache_headers' );
	}

	return $can_view;
}
