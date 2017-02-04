<?php

/**
 * Class Jetpack_Beta_Self_Install
 *
 * Installs the specified Jetpack Version
 *
 * If nothing in the jetpack-dev folder
 * -> Download the zip and place it there.
 * -> Activate the plugin.
 * 
 */
class Jetpack_Beta_Self_Install {
	protected static $_instance = null;

	/**
	 * Main Instance
	 */
	public static function instance() {
		return self::$_instance = is_null( self::$_instance ) ? new self() : self::$_instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		if ( ! empty( self::$_instance ) ) {
			return;
		}

		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_notices', array( $this, 'show_notice' ) );
		add_action( 'jetpack_beta_empty', array( $this, 'show_install_notice_in_header' ) );


		// add_action( 'pre_current_active_plugins', array( $this, 'hide_required_jetpack_when_running_beta' ) );
		if ( isset( $_GET['jetpack_beta_install'] ) ) {
			add_action( 'admin_init', array( $this, 'install' ) );
		}

		if ( isset( $_GET['jetpack_beta_activate'] ) ) {
			add_action( 'admin_init', array( $this, 'activate' ) );
		}
	}

	public function show_install_notice_in_header() {
		if ( ! $this->is_jetpack_dev_installed() ) {
			wp_die( $this->show_install_notice() );
		}

		if ( ! $this->is_jetpack_dev_active( ) ) {
			wp_die( $this->show_activate_notice() );
		}
	}

	public function is_jetpack_dev_installed() {
		return file_exists( WP_PLUGIN_DIR . '/' . JETPACK_DEV_PLUGIN );
	}

	public function is_jetpack_dev_active() {
		$active_plugins = (array) get_option( 'active_plugins', array() );
		return in_array( JETPACK_DEV_PLUGIN, $active_plugins );
	}

	public function show_notice() {
		global $pagenow;

		// Only show on plugins.php page
		if ( 'plugins.php' !== $pagenow  ) {
			return;
		}
		if ( ! $this->is_jetpack_dev_installed() ) {
			echo $this->show_install_notice();
			return;
		}

		if ( ! $this->is_jetpack_dev_active() ) {
			echo $this->show_activate_notice();
			return;
		}

	}

	public function show_install_notice() {
		$class = 'notice notice-warning';
		$message = 'You\'re almost ready to run Jetpack betas!';
		$nonce = wp_create_nonce( 'jetpack_beta_install' );

		$button =
			'<a href="' . admin_url( 'plugins.php?jetpack_beta_install=true&_nonce='. $nonce ) . '" class="button button-primary" id="wpcom-connect">'
			.__( 'Install the Latest Jetpack Beta', 'jpbeta' ) .
			'</a>';
		return sprintf( '<div class="%1$s"><h2>%2$s</h2><p>%3$s</p></div>', $class, $message, $button );
	}

	public function show_activate_notice() {
		$class = 'notice notice-warning';
		$message = 'You\'re almost ready to run Jetpack betas!';
		$nonce = wp_create_nonce( 'jetpack_beta_activate' );

		$button =
			'<a href="' . admin_url( 'plugins.php?jetpack_beta_activate=true&_nonce='. $nonce ) . '" class="button button-primary" id="wpcom-connect">'
			.__( 'Activate the latest Beta of the Jetpack Plugin', 'jpbeta' ) .
			'</a>';
		return sprintf( '<div class="%1$s"><h2>%2$s</h2><p>%3$s</p></div>', $class, $message, $button );
	}



	public function hide_required_jetpack_when_running_beta() {
		global $wp_list_table;

		$plugin_list_table_items = $wp_list_table->items;
		foreach ( $plugin_list_table_items as $key => $val ) {
			if ( in_array( $key, array( 'jetpack/jetpack.php' ) ) ) {
				unset( $wp_list_table->items[ $key ] );
			}
		}
	}

	public function replace_active_plugin( $current_plugin, $replace_with_plugin, $force_activate = false ) {
		$active_plugins = (array) get_option( 'active_plugins', array() );
		$new_active_plugins = array();

		foreach( $active_plugins as $plugin ) {
			$new_active_plugins[] = ( $plugin === $current_plugin ? $replace_with_plugin : $plugin );
		}

		if ( $force_activate && ! in_array( $replace_with_plugin, $new_active_plugins ) ) {
			$new_active_plugins[] = $replace_with_plugin;
		}
		update_option( 'active_plugins', $new_active_plugins );
	}

	public function install() {
		if ( ! isset( $_GET['_nonce'] ) && ! wp_verify_nonce( $_GET['_nonce'], 'jetpack_beta_install' ) ) {
			return;
		}

		if ( $this->is_jetpack_dev_installed() ) {
			new WP_Error( 'Plugin already installed' );
			return;
		}

		$result = $this->proceed_to_install();
		exit;
	}

	public function activate() {
		if ( ! isset( $_GET['_nonce'] ) && ! wp_verify_nonce( $_GET['_nonce'], 'jetpack_beta_active' ) ) {
			return;
		}

		if ( ! $this->is_jetpack_dev_installed() ) {
			// This shouldn't happen
			new WP_Error( 'Jetpack plugin is not installed!' );
			return;
		}

		if ( $this->is_jetpack_dev_active() ) {
			new WP_Error( 'Jetpack plugin is active' );
			return;
		}

		$this->replace_active_plugin( JETPACK_PLUGIN_ID, JETPACK_DEV_PLUGIN, true );
		wp_safe_redirect( admin_url( 'plugins.php' ) );
		exit;
	}

	public function proceed_to_install() {
		$temp_path = download_url( 'https://betadownload.jetpack.me/branches/master/jetpack-dev.zip' );

		if ( is_wp_error( $temp_path ) ) {
			wp_die( $temp_path->get_error_message() );
		}

		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array());
		/* initialize the API */
		if ( ! WP_Filesystem( $creds ) ) {
			/* any problems and we exit */
			wp_die( "Jetpack Beta: No File System access" );
		}

		global $wp_filesystem;
		$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR . '/' . JETPACK_PLUGIN_SLUG );
		$result = unzip_file( $temp_path, $plugin_path );

		if ( is_wp_error( $result ) ) {
			wp_die( $result->get_error_message() );
		}
		$this->replace_active_plugin( JETPACK_PLUGIN_ID, JETPACK_DEV_PLUGIN, true );
		wp_safe_redirect( admin_url( 'plugins.php' ) );
	}
}
