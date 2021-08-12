<?php
/**
 *
 * Plugin Name: Jetpack Backup
 * Plugin URI: https://jetpack.com/jetpack-backup
 * Description: Easily restore or download a backup of your site from a specific moment in time.
 * Version: 0.2.0-beta
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-backup
 *
 * @package automattic/jetpack-backup-plugin
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

// Constant definitions.
define( 'JETPACK_BACKUP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_BACKUP_PLUGIN_ROOT_FILE', __FILE__ );
define( 'JETPACK_BACKUP_PLUGIN_SLUG', 'jetpack-backup' );
define( 'JETPACK_BACKUP_PLUGIN_NAME', 'Jetpack Backup' );
define( 'JETPACK_BACKUP_PLUGIN_URI', 'https://jetpack.com/jetpack-backup' );

// Require Jetpack 10+, if Jetpack is installed.
if ( defined( 'JETPACK__VERSION' ) && version_compare( '10.0.0', JETPACK__VERSION, '>' ) ) {
	add_action(
		'admin_notices',
		function () {
			?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				esc_html_e( 'Jetpack Backup does not require Jetpack; however, if you are running both plugins, you must have version 10 or higher of Jetpack to use Jetpack Backup', 'jetpack-backup' );
				?>
			</p>
		</div>
			<?php
		}
	);
	exit;
}

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_BACKUP_PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for Jetpack Backup plugin', 'jetpack-backup' )
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
						__( 'Your installation of Jetpack Backup is incomplete. If you installed Jetpack Backup from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Backup must have Composer dependencies installed and built via the build command.', 'jetpack-backup' ),
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

	exit;
}

// Main plugin class.
new Jetpack_Backup();
