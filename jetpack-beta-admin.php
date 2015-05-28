<?php

class JP_Beta_Admin {

	function __construct() {
		add_action( 'admin_init', array( $this, 'register_assets' ) );
		add_action( 'jetpack_admin_menu', array( $this, 'jp_beta_register_admin_page' ), 12 );
		add_action( 'admin_init', array( $this, 'jp_beta_save_settings' )  );
	}

	function register_assets() {

		wp_register_style( 'jpbeta-css', JPBETA__PLUGIN_FILE . 'css/style.css' );

	}

	function enqueue_assets() {

		wp_enqueue_style( 'jpbeta-css' );

	}

	function jp_beta_register_admin_page() {
		$parent_slug        = 'jetpack';
		$jpbeta_page_title = 'Jetpack Beta';
		$jpbeta_menu_title = 'Jetpack Beta';
		$jpbeta_capability = 'manage_options';
		$jpbeta_menu_slug = 'jetpack-beta';
		$jpbeta_function = array( $this, 'render_jpbeta_main_page' );

		return add_submenu_page(
			$parent_slug,
			$jpbeta_page_title,
			$jpbeta_menu_title,
			$jpbeta_capability,
			$jpbeta_menu_slug,
			$jpbeta_function
		);

	}

	function render_jbeta_main_page() {
		include JPBETA__DIR . 'admin/jpbeta-admin-main.php';
	}

	/**
	 * Save our JPS settings options
	 */
	function jp_beta_save_settings() {
		$updated = 0;
		
		// Most recent release
		if ( isset( $_POST['jp_beta_recent_save_nonce'] ) && wp_verify_nonce( $_POST['jp_beta_recent_save_nonce'], 'jp_beta_recent_save' ) ) {
			update_option( 'jp_beta_release_or_branch', 'most_recent' );
			update_option( 'jp_beta_which', '' );
			add_action( 'admin_notices', array( &$this, 'jpb_updated_success_message' ) );
			$updated = 1;
		}

		// They chose a Release
		if ( isset( $_POST['jp_beta_release_save_nonce'] ) && wp_verify_nonce( $_POST['jp_beta_release_save_nonce'], 'jp_beta_release_save' ) ) {
			update_option( 'jp_beta_release_or_branch', 'version' );
			update_option( 'jp_beta_which', $_POST['jp_beta_release'] );
			add_action( 'admin_notices', array( &$this, 'jpb_updated_success_message' ) );
			$updated = 1;
		}

		// They chose a Branch
		if ( isset( $_POST['jp_beta_branch_save_nonce'] ) && wp_verify_nonce( $_POST['jp_beta_branch_save_nonce'], 'jp_beta_branch_save' ) ) {
			update_option( 'jp_beta_release_or_branch', 'branch' );
			update_option( 'jp_beta_which', $_POST['jp_beta_branch'] );
			add_action( 'admin_notices', array( &$this, 'jpb_updated_success_message' ) );
			$updated = 1;
		}
		
		if( $updated ) {
			set_force_jetpack_update();
		

		
			//wp_redirect( $url );
		}
		
	}

	function jpb_updated_success_message() {
		$url = wp_nonce_url(self_admin_url('update.php?action=upgrade-plugin&plugin=jetpack/jetpack.php'), 'upgrade-plugin_jetpack/jetpack.php');
		echo '<div id="message" class="updated below-h2"><p>Settings Updated! <a href="'.$url.'">Press this</a></p></div>';
	}

}
