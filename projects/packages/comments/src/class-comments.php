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
	const PACKAGE_VERSION = '0.9.1';

	/**
	 * Whether Jetpack Comments handles comments on the current blog. Checked again where comments render,
	 * since a process can load it for one blog and then switch to another.
	 *
	 * @since 0.1.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// Blog 522232 is jetpack.wordpress.com, which serves the Verbum iframe to sites on older Jetpack versions.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && 522232 === get_current_blog_id() ) {
			return false;
		}

		/**
		 * Whether Jetpack Comments handles comments on the current blog.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Default true.
		 */
		return (bool) apply_filters( 'jetpack_comments_enabled', true );
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
