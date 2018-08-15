<?php

require_once dirname( __FILE__ ) . '/utils.php';
/**
 * `upgrader_pre_download` filter for checking plugin before install.
 *
 * @param $reply
 * @param $package
 * @param $wp_upgrader
 *
 * @return bool|WP_Error
 */

$attachment_data = array();

add_filter( 'wp_insert_attachment_data', function ( $data ) use( $attachment_data ) {
	$attachment_data = $data;

	add_filter( 'upgrader_pre_download', function ( $reply, $package, $wp_upgrader ) use( $attachment_data ) {
		// avoid checking if the package source is an URL
		$package_is_url = filter_var( $package, FILTER_VALIDATE_URL );
		if ( $package_is_url ) {
			return false;
		}

		// get plugin slug from package file
		$plugin_data = get_plugin_data_from_package( $package );
		if ( is_wp_error( $plugin_data ) ) {
			return $plugin_data;
		}

		// create request body
		$request_body = array( 'slug' => $plugin_data['slug'] );

		// check the plugin exists in wordpress.org
		$plugin_info = search_plugin_info( $plugin_data['slug'] );
		if ( is_wp_error( $plugin_info ) ) {
			$request_body['unknown-wporg-plugin'] = true;
		}

		$request_body['file_url'] = $attachment_data['guid'];
		$request_body['hash'] = $plugin_data['hash'];
		$request_body['version'] = $plugin_data['version'];

		error_log( "\n [request_body]: \n" . print_r( $request_body, true ) ."\n\n" );

		// check plugin hitting the WP COM API endpoint
		$checking_passed = request_check_plugin( $request_body );
		error_log( "\n [checking_passed]: \n" . print_r( $checking_passed, true ) ."\n\n" );
		if ( is_wp_error( $checking_passed ) ) {
			return $checking_passed;
		}

		// remember, return `false` if plugin is ok. Filters ¯\_(ツ)_/¯
		return false;
	}, 1, 3 );

	return $data;
} );
