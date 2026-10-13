<?php
/**
 * Jetpack Comments.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Status\Host;

/**
 * Package entry point.
 */
class Comments {

	/**
	 * Package version.
	 */
	const PACKAGE_VERSION = '0.6.0';

	/**
	 * Whether Jetpack Comments should load.
	 *
	 * @since 0.1.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// Blog 522232 is jetpack.wordpress.com, which serves the Verbum iframe to sites on older Jetpack versions.
			if ( 522232 === get_current_blog_id() ) {
				return false;
			}

			// Host::is_p2_site() only recognizes WP for Teams sites once this is loaded.
			if ( ! function_exists( '\WPForTeams\is_wpforteams_site' ) && file_exists( WP_CONTENT_DIR . '/lib/wpforteams/functions.php' ) ) {
				require_once WP_CONTENT_DIR . '/lib/wpforteams/functions.php';
			}
		}

		// P2 keeps its own comment experience.
		return ! ( new Host() )->is_p2_site();
	}

	/**
	 * Register the package's features. Safe to call more than once.
	 *
	 * @since 0.1.0
	 *
	 * @return void
	 */
	public static function init() {
		Comment_Form::init();
		Checkpoint::init();
		Avatars::init();
		Block_Editor::init();
		Embeds::init();
		Tracks::init();
	}
}
