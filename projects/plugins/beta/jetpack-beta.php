<?php
/**
 * Plugin Name: Jetpack Beta Tester
 * Plugin URI: https://jetpack.com/beta/
 * Description: Use the Beta plugin to get a sneak peek at new features and test them on your site.
 * Version: 2.5.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
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

/**
 * How this plugin works.
 * Jetpack beta manages files inside jetpack-dev folder this folder should contain
 */
define( 'JPBETA__PLUGIN_FOLDER', basename( __DIR__ ) );
define( 'JPBETA__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JPBETA__PLUGIN_FILE', __FILE__ );
define( 'JPBETA_VERSION', '2.5.0-alpha' );

define( 'JPBETA_DEFAULT_BRANCH', 'rc_only' );

define( 'JETPACK_BETA_MANIFEST_URL', 'https://betadownload.jetpack.me/jetpack-branches.json' );
define( 'JETPACK_ORG_API_URL', 'https://api.wordpress.org/plugins/info/1.0/jetpack.json' );
define( 'JETPACK_GITHUB_API_URL', 'https://api.github.com/repos/Automattic/Jetpack/' );
define( 'JETPACK_GITHUB_URL', 'https://github.com/Automattic/jetpack' );
define( 'JETPACK_DEFAULT_URL', 'https://jetpack.com' );

define( 'JETPACK_DEV_PLUGIN_SLUG', 'jetpack-dev' );

define( 'JETPACK_PLUGIN_FILE', 'jetpack/jetpack.php' );
define( 'JETPACK_DEV_PLUGIN_FILE', 'jetpack-dev/jetpack.php' );

define( 'JETPACK_BETA_REPORT_URL', 'https://jetpack.com/contact-support/beta-group/' );

defined( 'JETPACK_GREEN' ) || define( 'JETPACK_GREEN', '#2fb41f' );

/**
 * This is where the loading of Jetpack Beta.
 *
 * First, we try to load our composer autoloader.
 *
 * - If it fails, we "pause" Jetpack by ending the loading process
 *   and displaying an admin_notice to inform the site owner.
 *   (We want to fail gracefully if `composer install` has not been executed yet, so we are checking for the autoloader.)
 * - If it succeeds, we require load-jetpack.php, where all legacy files are required,
 *   and where we add on to various hooks that we expect to always run.
 */
$jetpack_beta_autoloader = JPBETA__PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_beta_autoloader ) ) {
	require $jetpack_beta_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
			/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack Beta is incomplete. If you installed Jetpack from GitHub, please refer to this document to set up your development environment: %1$s', 'jetpack' ),
				'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md'
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running Jetpack without having run composer install.
	 *
	 * @since 7.4.0
	 */
	function jetpack_admin_missing_autoloader() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
					/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Beta is incomplete. If you installed Jetpack from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Ensure you have run jetpack install plugins/beta.', 'jetpack' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md'
				);
				?>
			</p>
		</div>
		<?php
	}

	add_action( 'admin_notices', 'jetpack_admin_missing_autoloader' );
	return;
}

require_once 'class-jetpack-beta-autoupdate-self.php';
require_once 'class-jetpackbetaclicommand.php';
add_action( 'init', array( 'Jetpack_Beta_Autoupdate_Self', 'instance' ) );

// The main plugin class file.
require_once __DIR__ . '/class-jetpack-beta.php';

set_error_handler( array( 'Jetpack_Beta', 'custom_error_handler' ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler

register_activation_hook( __FILE__, array( 'Jetpack_Beta', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Beta', 'deactivate' ) );

add_action( 'init', array( 'Jetpack_Beta', 'instance' ) );
add_action( 'muplugins_loaded', array( 'Jetpack_Beta', 'is_network_enabled' ) );
