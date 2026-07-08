<?php
/**
 *
 * Plugin Name: Jetpack Agents Manager
 * Plugin URI: https://jetpack.com/
 * Description: Standalone plugin that loads the Jetpack Agents Manager package.
 * Version: 0.1.2
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: agents-manager
 *
 * @package automattic/agents-manager-plugin
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
along with this program; if not, see <https://www.gnu.org/licenses/>.
*/

use Automattic\Jetpack\Agents_Manager\Agents_Manager;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'AGENTS_MANAGER_DIR', plugin_dir_path( __FILE__ ) );
define( 'AGENTS_MANAGER_ROOT_FILE', __FILE__ );
define( 'AGENTS_MANAGER_SLUG', 'agents-manager' );

// Jetpack Autoloader.
$agents_manager_autoloader = AGENTS_MANAGER_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $agents_manager_autoloader ) ) {
	require_once $agents_manager_autoloader;
	if ( method_exists( Assets::class, 'alias_textdomains_from_file' ) ) {
		Assets::alias_textdomains_from_file( AGENTS_MANAGER_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for the Jetpack Agents Manager plugin', 'agents-manager' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			$message = sprintf(
				wp_kses(
					/* translators: Placeholder is a link to a support document. */
					__( 'Your installation of Jetpack Agents Manager is incomplete. If you installed it from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Agents Manager must have Composer dependencies installed and built via the build command.', 'agents-manager' ),
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
							'rel'    => array(),
						),
					)
				),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project'
			);
			wp_admin_notice(
				$message,
				array(
					'type'        => 'error',
					'dismissible' => true,
				)
			);
		}
	);

	return;
}

// Initialize the Agents Manager package.
add_action(
	'plugins_loaded',
	function () {
		if ( class_exists( Agents_Manager::class ) ) {
			Agents_Manager::init();
		}
	}
);

// Warn when Jetpack is not active and connected, which Agents Manager requires.
add_action(
	'admin_notices',
	function () {
		$jetpack_active = class_exists( 'Jetpack' ) || defined( 'JETPACK__VERSION' );
		$connected      = class_exists( Connection_Manager::class )
			&& ( new Connection_Manager( 'agents-manager' ) )->is_connected();

		if ( $jetpack_active && $connected ) {
			return;
		}

		$message = esc_html__(
			'Jetpack Agents Manager requires the Jetpack plugin to be active and connected to a WordPress.com account. Some features will be unavailable until that is complete.',
			'agents-manager'
		);
		wp_admin_notice(
			$message,
			array(
				'type'        => 'warning',
				'dismissible' => true,
			)
		);
	}
);
