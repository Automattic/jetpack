<?php
/**
 * Screen-ID aliasing around wp-build's generated enqueue check.
 *
 * @package automattic/jetpack-wp-build-polyfills
 */

namespace Automattic\Jetpack\WP_Build_Polyfills;

/**
 * Orders the screen-ID alias around wp-build's generated enqueue check.
 *
 * Dropping the restore leaves JITM's message path reading a screen ID that never
 * existed, and nothing on the page looks wrong. See JETPACK-2689.
 */
class WP_Build_Screen_Id {

	/**
	 * Hooks $alias, calls $load_wp_build, then hooks $restore, all at the default
	 * priority — the one wp-build's generated check registers at, so that callback
	 * is the only thing that ever sees the aliased screen ID.
	 *
	 * @param callable $alias         Consumer's screen-id alias callback.
	 * @param callable $restore       Consumer's screen-id restore callback, matching $alias.
	 * @param callable $load_wp_build Loads wp-build's generated registration file.
	 * @return void
	 */
	public static function load_with_alias( callable $alias, callable $restore, callable $load_wp_build ) {
		add_action( 'admin_enqueue_scripts', $alias );
		$load_wp_build();
		add_action( 'admin_enqueue_scripts', $restore );
	}
}
