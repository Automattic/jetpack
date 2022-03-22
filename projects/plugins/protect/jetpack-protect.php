<?php
/**
 *
 * Plugin Name: Jetpack Protect
 * Plugin URI: https://wordpress.org/plugins/jetpack-protect
 * Description: Share your site’s posts on several social media networks automatically when you publish a new post.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-protect
 *
 * @package automattic/jetpack-protect
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

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JETPACK_PROTECT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_PROTECT_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_PROTECT_PLUGIN_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_PROTECT_PLUGIN_SLUG', 'jetpack-protect' );
define( 'JETPACK_PROTECT_PLUGIN_NAME', 'Jetpack Protect' );
define( 'JETPACK_PROTECT_PLUGIN_URI', 'https://jetpack.com/jetpack-protect' );
define( 'JETPACK_PROTECT_PLUGIN_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
defined( 'JETPACK_PROTECT__API_HOST' ) || define( 'JETPACK_PROTECT__API_HOST', 'https://api.bruteprotect.com/' );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_PROTECT_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_PROTECT_PLUGIN_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Protect plugin', 'jetpack-protect' )
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
						__( 'Your installation of Jetpack Protect is incomplete. If you installed Jetpack Protect from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Protect must have Composer dependencies installed and built via the build command.', 'jetpack-protect' ),
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

// Main plugin class.
new Jetpack_Protect();

// HACKED THIS
require_once JETPACK_PROTECT_PLUGIN_DIR . 'src/protect.php';
