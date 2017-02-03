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
		error_log('hello' );
		return self::$_instance = is_null( self::$_instance ) ? new self() : self::$_instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		error_log( print_r( 'sds',1 ));
		if ( ! empty( self::$_instance ) ) {
			return;
		}

		if ( ! is_admin() ) {
			return;
		}
	
		add_action( 'admin_notices', array( $this, 'install_notice' ) );

		// add_action( 'pre_current_active_plugins', array( $this, 'hide_required_jetpack_when_running_beta' ) );
		if ( isset( $_GET['jpbetaswap'] ) ) {
			add_action( 'admin_init', array( $this, 'install_or_update' ) );
		}
	}


	public function install_notice() {
		$class = 'notice notice-warning';
		$message = 'You\'re almost ready to run Jetpack betas!';
		$nonce = wp_create_nonce( 'jetpack_beta_install' );

		$button =
			'<a href="' . admin_url( 'plugins.php?jpbetaswap=true&_nonce='. $nonce ) . '" class="button button-primary" id="wpcom-connect">'
			.__( 'Activate The Latest Jetpack Beta', 'jpbeta' ) .
			'</a>';
		printf( '<div class="%1$s"><h2>%2$s</h2><p>%3$s</p></div>', $class, $message, $button );
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

	public function install_or_update() {
		if (  ! isset( $_GET['_nonce'] )  ) {
			return;
		}

		if ( ! wp_verify_nonce( $_GET['_nonce'], 'jetpack_beta_install' ) ) {
			return;
		}
		$this->install_page_1();
		exit;
	}

	public function install_page_1() {
		$temp_path = download_url( 'http://betadownload.jetpack.me/rc/jetpack-pressable.zip' );
		// $temp_path = WP_PLUGIN_DIR.'/jetpack-pressable.zip';

		// copy( 'http://betadownload.jetpack.me/rc/jetpack-pressable.zip', $temp_path );

		error_log( print_r( $temp_path,1 ));
		if ( is_wp_error( $temp_path ) ) {
			wp_die( $temp_path->get_error_message() );
		}


		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array());
		/* initialize the API */
		if ( ! WP_Filesystem( $creds ) ) {
			/* any problems and we exit */
			wp_die( "Jetpack Beta: No File System access" );
		}

		error_log( print_r( $creds,1 ));
		error_log( print_r( WP_PLUGIN_DIR . '/jetpack-dev',1 ) );

		global $wp_filesystem;
		$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR );
		$result = unzip_file( $temp_path, $plugin_path );



		error_log( print_r( array( 'result', $result ),1 ));

		if ( is_wp_error( $result ) ) {
			wp_die( $result->get_error_message() );
		}
		$active_plugins = (array) get_option( 'active_plugins', array() );
		if ( in_array( JETPACK_PLUGIN_ID, $active_plugins ) ) {
			foreach( $active_plugins as &$plugin ) {
				if ( $plugin !== JETPACK_PLUGIN_ID ) $plugin=JETPACK_DEV_PLUGIN;
			}

			update_option( 'active_plugins', $active_plugins );
		}
		wp_safe_redirect( admin_url( 'plugins.php' ) );

	}

}
