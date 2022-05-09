<?php
/**
 * Plugin compatibility file.
 *
 * @package wpcomsh
 */

/**
 * Class Jetpack_Plugin_Compatibility
 */
class Jetpack_Plugin_Compatibility {

	/**
	 * Jetpack_Plugin_Compatibility constructor.
	 *
	 * @param array $incompatible_plugins Plugin file locations and html messaging in the format:
	 * array(
	 *   'example-plugin/example-plugin.php' => 'example-plugin interferes with Jetpack sync and has been disabled.'
	 * )
	 * The html messaging is presented as a dismissable error admin notice when an unsupported plugin is deactivated.
	 */
	public function __construct( $incompatible_plugins ) {
		if ( ! is_array( $incompatible_plugins ) || count( $incompatible_plugins ) === 0 ) {
			return;
		}

		$this->incompatible_plugins = $incompatible_plugins;
		// Disable plugin activation for unsupported plugins.
		add_action( 'load-plugins.php', array( $this, 'check_plugin_compatibility' ) );
		// Replace "Activate" plugin link for plugins that should not be activated (plugins.php).
		add_filter( 'plugin_action_links', array( $this, 'disable_plugin_activate_link' ), 10, 2 );
		add_filter( 'network_admin_plugin_action_links', array( $this, 'disable_plugin_activate_link' ), 10, 2 );
		// Replace "Install" plugin link for plugins that not should not be activated (plugin-install.php).
		add_filter( 'plugin_install_action_links', array( $this, 'disable_plugin_install_link' ), 10, 2 );
		// Print any notices about plugin deactivation.
		add_action( 'admin_notices', array( $this, 'incompatible_plugin_notices' ) );
		// Disable My Jetpack page.
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );
	}

	/**
	 * Admin notices.
	 *
	 * @var array
	 */
	protected $admin_notices = array();

	/**
	 * Deactivates incompatible plugins.
	 */
	public function check_plugin_compatibility() {
		foreach ( $this->incompatible_plugins as $plugin => $message ) {
			if ( ! is_plugin_active( $plugin ) ) {
				continue;
			}
			deactivate_plugins( $plugin );
			$deactivated_plugin    = explode( '/', $plugin )[0];
			$this->admin_notices[] = '<div class="notice notice-error is-dismissible"><p><strong>' . esc_html( $message ) . '</strong></p></div>';
			if ( isset( $_GET['activate'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
				unset( $_GET['activate'] ); // phpcs:ignore WordPress.Security.NonceVerification
			}
		}
	}

	/**
	 * Displays admin notices.
	 */
	public function incompatible_plugin_notices() {
		foreach ( $this->admin_notices as $notice ) {
			echo $notice; // phpcs:ignore WordPress.Security.EscapeOutput
		}
	}

	/**
	 * Disables plugin activations links for incompatible plugins.
	 *
	 * @param array  $actions     Plugin actions.
	 * @param string $plugin_file Plugin file.
	 *
	 * @return array Filtered array of plugin actions.
	 */
	public function disable_plugin_activate_link( $actions, $plugin_file ) {
		if ( array_key_exists( $plugin_file, $this->incompatible_plugins ) ) {
			$actions['activate'] = 'Disabled';
			unset( $actions['edit'] );
		}
		return $actions;
	}

	/**
	 * Disables plugin install links for incompatible plugins.
	 *
	 * @param array $action_links Plugin actions.
	 * @param array $plugin       Plugin information.
	 *
	 * @return string[]
	 */
	public function disable_plugin_install_link( $action_links, $plugin ) {
		$needle = "{$plugin['slug']}/";
		foreach ( $this->incompatible_plugins as $disallowed_plugin => $message ) {
			/*
			 * The naming convention of $disallowed_plugin is <slug>/<file>.php so we are checking if
			 * the string $needle is included into $disallowed_plugin from the `0` position.
			 */
			if ( strpos( $disallowed_plugin, $needle ) === 0 ) {
				$action_links = array( 'Not Supported' );
				break;
			}
		}

		return $action_links;
	}
}
