<?php
class WPCOM_JSON_API_List_Users_Endpoint extends WPCOM_JSON_API_Endpoint {

	var $response_format = array(
		'found'    => '(int) The total number of authors found that match the request (i
gnoring limits and offsets).',
		'users'  => '(array:author) Array of user objects',
	);

	// /sites/%s/users/ -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		$authors_only = ( ! empty( $args['authors_only'] ) );

		if ( $args['number'] < 1 ) {
			$args['number'] = 20;
		} elseif ( 100 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 100.', 400 );
		}

		if ( $authors_only ) {
			if ( empty( $args['type'] ) )
				$args['type'] = 'post';

			if ( ! $this->is_post_type_allowed( $args['type'] ) ) {
				return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
			}

			$post_type_object = get_post_type_object( $args['type'] );
			if ( ! $post_type_object || ! current_user_can( $post_type_object->cap->edit_others_posts ) ) {
				return new WP_Error( 'unauthorized', 'User cannot view authors for specified post type', 403 );
			}
		} elseif ( ! current_user_can( 'list_users' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view users for specified site', 403 );
		}

		$query = array(
			'number'    => $args['number'],
			'offset'    => $args['offset'],
			'order'     => $args['order'],
			'orderby'   => $args['order_by'],
			'fields'    => 'ID',
		);

		if ( $authors_only )
			$query['who'] = 'authors';

		$user_query = new WP_User_Query( $query );

		$return = array();
		foreach ( array_keys( $this->response_format ) as $key ) {
			switch ( $key ) {
				case 'found' :
					$return[$key] = (int) $user_query->get_total();
					break;
				case 'users' :
					$users = array();
					foreach ( $user_query->get_results() as $u ) {
						$the_user = $this->get_author( $u, true );
						if ( $the_user && ! is_wp_error( $the_user ) ) {
							$users[] = $the_user;
						}
					}

					$return[$key] = $users;
					break;
			}
		}

		return $return;
	}
}
