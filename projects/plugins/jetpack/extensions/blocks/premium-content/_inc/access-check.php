<?php
/**
 * Determine access to premium content.
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;

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
 * Mint and persist a fresh premium-content session cookie for the current visitor.
 *
 * When the WPCOM Memberships filter returns authoritative subscriptions for a logged-in
 * visitor but no JWT cookie is present (e.g. the previous one expired or was cleared),
 * we wrap those subscriptions in a JWT signed with the site's Jetpack blog token and
 * persist it as the standard `wp-jp-premium-content-session` cookie. Subsequent requests
 * within the cookie TTL take the fast cached path instead of the WPCOM round-trip.
 *
 * Returns the minted JWT so callers can act on it; returns null when no token should be
 * minted because there are no subscriptions, a valid cookie already exists, or the
 * signing key is unavailable. The cookie itself is set on a best-effort basis: if headers
 * have already been sent, the token is still returned so the caller can decide what to do.
 *
 * @param object $paywall                  Subscription service (provides the signing key).
 * @param int    $user_id                  WordPress.com user id the subscriptions belong to.
 * @param array  $raw_subscriptions        Subscriptions as returned by the filter.
 * @param array  $abbreviated_subscriptions Subscriptions after `abbreviate_subscriptions()`.
 * @return string|null The encoded JWT, or null when no cookie was minted.
 */
function maybe_renew_session_cookie( $paywall, $user_id, $raw_subscriptions, $abbreviated_subscriptions ) {
	if ( empty( $abbreviated_subscriptions ) ) {
		return null;
	}
	if ( Abstract_Token_Subscription_Service::has_token_from_cookie() ) {
		$session_cookie_name = Abstract_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME;
		$existing_payload    = null;
		if ( isset( $_COOKIE[ $session_cookie_name ] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			$existing_payload = $paywall->decode_token( $_COOKIE[ $session_cookie_name ] );
		}
		if ( ! empty( $existing_payload ) ) {
			return null;
		}
	}

	$key = $paywall->get_key();
	if ( ! $key ) {
		return null;
	}

	$payload_subscriptions = array();
	foreach ( $abbreviated_subscriptions as $pid => $sub ) {
		$sub                           = (array) $sub;
		$payload_subscriptions[ $pid ] = array(
			'status'     => 'active',
			'end_date'   => $sub['end_date'] ?? gmdate( 'Y-m-d H:i:s', time() + MONTH_IN_SECONDS ),
			'product_id' => (int) $pid,
		);
		if ( ! empty( $sub['is_comp'] ) ) {
			$payload_subscriptions[ $pid ]['is_comp'] = true;
		}
	}

	$token = JWT::encode(
		array(
			'user_id'       => $user_id,
			'blog_sub'      => 'active',
			'subscriptions' => $payload_subscriptions,
		),
		$key
	);

	if ( ! ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) && ! headers_sent() ) {
		// phpcs:ignore Jetpack.Functions.SetCookie.FoundNonHTTPOnlyFalse
		setcookie( Abstract_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME, $token, strtotime( '+1 month' ), '/', '', is_ssl(), false );
	}

	// Reflect the cookie in the current request so the render path (and any later code in
	// this request) reads the freshly minted token instead of re-querying the filter.
	$_COOKIE[ Abstract_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME ] = $token;

	return $token;
}

/**
 * Resolve the current logged-in visitor's subscriptions from the authoritative
 * WordPress.com Memberships filter.
 *
 * Translates the local user id to the WordPress.com user id (via the `wpcom_user_id`
 * user_meta populated by Jetpack SSO) and queries the filter with the paywall's
 * WordPress.com blog id (not get_current_blog_id(), which is the independent local id
 * on Atomic/WoA). Shared by the access decision and the cookie self-heal.
 *
 * @param object $paywall Subscription service (provides the WordPress.com blog id).
 * @return array{0:int,1:array,2:array} [ wpcom_user_id, raw_subscriptions, abbreviated_subscriptions ].
 */
function get_subscriptions_for_logged_in_user( $paywall ) {
	$local_user_id = wp_get_current_user()->ID;
	$wpcom_user_id = (int) get_user_meta( $local_user_id, 'wpcom_user_id', true );
	$user_id       = $wpcom_user_id > 0 ? $wpcom_user_id : $local_user_id;
	$site_id       = $paywall->get_site_id();

	/**
	 * Filter the subscriptions attached to a specific user on a given site.
	 *
	 * @since 9.4.0
	 *
	 * @param array $subscriptions Array of subscriptions.
	 * @param int   $user_id The user's ID.
	 * @param int   $site_id ID of the current site.
	 */
	$raw_subscriptions         = apply_filters( 'earn_get_user_subscriptions_for_site_id', array(), $user_id, $site_id );
	$abbreviated_subscriptions = WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw_subscriptions );

	return array( $user_id, $raw_subscriptions, $abbreviated_subscriptions );
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
		if ( is_user_logged_in() ) {
			list( $user_id, $raw_subscriptions, $subscriptions ) = get_subscriptions_for_logged_in_user( $paywall );

			// Self-heal: when we have authoritative subscriptions from WPCOM but no valid
			// JWT cookie yet, mint and set one so subsequent requests use the cached path
			// (and remain accessible if the filter becomes unavailable later).
			maybe_renew_session_cookie( $paywall, $user_id, $raw_subscriptions, $subscriptions );
		}

		// Fall back to the JWT cookie/token when the filter returned nothing (e.g. Jetpack
		// self-hosted without the WPCOM filter registered, or anonymous visitor arriving
		// via a `?token=` magic link).
		if ( empty( $subscriptions ) ) {
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
