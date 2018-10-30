<?php
/**
 * This is the endpoint class for `/site` endpoints.
 *
 */
class Jetpack_Core_API_Site_Endpoint {

	/**
	 * Returns the result of `/sites/%s/features` endpoint call.
	 * @return object $features has 'active' and 'available' properties each of which contain feature slugs.
	 *                  'active' is a simple array of slugs that are active on the current plan.
	 *                  'available' is an object with keys that represent feature slugs and values are arrays
	 *                     of plan slugs that enable these features
	 */
	public static function get_features() {

		// Make the API request
		$request = sprintf( '/sites/%d/features', Jetpack_Options::get_option( 'id' ) );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		// Decode the results
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or plan details returned
		if ( ! is_array( $results ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array(
				'code' => 'success',
				'message' => esc_html__( 'Site features correctly received.', 'jetpack' ),
				'data' => wp_remote_retrieve_body( $response ),
			)
		);
	}

	/**
	 * Returns the result of `/sites/%s/posts/%d/related` endpoint call.
	 * Results are not cached and are retrieved in real time.
	 *
	 * @since 6.7.0
	 *
	 * @param int ID of the post to get related posts of
	 *
	 * @return array
	 */
	public static function get_related_posts( $api_request ) {
		$params = $api_request->get_params();
		$post_id = ! empty( $params['post_id'] ) ? absint( $params['post_id'] ) : 0;

		if ( ! $post_id ) {
			return new WP_Error(
				'incorrect_post_id',
				esc_html__( 'You need to specify a correct ID of a post to return related posts for.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		// Make the API request
		$request = sprintf( '/sites/%d/posts/%d/related', Jetpack_Options::get_option( 'id' ), $post_id );
		$request_args = array(
			'headers' => array(
				'Content-Type' => 'application/json',
			),
			'timeout'    => 10,
			'method' => 'POST',
		);
		$response = Jetpack_Client::wpcom_json_api_request_as_blog( $request, '1.1', $request_args );

		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		// Decode the results
		$results = json_decode( wp_remote_retrieve_body( $response ), true );

		$related_posts = array();
		if ( isset( $results['hits'] ) && is_array( $results['hits'] ) ) {
			$related_posts_ids = array_map( array( 'Jetpack_Core_API_Site_Endpoint', 'get_related_post_id' ), $results['hits'] );

			$related_posts_instance = Jetpack_RelatedPosts::init();
			foreach ( $related_posts_ids as $related_post_id ) {
				$related_posts[] = $related_posts_instance->get_related_post_data_for_post( $related_post_id, 0, 0 );
			}
		}

		return rest_ensure_response( array(
				'code' => 'success',
				'message' => esc_html__( 'Related posts retrieved successfully.', 'jetpack' ),
				'posts' => $related_posts,
			)
		);
	}

	/**
	 * Check that the current user has permissions to request information about this site.
	 *
	 * @since 5.1.0
	 *
	 * @return bool
	 */
	public static function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}

	/**
	 * Returns the post ID out of a related post entry from the
	 * `/sites/%s/posts/%d/related` WP.com endpoint.
	 *
	 * @since 6.7.0
	 *
	 * @return int
	 */
	public static function get_related_post_id( $item ) {
		return $item['fields']['post_id'];
	}
}
