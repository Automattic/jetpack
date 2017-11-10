<?php

new WPCOM_JSON_API_Get_Post_v1_1_Endpoint( array(
	'description' => 'Get a single post (by ID).',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'group'       => 'posts',
	'stat'        => 'posts:1',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/posts/7'
) );

new WPCOM_JSON_API_Get_Post_v1_1_Endpoint( array(
	'description' => 'Get a single post (by slug).',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'group'       => 'posts',
	'stat'        => 'posts:slug',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/slug:%s',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$post_slug' => '(string) The post slug (a.k.a. sanitized name)',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/posts/slug:blogging-and-stuff',
) );

class WPCOM_JSON_API_Get_Post_v1_1_Endpoint extends WPCOM_JSON_API_Post_v1_1_Endpoint {
	// /sites/%s/posts/%d      -> $blog_id, $post_id
	// /sites/%s/posts/slug:%s -> $blog_id, $post_id
	function callback( $path = '', $blog_id = 0, $post_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		$site = $this->get_platform()->get_site( $blog_id );

		if ( false !== strpos( $path, '/posts/slug:' ) ) {
			$post_id = $site->get_post_id_by_name( $post_id );
			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM &&
				! in_array( get_post_type( $post_id ), array( false, 'post', 'revision' ) ) ) {
			$this->load_theme_functions();
		}

		$return = $this->get_post_by( 'ID', $post_id, $args['context'] );

		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		if ( ! $site->current_user_can_access_post_type( $return['type'], $args['context'] ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'posts' );

		return $return;
	}
}
