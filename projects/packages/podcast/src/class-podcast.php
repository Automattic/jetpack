<?php
/**
 * Main loader for the Jetpack Podcast package.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Automattic\Jetpack\Status\Host;

/**
 * Loads Jetpack Podcast on Simple and Atomic sites. The package owns the
 * podcasting experience outright.
 */
class Podcast {

	const PACKAGE_VERSION = '1.3.1';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the package.
	 *
	 * Always loads on Simple and WoA. On self-hosted Jetpack it stays dormant
	 * unless opted in via the `jetpack_podcast_for_the_world` filter.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$host = new Host();

		/**
		 * Allow the Podcast package to load on self-hosted Jetpack sites.
		 *
		 * @since 1.1.1
		 *
		 * @param bool $enabled Whether to load the package on self-hosted. Default false.
		 */
		$for_the_world = (bool) apply_filters( 'jetpack_podcast_for_the_world', false );

		if ( ! $host->is_wpcom_simple() && ! $host->is_woa_site() && ! $for_the_world ) {
			return;
		}

		Podcast_Episode_Block::register_hooks();

		Podcast_Stats_Endpoint::init();
		Podcast_Distribution_Endpoint::init();
		Podcast_Settings_Endpoint::init();

		Settings::register();

		// Wire the RSS feed customizations (`<itunes:*>` + `<podcast:*>` tags,
		// stats-tracked enclosure URLs) for the configured podcast category.
		Customize_Feed::init();

		Tracks::init();

		if ( is_admin() ) {
			Admin_Page::init();
			New_Episode_Prefill::init();
		}

		if ( $host->is_wpcom_simple() || $host->is_woa_site() ) {
			// Register the local REST routes before request-local rollout gates.
			// Requests from public-api.wordpress.com may not satisfy those gates,
			// but the wpcom/v2 routes still need to exist so permission and
			// callback checks can handle the request.
			Posts_To_Podcast_Endpoint::init();

			// Posts to Podcast lives behind its own filter so the Create AI
			// Podcast page can ship independently of the rest of the package.
			//
			// Note: no `is_admin()` guard here. The submenu must also register when
			// Calypso builds its nav via the `wpcom/v2/admin-menu` REST endpoint,
			// which fires `admin_menu` by loading `wp-admin/menu.php` but runs as a
			// REST request where `is_admin()` is false. The hooks `init()` wires
			// (`admin_menu`, `enqueue_block_editor_assets`) self-gate, so this is a
			// no-op on non-admin/non-editor requests.
			if ( self::is_posts_to_podcast_enabled() ) {
				Create_AI_Podcast_Page::init();
			}
		}
	}

	/**
	 * Whether the Posts to Podcast feature (Create AI Podcast page + REST
	 * proxy) is enabled for the current request.
	 *
	 * Defaults to true for connected WordPress.com users, and can be flipped
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
		$enabled = self::is_user_connected( get_current_user_id() );

		return (bool) apply_filters( 'jetpack_posts_to_podcast', $enabled );
	}

	/**
	 * Whether a user is connected to WordPress.com.
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	private static function is_user_connected( $user_id ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}

		return ( new Connection_Manager( 'jetpack' ) )->is_user_connected( $user_id );
	}
}
