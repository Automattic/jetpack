<?php
/**
 * Plugin Name: Jetpack Beta Tester
 * Plugin URI: https://jetpack.com/beta/
 * Description: Use the Beta plugin to get a sneak peek at new features and test them on your site.
 * Version: 3.1.3
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * Update URI: https://jetpack.com/download-jetpack-beta/
 * License: GPLv2 or later
 * Text Domain: jetpack-beta
 *
 * @package automattic/jetpack-beta
 */

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JPBETA__PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
define( 'JPBETA_VERSION', '3.1.3' );

define( 'JETPACK_BETA_PLUGINS_URL', 'https://betadownload.jetpack.me/plugins.json' );

/**
 * This is where the loading of Jetpack Beta begins.
 *
 * First, we try to load our composer autoloader.
 *
 * - If it fails, we "pause" Jetpack Beta by ending the loading process
 *   and displaying an admin_notice to inform the site owner.
 *   (We want to fail gracefully if `composer install` has not been executed yet, so we are checking for the autoloader.)
 * - If it succeeds, we continue.
 */
$jetpack_beta_autoloader = plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';
if ( is_readable( $jetpack_beta_autoloader ) ) {
	require $jetpack_beta_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
				/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack Beta is incomplete. If you installed Jetpack Beta from GitHub, please refer to this document to set up your development environment: %1$s', 'jetpack-beta' ),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md'
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running Jetpack Beta without having run composer install.
	 *
	 * @since 3.0.0
	 */
	function jetpack_beta_admin_missing_autoloader() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Beta is incomplete. If you installed Jetpack Beta from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.', 'jetpack-beta' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md'
				);
				?>
			</p>
		</div>
		<?php
	}

	add_action( 'admin_notices', 'jetpack_beta_admin_missing_autoloader' );
	return;
}

add_action( 'init', array( Automattic\JetpackBeta\AutoupdateSelf::class, 'instance' ) );

set_error_handler( array( Automattic\JetpackBeta\Hooks::class, 'custom_error_handler' ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler

register_activation_hook( __FILE__, array( Automattic\JetpackBeta\Hooks::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Automattic\JetpackBeta\Hooks::class, 'deactivate' ) );

add_action( 'init', array( Automattic\JetpackBeta\Hooks::class, 'instance' ) );
add_action( 'muplugins_loaded', array( Automattic\JetpackBeta\Hooks::class, 'is_network_enabled' ) );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'jetpack-beta', Automattic\JetpackBeta\CliCommand::class );
}
