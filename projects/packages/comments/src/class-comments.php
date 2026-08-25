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
	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Whether Jetpack Comments should load.
	 *
	 * @since 0.1.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
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
		Avatars::init();
	}
}
