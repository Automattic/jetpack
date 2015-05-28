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

	function render_jpbeta_main_page() {
		include JPBETA__DIR . 'admin/jpbeta-admin-main.php';
	}

	/**
	 * Save our JPS settings options
	 */
	function jp_beta_save_settings() {
		$updated = 0;
		$jp_beta_type = get_option( 'jp_beta_type' );
		
		
		// Most recent release
		if ( isset( $_POST['jp_beta_recent_save_nonce'] ) && wp_verify_nonce( $_POST['jp_beta_recent_save_nonce'], 'jp_beta_recent_save' ) ) {
			update_option( 'jp_beta_type', sanitize_text_field( $_POST[ 'version_type' ] ) );
			
			if( ! $_POST[ 'auto_update' ] ) {
				update_option( 'jp_beta_autoupdate', 'no' );
			} else {
				update_option( 'jp_beta_autoupdate', 'sure' );
			}
			
			if( $jp_beta_type != $_POST['version_type'] ) {
				add_action( 'admin_notices', array( &$this, 'jpb_updated_success_message' ) );
				$updated = 1;
			}
		}
		
		if( $updated ) {
			set_force_jetpack_update();
		}
		
	}

	function jpb_updated_success_message() {
		$url = wp_nonce_url( self_admin_url('update.php?action=upgrade-plugin&plugin=jetpack/jetpack.php'), 'upgrade-plugin_jetpack/jetpack.php' );
		echo '<div id="message" class="updated below-h2"><p>' . __('Settings Updated!', 'jpbeta') . ' <a href="' . $url . '">' . __('Please click here to update now.', 'jpbeta') . '</a></p></div>';
	}

}
