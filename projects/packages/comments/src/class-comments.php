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
	const PACKAGE_VERSION = '0.8.0';

	/**
	 * Whether Jetpack Comments should load.
	 *
	 * @since 0.1.0
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// Blog 522232 is jetpack.wordpress.com, which serves the Verbum iframe to sites on older Jetpack versions.
		return ! ( defined( 'IS_WPCOM' ) && IS_WPCOM && 522232 === get_current_blog_id() );
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
