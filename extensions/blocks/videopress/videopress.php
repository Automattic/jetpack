<?php
namespace Automattic\Jetpack\Extensions\VideoPress;

use Automattic\Jetpack\Connection\Client;

const FEATURE_NAME = 'videopress';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Updates video metadata via the WPCOM REST API.
 * @param $request WP_REST_Request object
 *
 * @return bool If the request was successful
 */
function videopress_block_update_meta( $request ) {
	$json_params = $request->get_json_params();
	if ( ! isset( $json_params ) || ! isset( $json_params['guid'] ) ) {
		return false;
	}

	$endpoint = "videos/{$json_params['guid']}";
	$args = array(
		'method' => 'POST',
		'headers' => array( 'Content-Type' => 'application/json' ),
	);

	$result = Client::wpcom_json_api_request_as_blog(
		$endpoint,
		Client::WPCOM_JSON_API_VERSION,
		$args,
		json_encode( $json_params )
	);

	if ( is_wp_error( $result ) ) {
		return false;
	}

	return true;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'wpcom/v2', '/videopress/meta', array(
		'methods' => 'POST',
		'callback' => __NAMESPACE__ . '\videopress_block_update_meta',
		'permission_callback' => function () {
			return current_user_can( 'edit_posts' );
		},
	) );
} );
