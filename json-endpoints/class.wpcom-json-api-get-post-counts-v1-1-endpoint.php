<?php

new WPCOM_JSON_API_GET_Post_Counts_V1_1_Endpoint( array(
	'description'   => 'Get number of posts in the post type groups by post status',
	'group'         => 'sites',
	'stat'          => 'sites:X:post-counts:X',
	'force'         => 'wpcom',
	'method'        => 'GET',
	'min_version'   => '1.1',
	'max_version'   => '1.2',
	'path'          => '/sites/%s/post-counts/%s',
	'path_labels'   => array(
		'$site'       => '(int|string) Site ID or domain',
		'$post_type'  => '(string) Post Type',
	),

	'query_parameters' => array(
		'context' => false,
		'author' => '(int) author ID',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1.2/sites/en.blog.wordpress.com/post-counts/page',

	'response_format' => array(
		'counts' => array(
			'all' => '(array) Number of posts by any author in the post type grouped by post status',
			'mine' => '(array) Number of posts by the current user in the post type grouped by post status'
		)
	)
) );

class WPCOM_JSON_API_GET_Post_Counts_V1_1_Endpoint extends WPCOM_JSON_API_Endpoint {

	private $whitelist = array( 'publish' );

	/**
 	 * Build SQL query
 	 *
 	 * @param {String} type - post type
 	 * @param {Number} [author]
 	 * @return {String} SQL query
 	 */
	private function buildCountsQuery( $post_type = 'post', $user_id = null ) {
		global $wpdb;

		$query = "SELECT post_status as status, count(*) as count ";
		$query .= "FROM {$wpdb->posts} ";
		$query .= "WHERE post_type = %s ";
		if ( isset( $user_id ) ) {
			$query .= "AND post_author = %d ";
		}

		$query .= "GROUP BY status";

		return $wpdb->prepare( $query, $post_type, $user_id );
	}

	/**
 	 * Retrive counts using wp_cache
 	 *
 	 * @param {String} $post_type
 	 * @param {Number} [$id]
 	 */
	private function retrieveCounts( $post_type, $id = null) {
		if ( ! isset( $id ) ) {
			$counts = array();
			foreach( (array) wp_count_posts( $post_type ) as $status => $count ) {
				if ( in_array( $status, $this->whitelist ) && $count > 0 ) {
					$counts[ $status ] = (int) $count;
				}
			};

			return $counts;
		}

		global $wpdb;
		$key = 'rest-api-' . $id . '-' . _count_posts_cache_key( $post_type );
		$counts = wp_cache_get( $key, 'counts' );

		if ( false === $counts ) {
			$results = $wpdb->get_results( $this->buildCountsQuery( $post_type, $id ) );
			$counts = $this->filterStatusesByWhiteslist( $results );
			wp_cache_set( $key, $counts, 'counts' );
		}

		return $counts;
	}

	private function filterStatusesByWhiteslist( $in ) {
		$return = array();
		foreach( $in as $result) {
			if ( in_array( $result->status, $this->whitelist ) ) {
				$return[ $result->status ] = (int) $result->count;
			}
		};
		return $return;
	}

	// /sites/%s/post-counts/%s
	public function callback( $path = '', $blog_id = 0, $post_type = 'post' ) {
		if ( ! get_current_user_id() ) {
			return new WP_Error( 'authorization_required', __( 'An active access token must be used to retrieve post counts.', 'jetpack' ), 403 );
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! post_type_exists( $post_type ) ) {
			return new WP_Error( 'unknown_post_type', __( 'Unknown post type requested.', 'jetpack' ), 404 );
		}

		$args = $this->query_args();
		$mine_ID = get_current_user_id();

		if ( current_user_can( 'edit_posts' ) ) {
			array_push( $this->whitelist, 'draft', 'future', 'pending', 'private', 'trash' );
		}

		$return = array(
			'counts' => (array) array(
				'all' => (object) $this->retrieveCounts( $post_type ),
				'mine' => (object) $this->retrieveCounts( $post_type, $mine_ID ),
			)
		);

		// AUTHOR
		if ( isset( $args['author'] ) ) {
			$author_ID = $args['author'];
			$return['counts']['author'] = (object) $this->retrieveCounts( $post_type, $author_ID );
		}

		return (object) $return;
	}
}
