<?php
/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */

new WPCOM_JSON_API_GET_Comment_Counts_Endpoint( array(
	'description'   => 'Get comment counts for each available status',
	'group'         => 'comments',
	'stat'          => 'comments:1:comment-counts',
	'method'        => 'GET',
	'path'          => '/sites/%s/comment-counts',
	'path_labels'   => array(
		'$site'       => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'post_id' => '(int) post ID for filtering the comment counts by post',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comment-counts',

	'response_format' => array(
		'counts' => array(
			'approved' => '(int) Number of approved comments',
			'awaiting_moderation' => '(int) Number of unapproved comments',
			'trash' => '(int) Number of trash comments',
			'spam' => '(int) Number of spam comments',
			'post-trashed' => '(int) Number of comments whose parent post has been trashed',
			'total_comments' => '(int) Combined number of comments in each category',
			'all' => '(int) Combined number of approved and awaiting_moderation comments',
		)
	)
) );

class WPCOM_JSON_API_GET_Comment_Counts_Endpoint extends WPCOM_JSON_API_Endpoint {

	// /sites/%s/comment-counts
	public function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! get_current_user_id() ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to retrieve comment counts.', 403 );
		}

		if ( ! current_user_can_for_blog( $blog_id, 'moderate_comments' ) ) {
			return new WP_Error( 'authorization_required', 'You are not authorized to view comment counts for this blog.', 403 );
		}

		$args = $this->query_args();

		// If 0 is passed wp_count_comments will default to fetching counts for the whole site.
		$post_id = 0;

		if ( isset( $args['post_id'] ) ) {
			$post_id = intval( $args['post_id'] );

			// Check if post with given id exists.
			if ( ! is_object( get_post( $post_id ) ) ) {
				return new WP_Error( 'invalid_input', 'Provided post_id does not exist', 400 );
			}
		}

		return wp_count_comments( $post_id );
	}
}
