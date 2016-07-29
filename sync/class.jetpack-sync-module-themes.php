<?php

class Jetpack_Sync_Module_Themes extends Jetpack_Sync_Module {
	function name() {
		return 'themes';
	}

	public function init_listeners( $callable ) {
		add_action( 'switch_theme', array( $this, 'sync_theme_support' ) );
		add_action( 'jetpack_sync_current_theme_support', $callable );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_theme_data', $callable );
	}

	public function sync_theme_support() {
		/**
		 * Fires when the client needs to sync theme support info
		 * Only sends theme support attributes whitelisted in Jetpack_Sync_Defaults::$default_theme_support_whitelist
		 *
		 * @since 4.2.0
		 *
		 * @param object the theme support hash
		 */
		do_action( 'jetpack_sync_current_theme_support' , $this->get_theme_support_info() );
	}

	public function enqueue_full_sync_actions( $config ) {
		/**
		 * Tells the client to sync all theme data to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand theme data (should always be true)
		 */
		do_action( 'jetpack_full_sync_theme_data', true );
		return 1; // The number of actions enqueued
	}

	public function estimate_full_sync_actions( $config ) {
		return 1;
	}
	
	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_theme_data', array( $this, 'expand_theme_data' ) );
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_theme_data' );
	}

	function expand_theme_data() {
		return array( $this->get_theme_support_info() );
	}

	private function get_theme_support_info() {
		global $_wp_theme_features;

		$theme_support = array();

		foreach ( Jetpack_Sync_Defaults::$default_theme_support_whitelist as $theme_feature ) {
			$has_support = current_theme_supports( $theme_feature );
			if ( $has_support ) {
				$theme_support[ $theme_feature ] = $_wp_theme_features[ $theme_feature ];
			}
		}

		return $theme_support;
	}
}
