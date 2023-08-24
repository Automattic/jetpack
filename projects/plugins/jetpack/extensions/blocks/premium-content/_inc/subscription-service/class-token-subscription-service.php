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

	const JWT_AUTH_TOKEN_COOKIE_NAME         = 'jp-premium-content-session';
	const DECODE_EXCEPTION_FEATURE           = 'memberships';
	const DECODE_EXCEPTION_MESSAGE           = 'Problem decoding provided token';
	const REST_URL_ORIGIN                    = 'https://subscribe.wordpress.com/';
	const BLOG_SUB_ACTIVE                    = 'active';
	const BLOG_SUB_PENDING                   = 'pending';
	const POST_ACCESS_LEVEL_EVERYBODY        = 'everybody';
	const POST_ACCESS_LEVEL_SUBSCRIBERS      = 'subscribers';
	const POST_ACCESS_LEVEL_PAID_SUBSCRIBERS = 'paid_subscribers';

	/**
	 * Initialize the token subscription service.
	 *
	 * @inheritDoc
	 */
	public function initialize() {
		$token = $this->token_from_request();
		if ( null !== $token ) {
			$this->set_token_cookie( $token );
		}
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

		// URL token always has a precedence, so it can overwrite the cookie when new data available.
		$token = $this->token_from_request();
		if ( $token ) {
			$this->set_token_cookie( $token );
		} else {
			$token = $this->token_from_cookie();
		}

		$is_valid_token = true;

		if ( empty( $token ) ) {
			// no token, no access.
			$is_valid_token = false;
		} else {
			$payload = $this->decode_token( $token );
			if ( empty( $payload ) ) {
				$is_valid_token = false;
			}
		}

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
		} else {
			// Token not valid. We bail even unless the post can be accessed publicly.
			return $this->user_has_access( $access_level, false, false, get_the_ID(), array() );
		}

		return $this->user_has_access( $access_level, $is_blog_subscriber, $is_paid_subscriber, get_the_ID(), $subscriptions );
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

		if ( is_user_logged_in() && current_user_can( 'edit_post', $post_id ) ) {
			// Admin has access
			return true;
		}

		if ( empty( $access_level ) || $access_level === self::POST_ACCESS_LEVEL_EVERYBODY ) {
			// empty level means the post is not gated for paid users
			return true;
		}

		if ( $access_level === self::POST_ACCESS_LEVEL_SUBSCRIBERS ) {
			return $is_blog_subscriber || $is_paid_subscriber;
		}

		if ( $access_level === self::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS ) {
			return $is_paid_subscriber && ! $this->is_current_user_gated_access_for_tier( $post_id, $user_abbreviated_subscriptions );
		}

		// This should not be a use case
		return false;
	}

	/**
	 * Check post access for tiers.
	 *
	 * @param int   $post_id Current post id.
	 * @param array $user_abbreviated_subscriptions User subscription abbreviated.
	 *
	 * @return bool
	 */
	private function is_current_user_gated_access_for_tier( $post_id, $user_abbreviated_subscriptions ) {
		$tier_id = intval(
			get_post_meta( META_NAME_FOR_POST_TIER_ID_SETTINGS, true )
		);

		if ( ! $tier_id ) {
			return false;
		}

		$plan_ids = \Jetpack_Memberships::get_all_newsletter_plan_ids();

		if ( ! in_array( $tier_id, $plan_ids, true ) ) {
			// If the tier is not in the plans, we bail
			return false;
		}

		// We now need the tier price and currency, and the same for the annual price (if available)
		$tier_meta         = get_post_meta( $tier_id );
		$tier_price        = $tier_meta['jetpack_memberships_price'];
		$tier_currency     = $tier_meta['jetpack_memberships_currency'];
		$annual_tier_price = $tier_price * 12;

		// At this point we know the post is
		$linked_post_tier = get_posts(
			array(
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'post_type'      => self::$post_type_plan,
				'meta_key'       => 'jetpack_memberships_tier',
				'meta_value'     => $tier_id,
			)
		);

		if ( count( $linked_post_tier ) !== 0 ) {
			$annual_tier_id = (int) reset(
				$linked_post_tier
			);

			$annual_tier_meta  = get_post_meta( $annual_tier_id );
			$annual_tier_price = isset( $annual_tier_meta['jetpack_memberships_price'] ) ? $annual_tier_meta['jetpack_memberships_price'] : $annual_tier_price;
		}

		foreach ( $user_abbreviated_subscriptions as $subscription_id => $details ) {
			$end = is_int( $details->end_date ) ? $details->end_date : strtotime( $details->end_date );
			if ( $end < time() ) {
				// subscription not active anymore
				continue;
			}

			$metas                 = get_post_meta( $subscription_id );
			$subscription_price    = $metas['jetpack_memberships_price'];
			$subscription_currency = $metas['jetpack_memberships_currency'];
			$subscription_interval = $metas['jetpack_memberships_interval'];

			if ( $tier_currency !== $subscription_currency ) {
				// For now, we don't count if there are different currency (not sure how to convert price in a pure JP env)
				continue;
			}

			if ( ( $subscription_interval === '1 month' && $subscription_price > $tier_price ) ||
					( $subscription_interval === '1 year' && $subscription_price > $annual_tier_price )
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
	 * @return void
	 */
	private function set_token_cookie( $token ) {
		if ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) {
			return;
		}

		if ( ! empty( $token ) && false === headers_sent() ) {
			setcookie( self::JWT_AUTH_TOKEN_COOKIE_NAME, $token, 0, '/', COOKIE_DOMAIN, is_ssl(), true ); // httponly -- used by visitor_can_view_content() within the PHP context.
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
