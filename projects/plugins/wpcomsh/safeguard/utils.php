<?php
/**
 * Safeguard utilities file.
 *
 * @package safeguard
 */

namespace Safeguard;

use Automattic\Jetpack\Connection\Client as Jetpack_Client;
use Jetpack_Options;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use WP_Error;
use WPCOMSH_Log;
use ZipArchive;

const DOTORG_API_HOST             = 'https://api.wordpress.org';
const DOTORG_PLUGINS_HOST         = DOTORG_API_HOST . '/plugins';
const DOTORG_PLUGIN_INFO_ENDPOINT = DOTORG_PLUGINS_HOST . '/info/1.0/';

/**
 * Perform a request to the .org API to get information about the given plugin.
 *
 * @param  string $slug Plugin slug.
 * @return array|WP_Error
 */
function search_plugin_info( $slug ) {
	$request     = array(
		'action'  => 'plugin_information',
		'timeout' => 15,
	);
	$response    = wp_remote_post( DOTORG_PLUGIN_INFO_ENDPOINT . $slug, array( 'body' => $request ) );
	$plugin_info = maybe_unserialize( $response['body'] );

	if ( $plugin_info && property_exists( $plugin_info, 'error' ) ) {
		return new WP_Error( 'search_plugin_error', $plugin_info->error );
	}

	return $plugin_info;
}

/**
 * Perform a request to WP COM API endpoint to check the plugin.
 *
 * @param string $slug Plugin slug.
 * @param array  $body Array data with needed information to check the plugin.
 * @return WP_Error|array Error instance if something fails, the response if plugin is accepted.
 */
function request_check_plugin( $slug, $body ) {
	$wpcom_blog_id = Jetpack_Options::get_option( 'id' );
	$endpoint      = "/sites/{$wpcom_blog_id}/plugins/{$slug}/check";

	$request = Jetpack_Client::wpcom_json_api_request_as_blog(
		$endpoint,
		Jetpack_Client::WPCOM_JSON_API_VERSION,
		array( 'method' => 'POST' ),
		$body
	);

	if ( is_wp_error( $request ) ) {
		return $request;
	}

	if ( ! is_array( $request ) || ! isset( $request['body'] ) ) {
		return new WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'wpcomsh' ),
			array( 'status' => 500 )
		);
	}

	$response_code = wp_remote_retrieve_response_code( $request );
	$response      = json_decode( wp_remote_retrieve_body( $request ), true ) ?? array();

	$error_data = array(
		'wpcom_blog_id' => $wpcom_blog_id,
		'endpoint'      => $endpoint,
		'response'      => $response,
	);

	if ( $response_code === 404 ) {
		$error_data['response-code'] = 404;
		return new WP_Error( 'checking_plugin_failed', 'Request route not found.', $error_data );
	}

	// It should be changed passing the `reject` action.
	if ( $response_code === 400 ) {
		$error_data['response-code'] = 400;
		return new WP_Error( 'unaccepted_plugin', $response['message'] ?? '', $error_data );
	}

	if ( empty( $response ) || ! $response_code || $response_code < 200 || $response_code >= 300 ) {
		return new WP_Error(
			'checking_plugin_failed',
			"Invalid response from API - {$response_code}",
			$error_data
		);
	}

	if ( isset( $response['action'] ) && $response['action'] === 'reject' ) {
		return new WP_Error( 'unaccepted_plugin', $response['message'] ?? '', $response['threats'] ?? '' );
	}

	$result = array(
		'action'     => (string) ( $response['action'] ?? '' ),
		'message'    => (string) ( $response['message'] ?? '' ),
		'registered' => (string) ( $response['registered'] ?? '' ),
	);

	if ( array_key_exists( 'threats', $response ) ) {
		$result['threats'] = $response['threats'];
	}

	return $result;
}

/**
 * Tries to decompress the package into a temporary folder.
 *
 * @param string $package Plugin package.
 * @return string|WP_Error
 */
function uncompress_package( $package ) {
	$package_info     = pathinfo( $package );
	$package_filename = $package_info['filename'];

	$current_upload_folder = wp_upload_dir();
	$path                  = $current_upload_folder['path'];

	$tmp_package_folder = "{$path}/{$package_filename}";

	// Try to unzip the file.
	$zip_handler = new ZipArchive();
	$was_opened  = $zip_handler->open( $package );
	if ( $was_opened !== true ) {
		return new WP_Error( 'process_failed', 'The zip file could not be opened.' );
	}

	$was_uncompressed = $zip_handler->extractTo( $tmp_package_folder );
	if ( ! $was_uncompressed ) {
		return new WP_Error( 'process_failed', 'The zip file could not be decompressed.' );
	}

	$zip_handler->close();

	return $tmp_package_folder;
}

/**
 * Clean folder structure.
 *
 * @param string $dir Directory path.
 *
 * @return bool
 */
function clean_folder( $dir ) {
	if ( ! is_dir( $dir ) ) {
		return false;
	}

	$it        = new RecursiveDirectoryIterator( $dir, RecursiveDirectoryIterator::SKIP_DOTS );
	$old_files = new RecursiveIteratorIterator( $it, RecursiveIteratorIterator::CHILD_FIRST );

	foreach ( $old_files as $old_file ) {
		if ( $old_file->isDir() ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
			rmdir( $old_file->getRealPath() );
		} else {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $old_file->getRealPath() );
		}
	}
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
	rmdir( $dir );

	return true;
}

/**
 * It tries to get the plugin-slug and plugin-version from the file package.
 *
 * Some information:
 *
 *  > If you use a directory to contain your Plugin files, then the directory name will be used by WordPress
 *  > when checking the WordPress Plugin Repository for updates. If your plugin only consists of a single PHP
 *  > file, then the file name will be used. If WordPress tells you that a newer version of your Plugin is
 *  > available, but you know nothing about a newer version, beware. It's possible that another Plugin with the
 *  > same directory name or file name is in the Plugin Repository, and it's this one which WordPress is seeing.
 *
 *  - https://codex.wordpress.org/Writing_a_Plugin#Names.2C_Files.2C_and_Locations
 *
 * @param string $package Path of the package. Generally it's a .zip file.
 * @return array|WP_Error  Slug and version Array, or a WP_Error instance if something fails.
 */
function get_plugin_data_from_package( $package ) {
	if ( ! is_file( $package ) ) {
		return new WP_Error( 'process_package_fails', 'Invalid plugin file.' );
	}

	$tmp_plugin_folder = uncompress_package( $package );
	if ( is_wp_error( $tmp_plugin_folder ) ) {
		return $tmp_plugin_folder;
	}

	$tmp_plugin_dir = @ opendir( $tmp_plugin_folder ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	$plugin_files   = array();
	if ( $tmp_plugin_dir ) {
		while ( ( $file = readdir( $tmp_plugin_dir ) ) !== false ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			if ( substr( $file, 0, 1 ) === '.' ) {
				continue;
			}
			if ( is_dir( $tmp_plugin_folder . '/' . $file ) ) {
				// Get plugin slug from the folder.
				$plugin_folder = $tmp_plugin_folder . '/' . $file;

				$plugins_subdir = @ opendir( $tmp_plugin_folder . '/' . $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
				if ( $plugins_subdir ) {
					while ( ( $subfile = readdir( $plugins_subdir ) ) !== false ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
						if ( substr( $subfile, 0, 1 ) === '.' ) {
							continue;
						}
						if ( substr( $subfile, -4 ) === '.php' ) {
							$plugin_files[] = "$file/$subfile";
						}
					}
					closedir( $plugins_subdir );
				}
			} elseif ( substr( $file, -4 ) === '.php' ) {
					$plugin_files[] = $file;

					// Get plugin slug from the file.
					$plugin_folder = $tmp_plugin_folder . '/' . $file;
			}
		}
		closedir( $tmp_plugin_dir );
	}

	if ( ! $plugin_folder ) {
		return new WP_Error( 'process_package_fails', 'Getting plugin slug from package failed.' );
	}

	if ( empty( $plugin_files ) ) {
		return new WP_Error( 'process_package_fails', 'Package does not have valid files.' );
	}

	// Finish getting plugin slug.
	$plugin_pathinfo = pathinfo( $plugin_folder );
	$plugin_slug     = $plugin_pathinfo['filename'];

	if ( ! $plugin_slug ) {
		return new WP_Error( 'process_package_fails', 'Plugin slug not found.' );
	}

	$result = array(
		'slug' => $plugin_slug,
		'hash' => hash_file( 'sha256', $package ),
	);

	/*
	 * Populate result array with plugin data, check if the plugin name is defined,
	 * and get the plugin version if it exists.
	 */
	foreach ( $plugin_files as $plugin_file ) {
		$plugin_filename = "{$tmp_plugin_folder}/{$plugin_file}";
		if ( ! is_readable( $plugin_folder ) ) {
			continue;
		}

		$plugin_data = get_plugin_data( $plugin_filename, false, false );
		if ( empty( $plugin_data['Name'] ) ) {
			continue;
		}

		$result['header'] = $plugin_data;
	}

	if ( ! array_key_exists( 'header', $result ) ) {
		return new WP_Error( 'process_package_fails', 'Package does not have valid header.' );
	}

	// Copy version from header.
	if ( array_key_exists( 'Version', $result['header'] ) ) {
		$result['version'] = $result['header']['Version'];
	}
	if ( array_key_exists( 'version', $result['header'] ) ) {
		$result['version'] = $result['header']['version'];
	}

	// Clean temporary folder.
	clean_folder( $tmp_plugin_folder );

	return $result;
}

/**
 * Logs safeguard errors.
 *
 * @param WP_Error|string $error WP_Error object or error message.
 * @param array           $extra Optional. Additional information about the error. Defaults to empty array.
 *
 * @return WP_Error|string
 */
function log_safeguard_error( $error, $extra = array() ) {
	$message = 'Safeguard: ';

	if ( is_wp_error( $error ) ) {
		$message .= $error->get_error_message();
	} else {
		$message .= $error;
	}

	WPCOMSH_Log::unsafe_direct_log(
		$message,
		wp_json_encode( $extra, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES )
	);

	return $error;
}
