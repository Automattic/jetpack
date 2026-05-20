<?php
/**
 * Main loader for the Jetpack Podcast package.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Automattic\Jetpack\Status\Host;

/**
 * Loads Jetpack Podcast on Simple and Atomic sites, gated behind the
 * `jetpack_podcast_untangle` feature filter.
 *
 * Until the filter returns true, `init()` is a no-op so the legacy podcasting
 * code (`Automattic_Podcasting` from the wpcom mu-plugin and the
 * at-pressable-podcasting bridge plugin) keeps running unchanged. Subsequent
 * PRs in the untangle train fill this in.
 */
class Podcast {

	const PACKAGE_VERSION = '1.0.2';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the package.
	 *
	 * Bails on hosts other than Simple and Atomic, and again unless the
	 * `jetpack_podcast_untangle` filter returns true.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$host = new Host();
		if ( ! $host->is_wpcom_simple() && ! $host->is_woa_site() ) {
			return;
		}

		// Wire the Podcast Episode block actions before the filter check below:
		// each callback re-checks `jetpack_podcast_untangle` at hook time so a
		// late-registered filter callback still takes effect.
		Podcast_Episode_Block::register_hooks();

		// Register the local REST routes before request-local rollout gates.
		// Requests from public-api.wordpress.com may not satisfy those gates,
		// but the wpcom/v2 routes still need to exist so permission and
		// callback checks can handle the request.
		Posts_To_Podcast_Endpoint::init();
		Podcast_Stats_Endpoint::init();
		Podcast_Distribution_Endpoint::init();

		if ( ! self::is_enabled() ) {
			return;
		}

		// Register the `podcasting_*` option schema so the SPA can read/write
		// via `/wp/v2/settings`. On Simple, the legacy WPCOM site-settings
		// filters in the wpcom mu-plugin remain authoritative for
		// `/rest/v1.4/sites/{id}/settings`; this is the non-Simple equivalent.
		Settings::register();

		// Wire the RSS feed customizations (`<itunes:*>` + `<podcast:*>` tags,
		// stats-tracked enclosure URLs) for the configured podcast category.
		Customize_Feed::init();

		Tracks::init();

		// Wire the wp-admin entry point. Admin_Page::init() stages the wp-build
		// dashboard; menu registration itself runs from wpcom-admin-menu.php
		// via Admin_Page::add_wp_admin_submenu() at admin_menu priority 999999.
		if ( is_admin() ) {
			Admin_Page::init();
		}

		// Posts to Podcast lives behind its own filter so the Create AI
		// Podcast page can ship independently of the broader untangle.
		if ( self::is_posts_to_podcast_enabled() ) {
			if ( is_admin() ) {
				Create_AI_Podcast_Page::init();
			}
		}
	}

	/**
	 * Whether the Posts to Podcast feature (Create AI Podcast page + REST
	 * proxy) is enabled for the current request.
	 *
	 * Mirrors the `jetpack_podcast_untangle` pattern: defaults to true for
	 * A8C-proxied requests so Automatticians dogfood it, and can be flipped
	 * globally via the `jetpack_posts_to_podcast` filter.
	 */
	public static function is_posts_to_podcast_enabled() {
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
	 * Whether the Podcast untangle is enabled for the current request.
	 *
	 * Defaults to true — the new package owns the experience on Simple
	 * and Atomic. The filter remains as an escape hatch for forcing the
	 * legacy stack back on (rollback, test fixtures, per-site overrides).
	 */
	public static function is_enabled() {
		/**
		 * Master switch for the Podcast untangle.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether to enable the new Podcast package.
		 */
		return (bool) apply_filters( 'jetpack_podcast_untangle', true );
	}

	/**
	 * Whether the current request is coming from the A8C proxy.
	 */
	private static function is_proxied_request() {
		// Simple sites: use the wpcom helper when available.
		if ( function_exists( 'wpcom_is_proxied_request' ) ) {
			return wpcom_is_proxied_request();
		}

		// Atomic/WoA: fall back to the server variable or constant.
		if ( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) ) {
			return (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) );
		}

		return defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}
}
