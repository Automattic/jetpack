<?php

class Jetpack_Sync_Module_Themes extends Jetpack_Sync_Module {
	function name() {
		return "themes";
	}

	public function init_listeners( $handler ) {
		add_action( 'switch_theme', array( $this, 'send_theme_info' ) );
		add_action( 'jetpack_sync_current_theme_support', $handler, 10 );
	}

	function send_theme_info() {
		global $_wp_theme_features;

		$theme_support = array();

		foreach ( Jetpack_Sync_Defaults::$default_theme_support_whitelist as $theme_feature ) {
			$has_support = current_theme_supports( $theme_feature );
			if ( $has_support ) {
				$theme_support[ $theme_feature ] = $_wp_theme_features[ $theme_feature ];
			}

		}

		/**
		 * Fires when the client needs to sync theme support info
		 * Only sends theme support attributes whitelisted in Jetpack_Sync_Defaults::$default_theme_support_whitelist
		 *
		 * @since 4.2.0
		 *
		 * @param object the theme support hash
		 */
		do_action( 'jetpack_sync_current_theme_support', $theme_support );
		return 1; // The number of actions enqueued
	}
}
