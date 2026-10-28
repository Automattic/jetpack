<?php
/**
 * Stats feature flags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the flag that retires the classic Stats page in favor of Stats v2.
 *
 * @since 16.4
 */
class Jetpack_Stats_Feature_Flags {

	const CLASSIC_PAGE_RETIRED = 'jetpack-stats-classic-page-retired';

	/**
	 * Register the flag.
	 *
	 * @return void
	 */
	public static function register() {
		Feature_Flags::register(
			self::CLASSIC_PAGE_RETIRED,
			array(
				'default'     => false,
				'description' => 'Turn Stats v2 on for every site and stop registering the classic Stats page; old admin.php?page=stats links open Stats v2.',
				'owner'       => 'jetpack-stats',
			)
		);
	}

	/**
	 * Whether the flag asks the classic Stats page to give way to Stats v2; the page stays while Stats v2 is off.
	 *
	 * Read on `plugins_loaded`, so a filter forcing it has to be added before that.
	 *
	 * @return bool
	 */
	public static function is_classic_page_retired() {
		return Feature_Flags::is_enabled( self::CLASSIC_PAGE_RETIRED );
	}
}

Jetpack_Stats_Feature_Flags::register();
