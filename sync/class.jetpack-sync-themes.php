<?php

class Jetpack_Sync_Themes {

	static $check_sum_id = 'function_check_sum';

	static function init() {
		add_action( 'init', array( __CLASS__, 'sync_theme_data' ) );
	}

	/**
	 * Triggers a sync of information specific to the current theme.
	 */
	static function sync_theme_data() {
		add_action( 'switch_theme', array( 'Jetpack', 'refresh_theme_data' ) );
//		$this->sync->mock_option( 'featured_images_enabled', array( 'Jetpack', 'featured_images_enabled' ) );
	}

	static function refresh_theme_data() {
		/**
		 * Fires whenever a theme change is made.
		 *
		 * @since 3.8.1
		 *
		 * @param string featured_images_enabled
		 * @param boolean Whether featured images are enabled or not
		 */
		do_action( 'add_option_jetpack_featured_images_enabled', 'jetpack_featured_images_enabled', Jetpack::featured_images_enabled() );
	}
}