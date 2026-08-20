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

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether Jetpack Comments should load.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Load Jetpack Comments in place of the site's existing comment experience.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether to load Jetpack Comments. Default false.
		 */
		return (bool) apply_filters( 'jetpack_comments_new_hotness', false );
	}

	/**
	 * Register the package's features. Safe to call more than once.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function init() {
		Comment_Form::init();
		Avatars::init();
	}
}
