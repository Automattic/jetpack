<?php

new WPCOM_JSON_API_GET_Comment_History_Endpoint( array(
	'description'   => 'Get the audit history for given comment',
	'group'         => 'comments',
	'stat'          => 'comments:1:comment-history',
	'method'        => 'GET',
	'path'          => '/sites/%s/comment-history/%d',
	'path_labels'   => array(
		'$site'       => '(int|string) Site ID or domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comment-history/11',

	'response_format' => array(
		'comment_history' => '(array) Array of arrays representing the comment history objects.'
	)
) );

class WPCOM_JSON_API_GET_Comment_History_Endpoint extends WPCOM_JSON_API_Endpoint {

	// /sites/%s/comment-history/%d
	public function callback( $path = '', $blog_id = 0, $comment_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! get_current_user_id() ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to retrieve comment history.', 403 );
		}

		if ( ! current_user_can_for_blog( $blog_id, 'edit_posts' ) ) {
			return new WP_Error( 'authorization_required', 'You are not authorized to view comment history on this blog.', 403 );
		}

		if ( ! class_exists( 'Akismet' ) || ! method_exists( 'Akismet', 'get_comment_history' ) ) {
			return new WP_Error( 'akismet_required', 'Akismet plugin must be active for this feature to work', 501 );
		}

		return array( 'comment_history' => Akismet::get_comment_history( $comment_id ) );
	}
}
