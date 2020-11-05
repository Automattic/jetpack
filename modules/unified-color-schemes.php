<?php

use Automattic\Jetpack\Connection\Client;

function ucs_admin_color_override() {

	$default_color_scheme = 'default';

	$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
		'me/preferences',
		'2',
		array(
			'method' => 'GET',
		),
		null,
		'wpcom'
	);

	if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return $default_color_scheme;
	}

	$response_body = json_decode( wp_remote_retrieve_body( $response ), true );

	return ! empty( $response_body['colorScheme'] ) ? $response_body['colorScheme'] : $default_color_scheme;
}

function ucs_setup_admin() {
	add_filter( 'get_user_option_admin_color', 'ucs_admin_color_override' );
}

add_action( 'admin_init', 'ucs_setup_admin', 6 );



