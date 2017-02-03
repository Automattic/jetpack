<?php

class Jetpack_Beta_Pressable {
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
		if ( ! $this->is_pressable() ) {
			return;
		}

		if ( ! is_admin() ) {
			return;
		}
		remove_action( 'admin_notices', 'jetpack_beta_jetpack_not_installed' );
		add_action( 'admin_notices', array( $this, 'install_notice' ) );
		add_action( 'pre_current_active_plugins', array(
			$this,
			'hide_required_jetpack_when_running_beta_on_pressable'
		) );

		if ( isset( $_GET['jpbetaswap'] ) ) {
			add_action( 'admin_init', array( $this, 'install_1' ) );
		}

		if ( isset( $_GET['jpbetaswap2'] ) ) {
			add_action( 'admin_init', array( $this, 'install_2' ) );
		}
	}

	public static function is_pressable() {
		return (bool) defined( 'IS_PRESSABLE' ) && IS_PRESSABLE;
	}

	public function install_notice() {
		if( is_plugin_active( 'jetpack-pressable-beta/jetpack.php' ) ) {
			return;
		}

		$class = 'notice notice-warning';
		$message = 'You\'re almost ready to run Jetpack betas!';
		$button = '<a href="' . admin_url( 'plugins.php?jpbetaswap' ) . '" class="button button-primary" id="wpcom-connect">Activate The Latest Jetpack Beta</a>';
		printf( '<div class="%1$s"><h2>%2$s</h2><p>%3$s</p></div>', $class, $message, $button );
	}

	public function hide_required_jetpack_when_running_beta_on_pressable() {
		if ( ! is_plugin_active( 'jetpack-pressable-beta/jetpack.php' ) ) {
			return;
		}

		global $wp_list_table;

		$plugin_list_table_items = $wp_list_table->items;
		foreach ( $plugin_list_table_items as $key => $val ) {
			if ( in_array( $key, array( 'jetpack/jetpack.php' ) ) ) {
				unset( $wp_list_table->items[ $key ] );
			}
		}
	}

	public function install_1() {
		if( ! is_plugin_active( 'jetpack-pressable-beta/jetpack.php' ) ) {

			if ( is_plugin_active( 'jetpack/jetpack.php' ) ) {
				deactivate_plugins( 'jetpack/jetpack.php' );
			}

			copy( 'http://betadownload.jetpack.me/rc/jetpack-pressable.zip', WP_PLUGIN_DIR.'/jetpack-pressable.zip' );

			$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array());
			/* initialize the API */
			if ( ! WP_Filesystem( $creds ) ) {
				/* any problems and we exit */
				wp_die( "Jetpack Beta: No File System access" );
			}
			global $wp_filesystem;
			$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR );
			$result = unzip_file( $plugin_path . '/jetpack-pressable.zip', $plugin_path );
			// Set the option to rc
			update_option( 'jp_beta_type', 'rc_only' );
			?>
			<br /><br /><br />
			<center>Activating Jetpack Beta...</center>
			<br />
			<center><small>Stuck?  <a href="?jpbetaswap2">Click to continue...</a></small></center>
			<script type="text/javascript">
				<!--
				window.location = "?jpbetaswap2"
				//-->
			</script>
			<?php
			exit;
		}
	}

	public function install_2() {
		activate_plugins( 'jetpack-pressable-beta/jetpack.php' );
		?>
		<br /><br /><br />
		<center>Almost finished...</center>
		<br />
		<center><small>Stuck? <a href="<?php echo self_admin_url( 'admin.php?page=jetpack-beta' ) ?>">Click to continue...</a></small></center>
		<script type="text/javascript">
			<!--
			window.location = "<?php echo self_admin_url( 'admin.php?page=jetpack-beta' ) ?>"
			//-->
		</script>
		<?php
		exit;
	}
}
