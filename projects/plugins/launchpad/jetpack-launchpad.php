<?php
/**
 * Plugin Name: Jetpack Launchpad
 * Plugin URI: TBD
 * Description: Jetpack Launchpad to quickly configure purchased products.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-launchpad
 *
 * @package automattic/jetpack-launchpad
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Constant definitions.
define( 'JETPACK_LAUNCHPAD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_LAUNCHPAD_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_LAUNCHPAD_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_LAUNCHPAD_PLUGIN_SLUG', 'jetpack-launchpad' );
define( 'JETPACK_LAUNCHPAD_PLUGIN_NAME', 'Jetpack Launchpad' );
define( 'JETPACK_LAUNCHPAD_PLUGIN_URI', 'https://jetpack.com/jetpack-launchpad' );
define( 'JETPACK_LAUNCHPAD_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_LAUNCHPAD_PLUGIN_DIR . 'vendor/autoload_packages.php';

if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Launchpad plugin', 'jetpack-launchpad' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Launchpad is incomplete. If you installed Jetpack Launchpad from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Launchpad must have Composer dependencies installed and built via the build command.', 'jetpack-launchpad' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#building-your-project'
				);
				?>
			</p>
		</div>
			<?php
		}
	);

	return;
}

// Redirect to plugin page when the plugin is activated.
add_action( 'activated_plugin', array( 'Jetpack_Launchpad', 'plugin_activation' ) );

register_deactivation_hook( __FILE__, array( 'Jetpack_Launchpad', 'plugin_deactivation' ) );

// Main plugin class.
new Jetpack_Launchpad();
