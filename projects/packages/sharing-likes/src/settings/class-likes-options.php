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
	public static function likes_enabled_sitewide(): bool {
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
	 * Whether the Comment Likes option is on. Only WordPress.com Simple reads it.
	 */
	public static function comment_likes_enabled(): bool {
		/** This filter is documented in projects/plugins/jetpack/modules/likes/jetpack-likes-settings.php */
		return (bool) apply_filters( 'jetpack_comment_likes_enabled', get_option( 'jetpack_comment_likes_enabled', false ) );
	}

	/**
	 * Turn Likes on or off for every post.
	 *
	 * Off is the presence of `disabled_likes`, not a falsy value: the Likes code tests it with `get_option()` alone.
	 *
	 * @param bool $enabled Whether Likes should be on.
	 */
	public static function set_likes_enabled( bool $enabled ): void {
		if ( $enabled ) {
			delete_option( 'disabled_likes' );
		} else {
			update_option( 'disabled_likes', 1 );
		}
	}

	/**
	 * Turn the Reblog button on or off for every post. WordPress.com Simple only.
	 *
	 * @param bool $enabled Whether Reblogs should be on.
	 */
	public static function set_reblogs_enabled( bool $enabled ): void {
		if ( $enabled ) {
			delete_option( 'disabled_reblogs' );
		} else {
			update_option( 'disabled_reblogs', 1 );
		}
	}

	/**
	 * Turn Comment Likes on or off. WordPress.com Simple only.
	 *
	 * @param bool $enabled Whether comments can be liked.
	 */
	public static function set_comment_likes_enabled( bool $enabled ): void {
		update_option( 'jetpack_comment_likes_enabled', $enabled ? 1 : 0 );
	}
}
