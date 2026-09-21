<?php
/**
 * Screen-ID aliasing around wp-build's generated enqueue check.
 *
 * @package automattic/jetpack-wp-build-polyfills
 */

namespace Automattic\Jetpack\WP_Build_Polyfills;

/**
 * `@wordpress/build` generates an `admin_enqueue_scripts` callback gated on
 * `$screen->id` matching the page's build-time slug, which rarely matches the
 * URL-facing screen ID a consumer's own menu registration produces. Consumers
 * alias the screen ID to that slug around the generated check, then restore
 * it, so nothing else in the request — JITM's message path, Core's `pagenow`
 * JS global — ever sees the alias.
 *
 * Getting the restore dropped, or the two hooked out of order, is the actual
 * bug history behind this class (JETPACK-2689): five of Jetpack's nine
 * wp-build dashboards originally shipped alias-with-no-restore, and the break
 * is invisible on the page itself. {@see self::load_with_alias()} makes that
 * mistake impossible for any new call site.
 */
class WP_Build_Screen_Id {

	/**
	 * Hook $alias on `admin_enqueue_scripts` immediately before calling
	 * $load_wp_build, and $restore immediately after — both at the default
	 * priority, the same one wp-build's generated enqueue check registers at,
	 * so exactly one callback (the generated check) ever sees the aliased
	 * screen ID.
	 *
	 * $alias and $restore are the consumer's own screen-id swap, unchanged by
	 * this method — it only owns their order.
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
