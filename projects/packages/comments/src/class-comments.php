<?php
/**
 * Jetpack Comments.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * Package entry point.
 */
class Comments {

	/**
	 * Package version.
	 */
	const PACKAGE_VERSION = '0.4.0';

	/**
	 * Blog ID of jetpack.wordpress.com, which serves the Verbum comment iframe to Atomic and self-hosted sites.
	 */
	const JETPACK_SERVER_BLOG_ID = 522232;

	/**
	 * Whether Jetpack Comments should load.
	 *
	 * @since 0.1.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// jetpack.wordpress.com must keep serving the Verbum iframe, so no filter can turn this on there.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && self::JETPACK_SERVER_BLOG_ID === get_current_blog_id() ) {
			return false;
		}

		/**
		 * Load Jetpack Comments in place of the site's existing comment experience.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether to load Jetpack Comments. Default false.
		 */
		return (bool) apply_filters( 'jetpack_comments_new_hotness', false );
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
	}
}
