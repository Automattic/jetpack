<?php
/**
 * Plugin Name: Jetpack Beta Tester
 * Plugin URI: https://jetpack.com/beta/
 * Description: Use the Beta plugin to get a sneak peek at new features and test them on your site.
 * Version: 3.0.0-alpha
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
define( 'JPBETA_VERSION', '3.0.0-alpha' );

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

require_once plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';

add_action( 'init', array( Automattic\JetpackBeta\AutoupdateSelf::class, 'instance' ) );

set_error_handler( array( Automattic\JetpackBeta\Hooks::class, 'custom_error_handler' ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler

register_activation_hook( __FILE__, array( Automattic\JetpackBeta\Hooks::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Automattic\JetpackBeta\Hooks::class, 'deactivate' ) );

add_action( 'init', array( Automattic\JetpackBeta\Hooks::class, 'instance' ) );
add_action( 'muplugins_loaded', array( Automattic\JetpackBeta\Hooks::class, 'is_network_enabled' ) );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	WP_CLI::add_command( 'jetpack-beta', Automattic\JetpackBeta\CliCommand::class );
}
