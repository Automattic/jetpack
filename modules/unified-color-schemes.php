<?php

use Automattic\Jetpack\Connection\Client;

function ucs_admin_color_override( $color ) {

	$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
		'me/preferences', // path
		'1.1', // REST API version
		array(
			'method' => 'GET',
		),
		null, // body
		'rest' // REST API root. Default is `wpcom`.
	);

	$response_body = wp_remote_retrieve_body( $response );

	echo '<pre>';
	var_dump( $response_body );
	echo '</pre>';

	return 'blue';
}

function ucs_setup_admin() {
	add_filter( 'get_user_option_admin_color', 'ucs_admin_color_override' );
}

add_action( 'admin_init', 'ucs_setup_admin', 6 );



