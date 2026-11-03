<?php
/**
 * The flag that retires the classic Stats page in favor of Stats v2.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Owns the classic Stats retirement flag, so every plugin that bundles Stats v2 reads the same switch.
 *
 * @since 0.16.0
 */
final class Classic_Stats {

	const RETIRED_FLAG = 'jetpack-stats-classic-page-retired';

	/**
	 * Register the flag, so feature-flag tooling lists it.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::RETIRED_FLAG,
			array(
				'default'     => false,
				'description' => 'Turn Stats v2 on for every site and stop registering the classic Stats page; old admin.php?page=stats links open Stats v2.',
				'owner'       => 'jetpack-stats',
			)
		);
	}

	/**
	 * Whether the retirement flag is on; callers still keep the classic page until Stats v2 has booted.
	 *
	 * Read on `plugins_loaded`, so a filter forcing it has to be added before that.
	 *
	 * @return bool
	 */
	public static function is_retired() {
		return Feature_Flags::is_enabled( self::RETIRED_FLAG );
	}

	/**
	 * The classic Stats page's URL, or null once it is retired or while no plugin registers a `stats` menu page.
	 *
	 * Retired wins over the menu, since WordPress.com Simple still registers an older `index.php?page=stats`. Reads
	 * the menu, not `$admin_page_hooks`, which keys top-level pages only and misses Jetpack's Stats submenu.
	 *
	 * @since $$next-version$$
	 *
	 * @return string|null
	 */
	public static function page_url() {
		if ( self::is_retired() ) {
			return null;
		}

		$url = function_exists( 'menu_page_url' ) ? menu_page_url( 'stats', false ) : '';

		return '' === $url ? null : $url;
	}
}
