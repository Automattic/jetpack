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

		<hr />

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
		<hr />
		<h2>Complete list of classes and files found in Jetpack classmaps and filemaps</h2>
		<?php if ( $data['unreadable_found'] ) : ?>
			<div class="notice notice-error settings-error">
				<p><strong>Attention! Unreadable files have been found in the classmap.</strong></p>
				<p>Examine the contents of the classmaps on this page - the missing files are marked in the list.</p>
			</div>
		<?php else : ?>
			<div class="notice notice-success settings-error">
				<strong>Good news! No unreadable files have been found in the classmap.</strong>
			</div>
		<?php endif; ?>

			<table class="widefat striped health-check-table" role="presentation">
			<tbody>
				<?php foreach ( $data['manifest'] as $classname => $entries ) : ?>
					<?php $counter = 0; ?>
					<?php foreach ( $entries as $entry ) : ?>
					<tr>
						<?php if ( $counter++ ) : ?>
							<td>
								(in <?php echo esc_html( $entry['manifest'] ); ?>)
								<?php if ( ! $entry['is_readable'] ) : ?>
									<br /><strong style="color:red;">FILE UNREADABLE</strong>
								<?php endif; ?>
								<?php if ( $entry['is_included'] ) : ?>
									<br /><strong style="color:green;">Currently loaded</strong>
								<?php endif; ?>
							</td>
						<?php else : ?>
							<td>
								<strong><?php echo esc_html( $classname ); ?></strong><br />
								(in <?php echo esc_html( $entry['manifest'] ); ?>)
								<?php if ( ! $entry['is_readable'] ) : ?>
									<br /><strong style="color:red;">FILE UNREADABLE</strong>
								<?php endif; ?>
								<?php if ( $entry['is_included'] ) : ?>
									<br /><strong style="color:green;">Currently loaded</strong>
								<?php endif; ?>
							</td>
						<?php endif; ?>
						<td><?php echo esc_html( $entry['version'] ); ?></td>
						<td><?php echo esc_html( $entry['path'] ); ?></td>
					</tr>
					<?php endforeach; ?>
					<tr><td colspan="3"><hr /></td></tr>
				<?php endforeach; ?>
			</tbody>
		</table>
		</div>
		<?php
	}

	/**
	 * Based on the existing defined Automattic classes finds the namespace that
	 * is currently in use. We can't do it statically because the namespace is
	 * randomized for each version of the build.
	 *
	 * @return String $namespace
	 * */
	public function get_autoloader_namespace() {
		global $jetpack_autoloader_loader;

		$classname = get_class( $jetpack_autoloader_loader );

		$parts = explode( '\\', $classname );
		array_pop( $parts );

		return join( '\\', $parts );
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

		$manifest        = array();
		$manifest_reader = $container->get( $namespace . '\Manifest_Reader' );
		foreach ( $data['active_plugins'] as $plugin ) {
			$plugin_name                            = basename( $plugin );
			$manifest[ $plugin_name . '_classmap' ] = array();
			$manifest[ $plugin_name . '_filemap' ]  = array();

			$manifest_reader->read_manifests(
				array( $plugin ),
				'vendor/composer/jetpack_autoload_classmap.php',
				$manifest[ $plugin_name . '_classmap' ]
			);
			$manifest_reader->read_manifests(
				array( $plugin ),
				'vendor/composer/jetpack_autoload_filemap.php',
				$manifest[ $plugin_name . '_filemap' ]
			);
		}

		$included_files           = get_included_files();
		$manifest_by_classname    = array();
		$data['unreadable_found'] = false;
		foreach ( $manifest as $plugin_manifest_type => $manifest_data ) {

			foreach ( $manifest_data as $classname => $entry ) {
				$is_readable = is_readable( $entry['path'] );

				if ( ! $is_readable ) {
					$data['unreadable_found'] = true;
				}

				if ( in_array( $entry['path'], $included_files, true ) ) {
					$entry['is_included'] = true;
				} else {
					$entry['is_included'] = false;
				}

				$manifest_by_classname[ $classname ][] = array_merge(
					$entry,
					array(
						'manifest'    => $plugin_manifest_type,
						'is_readable' => $is_readable,
					)
				);
			}
		}
		$data['manifest'] = $manifest_by_classname;

		return $data;
	}

	/**
	 * Display a notice if necessary.
	 */
	public function display_notice() {
		switch ( isset( $_GET['idc_notice'] ) ? $_GET['idc_notice'] : null ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
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
