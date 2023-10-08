<?php
/**
 * A paywall that exchanges JWT tokens from WordPress.com to allow
 * a current visitor to view content that has been deemed "Premium content".
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content
 */

namespace Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service;

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_TIER_ID_SETTINGS;

/**
 * Class Token_Subscription_Service
 *
 * @package Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service
 */
abstract class Token_Subscription_Service implements Subscription_Service {

	const JWT_AUTH_TOKEN_COOKIE_NAME                   = 'jp-premium-content-session';
	const DECODE_EXCEPTION_FEATURE                     = 'memberships';
	const DECODE_EXCEPTION_MESSAGE                     = 'Problem decoding provided token';
	const REST_URL_ORIGIN                              = 'https://subscribe.wordpress.com/';
	const BLOG_SUB_ACTIVE                              = 'active';
	const BLOG_SUB_PENDING                             = 'pending';
	const POST_ACCESS_LEVEL_EVERYBODY                  = 'everybody';
	const POST_ACCESS_LEVEL_SUBSCRIBERS                = 'subscribers';
	const POST_ACCESS_LEVEL_PAID_SUBSCRIBERS           = 'paid_subscribers';
	const POST_ACCESS_LEVEL_PAID_SUBSCRIBERS_ALL_TIERS = 'paid_subscribers_all_tiers';

	/**
	 * Initialize the token subscription service.
	 *
	 * @inheritDoc
	 */
	public function initialize() {
		$this->get_and_set_token_from_request( true );
	}

	/**
	 * Set the token from the Request to the cookie and retrieve the token.
	 *
	 * @param bool $redirect_when_cookie_is_set If true, we'll force-reload the page to "hide" the token from the URL.
	 *
	 * @return string|null
	 */
	public function get_and_set_token_from_request( $redirect_when_cookie_is_set = false ) {
		// URL token always has a precedence, so it can overwrite the cookie when new data available.
		$token = $this->token_from_request();
		if ( $token ) {
			$this->set_token_cookie( $token, $redirect_when_cookie_is_set );
		} else {
			$token = $this->token_from_cookie();
		}

		return $token;
	}

	/**
	 * The user is visiting with a subscriber token cookie.
	 *
	 * This is theoretically where the cookie JWT signature verification
	 * thing will happen.
	 *
	 * How to obtain one of these (or what exactly it is) is
	 * still a WIP (see api/auth branch)
	 *
	 * @inheritDoc
	 *
	 * @param array $valid_plan_ids List of valid plan IDs.
	 * @param array $access_level Access level for content.
	 *
	 * @return bool Whether the user can view the content
	 */
	public function visitor_can_view_content( $valid_plan_ids, $access_level ) {
		global $current_user;
		$old_user = $current_user; // backup the current user so we can set the current user to the token user for paywall purposes

		$token = $this->get_and_set_token_from_request( false );

		$is_valid_token = true;

		if ( empty( $token ) ) {
			// no token, no access.
			$is_valid_token = false;
		} else {
			$payload = $this->decode_token( $token );
			if ( empty( $payload ) ) {
				$is_valid_token = false;
			}

			// set the current user to the payload's user id
			if ( isset( $payload['user_id'] ) ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$current_user = get_user_by( 'id', $payload['user_id'] );
			}
		}

		$is_blog_subscriber = false;
		$is_paid_subscriber = false;
		$subscriptions      = array();

		if ( $is_valid_token ) {
			/**
			 * Allow access to the content if:
			 *
			 * Active: user has a valid subscription
			 */
			$is_blog_subscriber = in_array(
				$payload['blog_sub'],
				array(
					self::BLOG_SUB_ACTIVE,
				),
				true
			);
			$subscriptions      = (array) $payload['subscriptions'];
			$is_paid_subscriber = $this->validate_subscriptions( $valid_plan_ids, $subscriptions );
		}

		$has_access = $this->user_has_access( $access_level, $is_blog_subscriber, $is_paid_subscriber, get_the_ID(), $subscriptions );
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$current_user = $old_user;
		return $has_access;
	}

	/**
	 * Return if the user has access to the content depending on the access level and the user rights
	 *
	 * @param string $access_level Post or blog access level.
	 * @param bool   $is_blog_subscriber Is user a subscriber of the blog.
	 * @param bool   $is_paid_subscriber Is user a paid subscriber of the blog.
	 * @param int    $post_id Post ID.
	 * @param array  $user_abbreviated_subscriptions User subscription abbreviated.
	 *
	 * @return bool Whether the user has access to the content.
	 */
	protected function user_has_access( $access_level, $is_blog_subscriber, $is_paid_subscriber, $post_id, $user_abbreviated_subscriptions ) {
		$has_access = false;

		if ( is_user_logged_in() && current_user_can( 'edit_post', $post_id ) ) {
			// Admin has access
			$has_access = true;
		}

		if ( empty( $has_access ) && ( empty( $access_level ) || $access_level === self::POST_ACCESS_LEVEL_EVERYBODY ) ) {
			// empty level means the post is not gated for paid users
			$has_access = true;
		}

		if ( empty( $has_access ) && ( $access_level === self::POST_ACCESS_LEVEL_SUBSCRIBERS ) ) {
			$has_access = $is_blog_subscriber || $is_paid_subscriber;
		}

		if ( empty( $has_access ) && ( $access_level === self::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS_ALL_TIERS ) ) {
			$has_access = $is_paid_subscriber;
		}

		if ( empty( $has_access ) && ( $access_level === self::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS ) ) {
			$has_access = $is_paid_subscriber && ! $this->maybe_gate_access_for_user_if_post_tier( $post_id, $user_abbreviated_subscriptions );
		}

		do_action( 'earn_user_has_access', $access_level, $has_access, $is_blog_subscriber, $is_paid_subscriber, $post_id );
		return $has_access;
	}

	/**
	 * Check post access for tiers.
	 *
	 * @param int   $post_id Current post id.
	 * @param array $user_abbreviated_subscriptions User subscription abbreviated.
	 *
	 * @return bool
	 */
	private function maybe_gate_access_for_user_if_post_tier( $post_id, $user_abbreviated_subscriptions ) {
		$tier_id = intval(
			get_post_meta( $post_id, META_NAME_FOR_POST_TIER_ID_SETTINGS, true )
		);

		if ( ! $tier_id ) {
			return false;
		}

		return $this->maybe_gate_access_for_user_if_tier( $tier_id, $user_abbreviated_subscriptions );
	}

	/**
	 * Check access for tier.
	 *
	 * @param int   $tier_id Tier id.
	 * @param array $user_abbreviated_subscriptions User subscription abbreviated.
	 *
	 * @return bool
	 */
	public function maybe_gate_access_for_user_if_tier( $tier_id, $user_abbreviated_subscriptions ) {
		$plan_ids = \Jetpack_Memberships::get_all_newsletter_plan_ids();

		if ( ! in_array( $tier_id, $plan_ids, true ) ) {
			// If the tier is not in the plans, we bail
			return false;
		}

		// We now need the tier price and currency, and the same for the annual price (if available)
		$tier_meta         = get_post_meta( $tier_id );
		$tier_price        = isset( $tier_meta['jetpack_memberships_price'] ) ? $tier_meta['jetpack_memberships_price'][0] : null;
		$tier_currency     = isset( $tier_meta['jetpack_memberships_currency'] ) ? $tier_meta['jetpack_memberships_currency'][0] : null;
		$tier_product_id   = isset( $tier_meta['jetpack_memberships_product_id'] ) ? $tier_meta['jetpack_memberships_product_id'][0] : null;
		$annual_tier_price = $tier_price * 12;

		if ( $tier_price === null || $tier_currency === null || $tier_product_id === null ) {
			// There is an issue with the meta
			return false;
		}

		// At this point we know the post is
		$linked_post_tier = get_posts(
			array(
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'post_type'      => \Jetpack_Memberships::$post_type_plan,
				'meta_key'       => 'jetpack_memberships_tier',
				'meta_value'     => $tier_id,
			)
		);

		$annual_tier_id = false;
		if ( count( $linked_post_tier ) !== 0 ) {
			$annual_tier_id = (int) reset(
				$linked_post_tier
			);

			$annual_tier_meta  = get_post_meta( $annual_tier_id );
			$annual_tier_price = isset( $annual_tier_meta['jetpack_memberships_price'][0] ) ? $annual_tier_meta['jetpack_memberships_price'][0] : $annual_tier_price;
		}

		foreach ( $user_abbreviated_subscriptions as $subscription_plan_id => $details ) {
			$details = (array) $details;
			$end     = is_int( $details['end_date'] ) ? $details['end_date'] : strtotime( $details['end_date'] );
			if ( $end < time() ) {
				// subscription not active anymore
				continue;
			}

			$subscription_post_id = get_posts(
				array(
					'posts_per_page' => 1,
					'fields'         => 'ids',
					'post_type'      => \Jetpack_Memberships::$post_type_plan,
					'meta_key'       => 'jetpack_memberships_product_id',
					'meta_value'     => $subscription_plan_id,
				)
			);

			if ( empty( $subscription_post_id ) ) {
				// No post linked to this plan
				continue;
			}
			$subscription_post_id = $subscription_post_id[0];

			if ( $subscription_post_id === $tier_id || $subscription_post_id === $annual_tier_id ) {
				// User is subscribed to the right tier
				return false;
			}

			$metas                 = get_post_meta( $subscription_post_id );
			$subscription_price    = isset( $metas['jetpack_memberships_price'] ) ? $metas['jetpack_memberships_price'][0] : null;
			$subscription_currency = isset( $metas['jetpack_memberships_currency'] ) ? $metas['jetpack_memberships_currency'][0] : null;
			$subscription_interval = isset( $metas['jetpack_memberships_interval'] ) ? $metas['jetpack_memberships_interval'][0] : null;

			if ( $subscription_price === null || $subscription_currency === null || $subscription_interval === null ) {
				// There is an issue with the meta
				continue;
			}

			if ( $tier_currency !== $subscription_currency ) {
				// For now, we don't count if there are different currency (not sure how to convert price in a pure JP env)
				continue;
			}

			if ( ( $subscription_interval === '1 month' && $subscription_price >= $tier_price ) ||
					( $subscription_interval === '1 year' && $subscription_price >= $annual_tier_price )
			) {
				// One subscription is more expensive than the minimum set by the post' selected tier
				return false;
			}
		}

		return true; // No user subscription is more expensive than the post's tier price...
	}

	/**
	 * Decode the given token.
	 *
	 * @param string $token Token to decode.
	 *
	 * @return array|false
	 */
	public function decode_token( $token ) {
		if ( empty( $token ) ) {
			return false;
		}

		try {
			$key = $this->get_key();
			return $key ? (array) JWT::decode( $token, $key, array( 'HS256' ) ) : false;
		} catch ( \Exception $exception ) {
			return false;
		}
	}

	/**
	 * Get the key for decoding the auth token.
	 *
	 * @return string|false
	 */
	abstract public function get_key();

	// phpcs:disable
	/**
	 * Get the URL to access the protected content.
	 *
	 * @param string $mode Access mode (either "subscribe" or "login").
	 */
	public function access_url( $mode = 'subscribe' ) {
		global $wp;
		$permalink = get_permalink();
		if ( empty( $permalink ) ) {
			$permalink = add_query_arg( $wp->query_vars, home_url( $wp->request ) );
		}

		$login_url = $this->get_rest_api_token_url( $this->get_site_id(), $permalink );
		return $login_url;
	}
	// phpcs:enable

	/**
	 * Get the token stored in the auth cookie.
	 *
	 * @return ?string
	 */
	private function token_from_cookie() {
		if ( isset( $_COOKIE[ self::JWT_AUTH_TOKEN_COOKIE_NAME ] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return $_COOKIE[ self::JWT_AUTH_TOKEN_COOKIE_NAME ];
		}
	}

	/**
	 * Store the auth cookie.
	 *
	 * @param  string $token Auth token.
	 * @param  bool   $redirect_when_cookie_is_set If true, we'll force-reload the page to "hide" the token from the URL.
	 * @return void
	 */
	private function set_token_cookie( $token, $redirect_when_cookie_is_set = false ) {
		if ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) {
			return;
		}

		if ( ! empty( $token ) && false === headers_sent() ) {
			setcookie( self::JWT_AUTH_TOKEN_COOKIE_NAME, $token, 0, '/', COOKIE_DOMAIN, is_ssl(), true ); // httponly -- used by visitor_can_view_content() within the PHP context.
			if ( true === $redirect_when_cookie_is_set ) {
				$location_without_token = remove_query_arg( 'token' );
				if ( wp_safe_redirect( $location_without_token, 302, 'Subscriptions' ) ) {
					exit;
				}
			}
		}
	}

	/**
	 * Get the token if present in the current request.
	 *
	 * @return ?string
	 */
	private function token_from_request() {
		$token = null;
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['token'] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
			if ( preg_match( '/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/', $_GET['token'], $matches ) ) {
				// token matches a valid JWT token pattern.
				$token = reset( $matches );
			}
		}
		return $token;
	}

	/**
	 * Return true if any ID/date pairs are valid. Otherwise false.
	 *
	 * @param int[]                          $valid_plan_ids List of valid plan IDs.
	 * @param array<int, Token_Subscription> $token_subscriptions : ID must exist in the provided <code>$valid_subscriptions</code> parameter.
	 *                                                            The provided end date needs to be greater than <code>now()</code>.
	 *
	 * @return bool
	 */
	public static function validate_subscriptions( $valid_plan_ids, $token_subscriptions ) {
		// Create a list of product_ids to compare against.
		$product_ids = array();
		foreach ( $valid_plan_ids as $plan_id ) {
			$product_id = (int) get_post_meta( $plan_id, 'jetpack_memberships_product_id', true );
			if ( isset( $product_id ) ) {
				$product_ids[] = $product_id;
			}
		}
		foreach ( $token_subscriptions as $product_id => $token_subscription ) {
			if ( in_array( intval( $product_id ), $product_ids, true ) ) {
				$end = is_int( $token_subscription->end_date ) ? $token_subscription->end_date : strtotime( $token_subscription->end_date );
				if ( $end > time() ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Get the URL of the JWT endpoint.
	 *
	 * @param  int    $site_id Site ID.
	 * @param  string $redirect_url URL to redirect after checking the token validity.
	 * @return string URL of the JWT endpoint.
	 */
	private function get_rest_api_token_url( $site_id, $redirect_url ) {
		// The redirect url might have a part URL encoded but not the whole URL.
		$redirect_url = rawurldecode( $redirect_url );
		return sprintf( '%smemberships/jwt?site_id=%d&redirect_url=%s', self::REST_URL_ORIGIN, $site_id, rawurlencode( $redirect_url ) );
	}

	/**
	 * Report the subscriptions as an ID => [ 'end_date' => ]. mapping
	 *
	 * @param array $subscriptions_from_bd List of subscriptions from BD.
	 *
	 * @return array<int, array>
	 */
	public static function abbreviate_subscriptions( $subscriptions_from_bd ) {

		if ( empty( $subscriptions_from_bd ) ) {
			return array();
		}

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
