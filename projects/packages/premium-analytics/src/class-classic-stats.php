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
 * @since $$next-version$$
 */
class Classic_Stats {

	const RETIRED_FLAG = 'jetpack-stats-classic-page-retired';

	/**
	 * Register the flag. Hosts call this on load, before anything reads it on `plugins_loaded`.
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
	 * Whether the classic Stats page should give way to Stats v2; the page stays while Stats v2 is off.
	 *
	 * @return bool
	 */
	public static function is_retired() {
		return Feature_Flags::is_enabled( self::RETIRED_FLAG );
	}
}
