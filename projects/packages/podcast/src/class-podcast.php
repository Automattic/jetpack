<?php
/**
 * Main loader for the Jetpack Podcast package.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Automattic\Jetpack\Podcast\Feed\Feed_Detection;
use Automattic\Jetpack\Podcast\REST\Settings_REST;
use Automattic\Jetpack\Status\Host;

/**
 * Loads Jetpack Podcast on Simple and Atomic sites.
 */
class Podcast {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the package. Bails on hosts other than Simple and Atomic.
	 *
	 * When the legacy podcast code (`Automattic_Podcasting` from the wpcom
	 * mu-plugin or the at-pressable-podcasting bridge plugin) is active, only
	 * the new wp-admin page is registered — feed customization and REST
	 * settings filters defer to the legacy code so we don't double-register
	 * `rss2_*` hooks (which would emit duplicate iTunes/Google Play tags) or
	 * stack the wpcom site-settings filters. Deleting either legacy entry
	 * point is what flips this package into full-control mode.
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

		$legacy_active = class_exists( 'Automattic_Podcasting', false );

		// `register_setting()` always runs — it's the only path that exposes
		// `podcasting_*` keys via `/wp/v2/settings` on Atomic, and the legacy
		// wpcom mu-plugin / at-pressable-podcasting bridge don't register them
		// there. Skipping it would leave the SPA with no way to read or write
		// settings on Atomic. The wpcom-only `site_settings_endpoint_get` /
		// `rest_api_update_site_settings` filters are a different story —
		// those `do` overlap with the legacy code, so we skip them when the
		// legacy code is loaded.
		Settings_REST::init( ! $legacy_active );

		// Admin page registration is only relevant in wp-admin contexts. Always
		// registered (even alongside legacy) so the new SPA is the canonical
		// entry point during the migration.
		if ( is_admin() ) {
			Settings::init();
		}

		// Feed customization is wired only when the podcast feed is being
		// served, and only when we own the feed (no legacy code present).
		// The actual `rss2_*` hook plumbing (and the matching `remove_action`
		// calls) lives in Customize_Feed::init() so it's only registered when
		// a feed request is in flight, not on every page load.
		if ( ! $legacy_active && self::is_enabled() ) {
			add_action( 'after_setup_theme', array( __CLASS__, 'add_post_thumbnail_support' ), 20 );

			if ( ! is_admin() ) {
				add_action( 'wp', array( __CLASS__, 'maybe_load_feed_customization' ) );
			}
		}
	}

	/**
	 * Load feed customization only when the podcast category feed is requested.
	 *
	 * Also runs the podcatcher detector here — same gate (single feed
	 * request), guaranteed to run before the response goes out, and cheap
	 * enough that piggybacking is fine.
	 */
	public static function maybe_load_feed_customization() {
		if ( is_feed() && is_category( self::get_category_id() ) ) {
			Feed_Detection::detect_and_record();
			Customize_Feed::init();
		}
	}

	/**
	 * Episode-level feed images rely on post thumbnails.
	 */
	public static function add_post_thumbnail_support() {
		add_theme_support( 'post-thumbnails' );
	}

	/**
	 * Resolve the configured podcast category ID, falling back to the legacy slug option.
	 *
	 * @return int|false
	 */
	public static function get_category_id() {
		$cat_id = get_option( 'podcasting_category_id', false );

		if ( false !== $cat_id ) {
			$category = get_category( $cat_id );
			if ( ! $category || ! isset( $category->term_id ) ) {
				return false;
			}
			return (int) $category->term_id;
		}

		$archive_slug = get_option( 'podcasting_archive', false );
		if ( false === $archive_slug ) {
			return false;
		}

		$category = get_term_by( 'slug', $archive_slug, 'category' );
		if ( ! $category || ! isset( $category->term_id ) ) {
			return false;
		}

		return (int) $category->term_id;
	}

	/**
	 * Podcast is enabled when a category has been chosen.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return (bool) self::get_category_id();
	}

	/**
	 * Resolve the podcast cover image URL, preferring an attachment if one is set.
	 *
	 * @return string
	 */
	public static function get_image_url() {
		$image_id = get_option( 'podcasting_image_id', false );
		if ( $image_id && is_numeric( $image_id ) && wp_attachment_is_image( $image_id ) ) {
			return (string) wp_get_attachment_url( $image_id );
		}
		return (string) get_option( 'podcasting_image', '' );
	}
}
