<?php
/**
 * Plugin Name: Jetpack AI POC
 * Plugin URI: https://jetpack.com/ai-poc
 * Description: AI-powered actions for WordPress using Anthropic's Claude API with Neuron AI agentic implementation.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-ai-poc
 * Requires Plugins: abilities-api
 *
 * @package automattic/jetpack-ai-poc
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
	exit( 0 );
}

define( 'JETPACK_AI_POC_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_AI_POC_ROOT_FILE', __FILE__ );
define( 'JETPACK_AI_POC_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_AI_POC_SLUG', 'jetpack-ai-poc' );
define( 'JETPACK_AI_POC_NAME', 'Jetpack AI POC' );
define( 'JETPACK_AI_POC_URI', 'https://jetpack.com/jetpack-ai-poc' );
define( 'JETPACK_AI_POC_FOLDER', dirname( plugin_basename( __FILE__ ) ) );
define( 'JETPACK_AI_POC_VERSION', '0.1.0-alpha' );

// Jetpack Autoloader.
$jetpack_autoloader = JETPACK_AI_POC_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		$i18n_map = JETPACK_AI_POC_DIR . 'jetpack_vendor/i18n-map.php';
		if ( file_exists( $i18n_map ) ) {
			\Automattic\Jetpack\Assets::alias_textdomains_from_file( $i18n_map );
		}
	}
} else {
	// Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			'Error loading autoloader file for Jetpack AI POC plugin'
		);
	}

	add_action(
		'admin_notices',
		function () {
			if ( ! function_exists( 'get_current_screen' ) ) {
				return;
			}
			$screen = get_current_screen();
			if ( ! $screen || 'plugins' !== $screen->id ) {
				return;
			}

			$message = sprintf(
				wp_kses(
					'Your installation of Jetpack AI POC is incomplete. If you installed Jetpack AI POC from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack AI POC must have Composer dependencies installed and built via the build command.',
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

// Load WordPress Abilities API from vendor if not already loaded.
if ( ! class_exists( 'WP_Ability' ) ) {
	$abilities_api_file = JETPACK_AI_POC_DIR . 'vendor/wordpress/abilities-api/abilities-api.php';

	if ( file_exists( $abilities_api_file ) ) {
		// Load the Abilities API from our vendor directory.
		require_once $abilities_api_file;

		// Ensure the abilities_api_init hook is triggered by accessing the registry.
		// This initializes the registry and fires the hook for other plugins to register abilities.
		if ( class_exists( 'WP_Abilities_Registry' ) ) {
			WP_Abilities_Registry::get_instance();
		}
	} else {
		// Show error if Abilities API is not available.
		add_action(
			'admin_notices',
			function () {
				$message = sprintf(
					wp_kses(
						/* translators: %s: URL to the Abilities API plugin */
						__( 'Jetpack AI POC requires the <a href="%s" target="_blank" rel="noopener noreferrer">WordPress Abilities API</a>. Please run composer install in the plugin directory.', 'jetpack-ai-poc' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/WordPress/abilities-api'
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
}

// Add "Settings" link to plugins page.
add_filter(
	'plugin_action_links_' . JETPACK_AI_POC_FOLDER . '/jetpack-ai-poc.php',
	function ( $actions ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'options-general.php#jetpack_ai_poc_section' ) ) . '">' . __( 'Settings', 'jetpack-ai-poc' ) . '</a>';
		array_unshift( $actions, $settings_link );

		return $actions;
	}
);

register_deactivation_hook( __FILE__, array( 'Jetpack_AI_POC', 'plugin_deactivation' ) );

// Main plugin class.
new Jetpack_AI_POC();
