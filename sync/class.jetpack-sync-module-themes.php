<?php

class Jetpack_Sync_Module_Themes extends Jetpack_Sync_Module {
	function name() {
		return 'themes';
	}

	public function init_listeners( $callable ) {
		add_action( 'switch_theme', array( $this, 'sync_theme_support' ) );
		add_action( 'jetpack_sync_current_theme_support', $callable );
	}

	// TODO: distinct action for full sync
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_themes', $callable );
	}

	public function sync_theme_support() {
		$this->enqueue_theme_support_as_action( 'jetpack_sync_current_theme_support' );		
	}

	public function enqueue_full_sync_actions() {
		return $this->enqueue_theme_support_as_action( 'jetpack_full_sync_themes' );
	}

	function enqueue_theme_support_as_action( $action_name ) {
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
		do_action( $action_name, $theme_support );

		return 1; // The number of actions enqueued
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_themes' );
	}
}
