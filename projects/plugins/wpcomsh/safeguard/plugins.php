<?php
/**
 * Safeguard file.
 *
 * @package safeguard
 */

namespace Safeguard;

/**
 * Plugin Name: Safeguard
 * Description: Checking plugin for safety and compatibility.
 * Version: 0.0.6
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

require_once __DIR__ . '/utils.php';

$attachment_data = array();

add_filter(
	'wp_insert_attachment_data',
	function ( $data ) use ( $attachment_data ) {
		$attachment_data = $data;

		add_filter(
			'upgrader_pre_download',
			/**
			 * `upgrader_pre_download` filter for checking plugin before install.
			 *
			 * @param $reply
			 * @param $package
			 * @param $wp_upgrader
			 *
			 * @return bool|\WP_Error
			 */
			function ( $reply, $package, $wp_upgrader ) use ( $attachment_data ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
				// Ensure package is a plugin.
				if (
					! property_exists( $wp_upgrader, 'skin' ) ||
					! is_a( $wp_upgrader->skin, 'Plugin_Installer_Skin' )
				) {
					return false;
				}

				// Avoid checking if the package source is a URL.
				$package_is_url = filter_var( $package, FILTER_VALIDATE_URL );
				if ( $package_is_url ) {
					return false;
				}

				// Get plugin slug from package file.
				$plugin_data = get_plugin_data_from_package( $package );
				if ( is_wp_error( $plugin_data ) ) {
					log_safeguard_error( $plugin_data, array( 'package' => $package ) );
					return false;
				}

				// Create request body.
				$request_body = array();

				// Check the plugin exists in wordpress.org.
				$plugin_info = search_plugin_info( $plugin_data['slug'] );
				if ( is_wp_error( $plugin_info ) ) {
					$request_body['not-registered'] = true;
					log_safeguard_error( 'Plugin not registered in wporg', array( 'package' => $package ) );
				}

				$request_body['file_url'] = $attachment_data['guid'];
				$request_body['hash']     = $plugin_data['hash'];
				$request_body['version']  = $plugin_data['version'];

				// check plugin hitting the WP COM API endpoint
				$checking_passed = request_check_plugin( $plugin_data['slug'], $request_body );
				if ( is_wp_error( $checking_passed ) ) {
					log_safeguard_error(
						$checking_passed,
						array(
							'package' => $package,
							'info'    => $checking_passed->get_error_data(),
						)
					);
				}

				// Remember, return `false` if plugin is ok. Filters ¯\_(ツ)_/¯
				return false;
			},
			1,
			3
		);

		return $data;
	}
);
