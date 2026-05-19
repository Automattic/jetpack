<?php
/**
 * Loader for the Posts to Podcast (Create AI Podcast) feature.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Posts_To_Podcast;

/**
 * Single entry point for the Posts to Podcast feature. Owns the feature gate
 * and the lifecycle of the REST endpoint, the wp-admin page, and the
 * post-publish editor promo.
 */
class Feature {

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the feature. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// REST routes register unconditionally — wpcom-proxy requests from
		// public-api.wordpress.com may not satisfy the proxied-request gate
		// but still need the routes for permission and callback checks.
		Endpoint::init();

		if ( ! self::is_enabled() ) {
			return;
		}

		if ( is_admin() ) {
			Admin_Page::init();
			Post_Publish_Promo::init();
		}
	}

	/**
	 * Whether the Posts to Podcast feature is enabled for the current request.
	 *
	 * Defaults to true for A8C-proxied requests so Automatticians dogfood it,
	 * and can be flipped globally via the `jetpack_posts_to_podcast` filter.
	 */
	public static function is_enabled(): bool {
		/**
		 * Master switch for the Posts to Podcast (Create AI Podcast) feature.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether to enable Posts to Podcast.
		 */
		return (bool) apply_filters( 'jetpack_posts_to_podcast', self::is_proxied_request() );
	}

	/**
	 * Whether the current request is coming from the A8C proxy.
	 */
	private static function is_proxied_request(): bool {
		if ( function_exists( 'wpcom_is_proxied_request' ) ) {
			return (bool) wpcom_is_proxied_request();
		}

		if ( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) ) {
			return (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) );
		}

		return defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}
}
