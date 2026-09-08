<?php
/**
 * Expiry_Owner: whether the viewer is the account that bought the plan.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;

require_once __DIR__ . '/class-expiry-wpcom-request.php';

/**
 * Only the WordPress.com account that bought a subscription can renew it; the
 * store refuses anyone else at checkout. Every admin sees the notices, so each
 * surface asks this before offering a renewal.
 */
class Expiry_Owner {

	const CACHE_KEY_PREFIX = 'wpcom_expiry_notices_owner_';
	const CACHE_TTL        = 12 * HOUR_IN_SECONDS;

	// A lookup that never got an answer is not an answer. Cached only long
	// enough to stop an outage being re-tried on every pageview.
	const FAILURE_TTL = 5 * MINUTE_IN_SECONDS;

	// Stored in place of an owner so a failed lookup is cached too.
	const UNKNOWN = 'unknown';

	/**
	 * Whether the current user can renew the plan the state describes. Ask it
	 * last: the first answer per cache period is a store read or a request.
	 *
	 * A viewer with no WordPress.com identity is never the owner. A failed lookup
	 * reads as owner: a stale "Renew now" costs one refused checkout, hiding it costs the site.
	 *
	 * @param array<string,mixed> $state State from Expiry_Data::get_expiry_state().
	 */
	public static function current_user_is_owner( array $state ): bool {
		$viewer_id = self::current_user_wpcom_id();
		if ( null === $viewer_id ) {
			return false;
		}

		$owner_id = self::owner_id( $state );
		return null === $owner_id || $owner_id === $viewer_id;
	}

	/**
	 * The current user's WordPress.com user ID, or null when they have none.
	 *
	 * On Atomic, signing in through WordPress.com leaves the ID on the local
	 * user, and a connection token can name anyone else. Null is an admin
	 * created on the site itself, with no WordPress.com account to have bought
	 * the plan with.
	 */
	public static function current_user_wpcom_id(): ?int {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		if ( Constants::is_true( 'IS_WPCOM' ) ) {
			return $user_id;
		}

		$wpcom_user_id = get_user_meta( $user_id, 'wpcom_user_id', true );
		if ( is_numeric( $wpcom_user_id ) && (int) $wpcom_user_id > 0 ) {
			return (int) $wpcom_user_id;
		}

		if ( ! class_exists( Connection_Manager::class ) ) {
			return null;
		}
		$user_data = ( new Connection_Manager() )->get_connected_user_data( $user_id );
		if ( ! is_array( $user_data ) || empty( $user_data['ID'] ) || ! is_numeric( $user_data['ID'] ) ) {
			return null;
		}
		return (int) $user_data['ID'];
	}

	/**
	 * The WordPress.com user ID of the account that bought the plan, or null
	 * when it cannot be established.
	 *
	 * Cached on both platforms: the Simple read pulls in the whole billing
	 * stack, and the Atomic one is a request.
	 *
	 * @param array<string,mixed> $state State from Expiry_Data::get_expiry_state().
	 */
	public static function owner_id( array $state ): ?int {
		$subscription_id = isset( $state['subscription_id'] ) ? (string) $state['subscription_id'] : '';
		$product_slug    = isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '';
		if ( '' === $subscription_id && '' === $product_slug ) {
			return null;
		}

		$cache_key = self::cache_key( $state );
		$cached    = get_transient( $cache_key );
		if ( self::UNKNOWN === $cached ) {
			return null;
		}
		if ( is_numeric( $cached ) && (int) $cached > 0 ) {
			return (int) $cached;
		}

		$upgrades = Constants::is_true( 'IS_WPCOM' ) ? self::simple_site_upgrades() : self::atomic_site_upgrades();
		$owner_id = null === $upgrades ? null : self::pick_owner_id( $upgrades, $subscription_id, $product_slug );
		if ( null === $owner_id ) {
			set_transient( $cache_key, self::UNKNOWN, self::FAILURE_TTL );
			return null;
		}

		set_transient( $cache_key, $owner_id, self::CACHE_TTL );
		return $owner_id;
	}

	/**
	 * Where the owner of the plan a state describes is cached.
	 *
	 * Keyed by subscription so a renewal that issues a new one, possibly to a
	 * different account, starts from a clean answer.
	 *
	 * @param array<string,mixed> $state State from Expiry_Data::get_expiry_state().
	 */
	public static function cache_key( array $state ): string {
		$subscription_id = isset( $state['subscription_id'] ) ? (string) $state['subscription_id'] : '';
		$product_slug    = isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '';
		return self::CACHE_KEY_PREFIX . ( '' !== $subscription_id ? $subscription_id : $product_slug );
	}

	/**
	 * Pure: the owner of one subscription out of a site's upgrade list, matched
	 * on the subscription ID, which is what the store refuses renewals against.
	 * A purchase synced before the site knew its ID falls back to the product
	 * slug, which on a one-plan site names the same subscription.
	 *
	 * @param array<int,mixed> $upgrades        Billing upgrade objects, as `/upgrades?site=` returns them.
	 *                                          Anything that is not an object is skipped.
	 * @param string           $subscription_id The subscription to find, or '' when unknown.
	 * @param string           $product_slug    Fallback match when the ID is unknown.
	 */
	public static function pick_owner_id( array $upgrades, string $subscription_id, string $product_slug ): ?int {
		foreach ( $upgrades as $upgrade ) {
			if ( ! is_object( $upgrade ) ) {
				continue;
			}

			$matches = '' !== $subscription_id
				? ( isset( $upgrade->ID ) && (string) $upgrade->ID === $subscription_id )
				: ( '' !== $product_slug && isset( $upgrade->product_slug ) && $upgrade->product_slug === $product_slug );
			if ( ! $matches ) {
				continue;
			}

			if ( ! isset( $upgrade->user_id ) || ! is_numeric( $upgrade->user_id ) || (int) $upgrade->user_id <= 0 ) {
				return null;
			}
			return (int) $upgrade->user_id;
		}

		return null;
	}

	/**
	 * The site's subscriptions, read straight from the store on Simple.
	 *
	 * The same objects the endpoint serialises for Atomic, so both platforms
	 * pick the owner the same way. The store class is not loaded on its own:
	 * its loader is required first, and reached only where it ships.
	 *
	 * @return array<int,object>|null Null where the store cannot be read.
	 */
	private static function simple_site_upgrades(): ?array {
		if ( ! function_exists( 'get_wpcom_blog_id' ) || ! defined( 'WP_CONTENT_DIR' ) ) {
			return null;
		}

		$billing_loader = WP_CONTENT_DIR . '/admin-plugins/wpcom-billing.php';
		if ( ! is_readable( $billing_loader ) ) {
			return null;
		}

		try {
			require_once $billing_loader;
			if ( ! class_exists( '\WPCOM_Store_API' ) || ! method_exists( '\WPCOM_Store_API', 'get_site_billing_upgrades' ) ) {
				return null;
			}
			// @phan-suppress-next-line PhanUndeclaredStaticMethod -- wpcom-only, guarded above.
			$upgrades = \WPCOM_Store_API::get_site_billing_upgrades( (int) get_wpcom_blog_id(), true );
		} catch ( \Throwable $e ) {
			return null;
		}

		return is_array( $upgrades ) ? $upgrades : null;
	}

	/**
	 * The site's subscriptions, fetched from WordPress.com on Atomic.
	 *
	 * The synced purchases on an Atomic site do not carry their owner, and are
	 * only sent again on the next subscription event, so this asks instead.
	 * Version 1.2 of `/upgrades` accepts the blog token when a site is named.
	 *
	 * @return array<int,object>|null Null on any failure.
	 */
	private static function atomic_site_upgrades(): ?array {
		$site_id = class_exists( '\Jetpack_Options' ) ? \Jetpack_Options::get_option( 'id' ) : 0;
		if ( ! $site_id ) {
			return null;
		}

		$body = Expiry_Wpcom_Request::get_as_blog( sprintf( '/upgrades?site=%d', (int) $site_id ) );
		return is_array( $body ) ? $body : null;
	}
}
