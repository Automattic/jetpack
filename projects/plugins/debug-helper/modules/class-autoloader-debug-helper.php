<?php // phpcs:disable WordPress.PHP.DevelopmentFunctions.error_log_print_r
/**
 * Plugin Name: Autoloader Debugger
 * Description: View current autoloader classmaps and cache settings.
 * Author: Bestpack
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Class Autoloader_Debug_Helper
 */
class Autoloader_Debug_Helper {

	/**
	 * IDC_Simulator constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'autoloader_debug_helper_register_submenu_page' ), 1000 );

		if ( isset( $_GET['autoloader_notice'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'admin_notices', array( $this, 'display_notice' ) );
		}
	}

	/**
	 * Register's submenu.
	 */
	public function autoloader_debug_helper_register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Autoloader Debug Helper',
			'Autoloader Debug Helper',
			'manage_options',
			'autoloader-debug-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		$data = $this->get_autoloader_data();

		?>
		<div class="wrap">
		<h1>Autoloader Debug Helper 😱!</h1>
		<p>View current autoloader classmaps and cache settings</p>

		<hr>

		<h2>Active plugins with autoloader data</h2>
		<table class="widefat striped health-check-table" role="presentation">
			<tbody>
				<?php foreach ( $data['active_plugins'] as $plugin ) : ?>
					<tr><td><?php echo esc_html( $plugin ); ?></td></tr>
				<?php endforeach; ?>
			</tbody>
		</table>

		<h2>Active plugins with cached autoloader data</h2>
		<table class="widefat striped health-check-table" role="presentation">
			<tbody>
				<?php foreach ( $data['cached_plugins'] as $plugin ) : ?>
					<tr><td><?php echo esc_html( $plugin ); ?></td></tr>
				<?php endforeach; ?>
			</tbody>
		</table>

		<h2>Latest plugin by Autoloader logic</h2>
		<p>This is the Autoloader from the plugin and its version that Autoloader considers the newest
			and uses to load the classmaps.</p>

		<table class="widefat striped health-check-table" role="presentation">
			<tbody>
			<tr>
				<td>Latest plugin</td>
				<td><?php echo esc_html( $data['latest_plugin'] ); ?></td>
			</tr>
			<tr>
				<td>Latest plugin version</td>
				<td><?php echo esc_html( $data['latest_plugin_version'] ); ?></td>
			</tr>
			</tbody>
		</table>
		</div>
		<?php
	}

	/**
	 * Finds and returns Automattic classes that are available in the global scope.
	 *
	 * @return Array $classes
	 */
	public function get_a8c_classes() {
		$classes = array();

		foreach ( get_declared_classes() as $class ) {

			if ( 0 === strpos( $class, 'Automattic' ) ) {
				$classes [] = $class;
			}
		}

		return $classes;
	}

	/**
	 * Based on the existing defined Automattic classes finds the namespace that
	 * is currently in use. We can't do it statically because the namespace is
	 * randomized for each version of the build.
	 *
	 * @return String $namespace
	 * */
	public function get_autoloader_namespace() {
		$classes = $this->get_a8c_classes();

		foreach ( $classes as $class ) {

			if ( 0 === strpos( $class, 'Automattic\Jetpack\Autoloader' ) ) {
				$parts = explode( '\\', $class );
				array_pop( $parts );

				return join( '\\', $parts );
			}
		}
	}

	/**
	 * Returns an object of the autoloader container type.
	 *
	 * @return \Automattic\Jetpack\Autoloader_Container $container
	 */
	public function get_autoloader_container() {
		$classname = $this->get_autoloader_namespace() . '\Container';

		return new $classname();
	}

	/**
	 * Returns autoloader debugging data to be displayed on the screen.
	 *
	 * @return Array $data
	 */
	public function get_autoloader_data() {
		$data = array();

		$container = $this->get_autoloader_container();
		$namespace = $this->get_autoloader_namespace();

		$plugins_handler        = $container->get( $namespace . '\Plugins_Handler' );
		$data['active_plugins'] = $plugins_handler->get_active_plugins( true, true );
		$data['cached_plugins'] = $plugins_handler->get_cached_plugins();

		$plugin_locator         = $container->get( $namespace . '\Plugin_Locator' );
		$data['current_plugin'] = $plugin_locator->find_current_plugin();

		$autoloader_locator = $container->get( $namespace . '\Autoloader_Locator' );
		$filename           = basename( $data['current_plugin'] );
		$plugin_data        = get_plugin_data( $data['current_plugin'] . '/' . $filename . '.php' );

		$data['latest_plugin']         = $autoloader_locator->find_latest_autoloader(
			$data['active_plugins'],
			$plugin_data['Version']
		);
		$data['latest_plugin_version'] = $plugin_data['Version'];

		return $data;
	}

	/**
	 * Display a notice if necessary.
	 */
	public function display_notice() {
		switch ( $_GET['idc_notice'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			case self::STORED_SUCCESS_NOTICE_TYPE:
				return $this->admin_notice__stored_success();

			case self::REQUEST_SUCCESS_NOTICE_TYPE:
				return $this->admin_notice__request_success();

			case self::UNKNOWN_ERROR_NOTICE_TYPE:
				return $this->admin_notice__unknown_error();

			default:
				return;
		}
	}
}

add_action( 'plugins_loaded', 'register_autoloader_debug_helper', 1000 );

/**
 * Load the helper
 */
function register_autoloader_debug_helper() {
	if ( class_exists( 'Jetpack_Options' ) ) {
		new Autoloader_Debug_Helper();
	} else {
		add_action( 'admin_notices', 'autoloader_debug_helper_jetpack_not_active' );
	}
}

/**
 * Notice for if Jetpack is not active.
 */
function autoloader_debug_helper_jetpack_not_active() {
	echo '<div class="notice info"><p>Jetpack Debug tools: Jetpack_Options package must be present for the Autoloader Debug Helper to work.</p></div>';
}

// phpcs:enable
