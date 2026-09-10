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

require_once __DIR__ . '/class-expiry-wpcom.php';

/**
 * Only the WordPress.com account that bought a subscription can renew it; the
 * store refuses anyone else at checkout, so each surface asks this before
 * offering a renewal.
 */
class Expiry_Owner {

	const CACHE_KEY_PREFIX = 'wpcom_expiry_notices_owner_';

	/**
	 * Whether the current user can renew the plan the state describes.
	 *
	 * A viewer with no WordPress.com identity never is. A failed lookup reads
	 * as owner: a stale "Renew now" costs one refused checkout, hiding it costs the site.
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
	 * On Atomic the ID comes from the SSO user meta or the connection token;
	 * null is an admin created on the site itself.
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
	 * @param array<string,mixed> $state State from Expiry_Data::get_expiry_state().
	 */
	public static function owner_id( array $state ): ?int {
		$subscription_id = (string) ( $state['subscription_id'] ?? '' );
		$product_slug    = (string) ( $state['product_slug'] ?? '' );
		if ( '' === $subscription_id && '' === $product_slug ) {
			return null;
		}

		$owner_id = Expiry_Wpcom::remember(
			self::cache_key( $state ),
			static function () use ( $subscription_id, $product_slug ): ?string {
				$upgrades = Constants::is_true( 'IS_WPCOM' )
					? self::simple_site_upgrades()
					: Expiry_Wpcom::get_as_blog( '/upgrades?site=%d' );
				$owner_id = is_array( $upgrades ) ? self::pick_owner_id( $upgrades, $subscription_id, $product_slug ) : null;
				return null === $owner_id ? null : (string) $owner_id;
			}
		);

		return null === $owner_id ? null : (int) $owner_id;
	}

	/**
	 * Where the owner of the plan a state describes is remembered.
	 *
	 * Keyed by subscription so a renewal that issues a new one, possibly to a
	 * different account, starts from a clean answer.
	 *
	 * @param array<string,mixed> $state State from Expiry_Data::get_expiry_state().
	 */
	public static function cache_key( array $state ): string {
		$subscription_id = (string) ( $state['subscription_id'] ?? '' );
		return self::CACHE_KEY_PREFIX . ( '' !== $subscription_id ? $subscription_id : (string) ( $state['product_slug'] ?? '' ) );
	}

	/**
	 * The owner of one subscription out of a site's upgrade list.
	 *
	 * Matched on the subscription ID, which is what the store refuses renewals
	 * against; a purchase synced before the site knew its ID falls back to the
	 * product slug, which on a one-plan site names the same subscription.
	 *
	 * @param array<int,mixed> $upgrades        Upgrade objects as `/upgrades?site=` returns them.
	 * @param string           $subscription_id The subscription to find, or '' when unknown.
	 * @param string           $product_slug    Fallback match when the ID is unknown.
	 */
	public static function pick_owner_id( array $upgrades, string $subscription_id, string $product_slug ): ?int {
		foreach ( $upgrades as $upgrade ) {
			if ( ! is_object( $upgrade ) || ! self::upgrade_matches( $upgrade, $subscription_id, $product_slug ) ) {
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
	 * Whether an upgrade entry is the subscription being looked for.
	 *
	 * @param object $upgrade         Upgrade object.
	 * @param string $subscription_id The subscription to find, or '' when unknown.
	 * @param string $product_slug    Fallback match when the ID is unknown.
	 */
	private static function upgrade_matches( object $upgrade, string $subscription_id, string $product_slug ): bool {
		if ( '' !== $subscription_id ) {
			return isset( $upgrade->ID ) && (string) $upgrade->ID === $subscription_id;
		}
		return '' !== $product_slug && isset( $upgrade->product_slug ) && $upgrade->product_slug === $product_slug;
	}

	/**
	 * The site's subscriptions, read straight from the store on Simple.
	 *
	 * The same objects the endpoint serialises for Atomic. The store class
	 * ships only on WordPress.com and is not loaded on its own.
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
}
