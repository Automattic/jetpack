<?php
/**
 * Fixture data for featured post thumbnai tests.
 *
 * @package automattic/jetpack
 */

/**
 * Build attachment response fixture.
 *
 * @param int $attachment_id The attachment post ID.
 * @return WP_Error|WP_HTTP_Response|WP_REST_Response The actual rest response.
 */
function build_attachment_response_fixture( $attachment_id ) {
	$data = array();

	$data['media_details'] = wp_get_attachment_metadata( $attachment_id );

	return rest_ensure_response( $data );
}
