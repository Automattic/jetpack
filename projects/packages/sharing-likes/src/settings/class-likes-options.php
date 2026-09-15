<?php
/**
 * Reads the Likes options without depending on the Likes module being loaded.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Jetpack_Options;

/**
 * The Likes options, as the settings screen needs them.
 *
 * `Jetpack_Likes_Settings` carries equivalent accessors, but it only loads with
 * the Likes module, and this screen renders whether that module is on or off.
 */
final class Likes_Options {

	/**
	 * Whether Likes are on for every post.
	 */
	public static function enabled_sitewide(): bool {
		/** This filter is documented in projects/plugins/jetpack/modules/likes/jetpack-likes-settings.php */
		return (bool) apply_filters(
			'wpl_is_enabled_sitewide',
			! Jetpack_Options::get_option_and_ensure_autoload( 'disabled_likes', 0 )
		);
	}

	/**
	 * Whether the Reblog button shows on posts. WordPress.com Simple only.
	 */
	public static function reblogs_enabled_sitewide(): bool {
		/** This filter is documented in projects/plugins/jetpack/modules/likes/jetpack-likes-settings.php */
		return (bool) apply_filters( 'wpl_reblogging_enabled_sitewide', ! get_option( 'disabled_reblogs' ) );
	}

	/**
	 * Whether comments can be liked. WordPress.com Simple only.
	 */
	public static function comment_likes_enabled(): bool {
		/** This filter is documented in projects/plugins/jetpack/modules/likes/jetpack-likes-settings.php */
		return (bool) apply_filters( 'jetpack_comment_likes_enabled', get_option( 'jetpack_comment_likes_enabled', false ) );
	}
}
