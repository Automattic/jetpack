<?php

class WPCOM_JSON_API_Get_Taxonomies_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/tags       -> $blog_id
	// /sites/%s/categories -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();
		$args = $this->process_args( $args );

		if ( preg_match( '#/tags#i', $path ) ) {
			return $this->tags( $args );
		} else {
			return $this->categories( $args );
		}
	}

	function process_args( $args ) {
		if ( $args['number'] < 1 ) {
			$args['number'] = 100;
		} elseif ( 1000 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 1000.', 400 );
		}

		if ( isset( $args['page'] ) ) {
			if ( $args['page'] < 1 ) {
				$args['page'] = 1;
			}
		
			$args['offset'] = ( $args['page'] - 1 ) * $args['number'];
			unset( $args['page'] );
		}

		if ( $args['offset'] < 0 ) {
			$args['offset'] = 0;
		}

		$args['orderby'] = $args['order_by'];
		unset( $args['order_by'] );

		unset( $args['context'], $args['pretty'], $args['http_envelope'], $args['fields'] );
		return $args;
	}

	function categories( $args ) {
		$args['get'] = 'all';

		$cats = get_categories( $args );
		unset( $args['offset'] );
		$found = wp_count_terms( 'category', $args );

		$cats_obj = array();
		foreach ( $cats as $cat ) {
			$cats_obj[] = $this->format_taxonomy( $cat, 'category', 'display' );
		}

		return array(
			'found'       => (int) $found,
			'categories'  => $cats_obj
		);
	}

	function tags( $args ) {
		$args['get'] = 'all';

		$tags = (array) get_tags( $args );
		unset( $args['offset'] );
		$found = wp_count_terms( 'post_tag', $args );

		$tags_obj = array();
		foreach ( $tags as $tag ) {
			$tags_obj[] = $this->format_taxonomy( $tag, 'post_tag', 'display' );
		}

		return array(
			'found' => (int) $found,
			'tags'  => $tags_obj
		);
	}
}
