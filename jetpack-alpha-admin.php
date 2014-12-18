<?php

class Jp_Alpha_Admin {

	function __construct() {
		add_action( 'admin_init', array( $this, 'register_assets' ) );
		add_action( 'jetpack_admin_menu', array( $this, 'jp_alpha_register_admin_page' ), 12 );
		add_action( 'admin_init', array( $this, 'jp_alpha_save_settings' )  );
	}

	function register_assets() {

		wp_register_style( 'jpalpha-css', JPALPHA__PLUGIN_FILE . 'css/style.css' );

	}

	function enqueue_assets() {

		wp_enqueue_style( 'jpalpha-css' );

	}

	function jp_alpha_register_admin_page() {
		$parent_slug        = 'jetpack';
		$jpalpha_page_title = 'Jetpack Alpha';
		$jpalpha_menu_title = 'Jetpack Alpha';
		$jpalpha_capability = 'manage_options';
		$jpalpha_menu_slug = 'jetpack-alpha';
		$jpalpha_function = array( $this, 'render_jpalpha_main_page' );

		return add_submenu_page(
			$parent_slug,
			$jpalpha_page_title,
			$jpalpha_menu_title,
			$jpalpha_capability,
			$jpalpha_menu_slug,
			$jpalpha_function
		);

	}

	function render_jpalpha_main_page() {
		include JPALPHA__DIR . 'admin/jpalpha-admin-main.php';
	}

	/**
	 * Save our JPS settings options
	 */
	function jp_alpha_save_settings() {
		$updated = 0;
		
		// Most recent release
		if ( isset( $_POST['jp_alpha_recent_save_nonce'] ) && wp_verify_nonce( $_POST['jp_alpha_recent_save_nonce'], 'jp_alpha_recent_save' ) ) {
			update_option( 'jp_alpha_release_or_branch', 'most_recent' );
			update_option( 'jp_alpha_which', '' );
			add_action( 'admin_notices', array( &$this, 'jpa_updated_success_message' ) );
			$updated = 1;
		}

		// They chose a Release
		if ( isset( $_POST['jp_alpha_release_save_nonce'] ) && wp_verify_nonce( $_POST['jp_alpha_release_save_nonce'], 'jp_alpha_release_save' ) ) {
			update_option( 'jp_alpha_release_or_branch', 'version' );
			update_option( 'jp_alpha_which', $_POST['jp_alpha_release'] );
			add_action( 'admin_notices', array( &$this, 'jpa_updated_success_message' ) );
			$updated = 1;
		}

		// They chose a Branch
		if ( isset( $_POST['jp_alpha_branch_save_nonce'] ) && wp_verify_nonce( $_POST['jp_alpha_branch_save_nonce'], 'jp_alpha_branch_save' ) ) {
			update_option( 'jp_alpha_release_or_branch', 'branch' );
			update_option( 'jp_alpha_which', $_POST['jp_alpha_branch'] );
			add_action( 'admin_notices', array( &$this, 'jpa_updated_success_message' ) );
			$updated = 1;
		}
		
		if( $updated ) {
			set_force_jetpack_update();
		
			$url = wp_nonce_url(self_admin_url('update.php?action=upgrade-plugin&plugin=jetpack/jetpack.php'), 'upgrade-plugin_jetpack/jetpack.php');
		
			wp_redirect( $url );
		}
		
	}

	function jpa_updated_success_message() {
		echo '<div id="message" class="updated below-h2"><p>Settings Updated!</p></div>';
	}

}
