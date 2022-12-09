<?php
/**
 * Block Editor - BlazePress Promote feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\PromotePosts;

// Feature name.
const FEATURE_NAME = 'post-publish-promote-post-panel';

use Automattic\Jetpack\Connection\Client;

/**
 * Retriece if the user has the can_promote_widget flag
 *
 * @return boolean
 */
function get_user_can_promote_posts() {
	$wpcom_request = Client::wpcom_json_api_request_as_user(
		'/me',
		'1.1',
		array(),
		null,
		'rest'
	);

	$response_code = wp_remote_retrieve_response_code( $wpcom_request );
	if ( 200 === $response_code ) {
		return json_decode( wp_remote_retrieve_body( $wpcom_request ) )->can_promote_posts;
	} else {
		return false;
	}
}

add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				FEATURE_NAME,
			)
		);
	}
);

// Set the  post-publish-promote-post-panel availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
