<?php

new WPCOM_JSON_API_Bulk_Delete_Post_Endpoint( array(
	'description' => 'Delete multiple posts. Note: If the trash is enabled, this request will send non-trashed posts to the trash. Trashed posts will be permanently deleted.',
	'group'       => 'posts',
	'stat'        => 'posts:1:bulk-delete',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/delete',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
	),
	'request_format' => array(
		'post_ids' => '(array) An array of Post IDs to delete or trash.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/delete',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'post_ids' => array( 881, 882 ),
		),

	)
) );

class WPCOM_JSON_API_Bulk_Delete_Post_Endpoint extends WPCOM_JSON_API_Update_Post_v1_1_Endpoint {
	// /sites/%s/posts/delete
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$input = $this->input();

		$post_ids = (array) $input['post_ids'];

		$result = array(
			'results' => array(),
		);

		foreach( $post_ids as $post_id ) {
			$result['results'][ $post_id ] = $this->delete_post( $path, $blog_id, $post_id );
		}

		return $result;
	}
}
