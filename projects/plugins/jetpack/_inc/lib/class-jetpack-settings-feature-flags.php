<?php
/**
 * Jetpack Settings feature flags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers feature flags owned by the Jetpack Settings page.
 *
 * @since $$next-version$$
 */
class Jetpack_Settings_Feature_Flags {

	const WP_BUILD = 'jetpack-settings-wp-build';

	/**
	 * Register the Settings feature flags.
	 *
	 * @return void
	 */
	public static function register() {
		Feature_Flags::register(
			self::WP_BUILD,
			array(
				'default'     => true,
				'description' => 'Render Jetpack Settings through wp-build. Turn it off to serve the webpack page at the same address.',
				'owner'       => 'jetpack',
			)
		);
	}
}

Jetpack_Settings_Feature_Flags::register();
