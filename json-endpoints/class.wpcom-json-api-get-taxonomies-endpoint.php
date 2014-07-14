<?php

class WPCOM_JSON_API_Get_Taxonomies_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/tags       -> $blog_id
	// /sites/%s/categories -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		if ( preg_match( '#/tags#i', $path ) ) {
			return $this->tags();
		} else {
			return $this->categories();
		}
	}

	function categories() {
		$cats = get_categories( array( 'get' => 'all' ) );
		$found = count( $cats );
		$cats_obj = array();
		foreach ( $cats as $cat ) {
			$cats_obj[] = $this->get_taxonomy( $cat->slug, 'category', 'display' );
		}
		return array(
			'found'       => $found,
			'categories'  => $cats_obj
		);
	}

	function tags() {
		$tags = (array) get_tags( array( 'get' => 'all' ) );
		$found = count( $tags );
		$tags_obj = array();
		foreach ( $tags as $tag ) {
			$tags_obj[] = $this->get_taxonomy( $tag->slug, 'post_tag', 'display' );
		}
		return array(
			'found' => $found,
			'tags'  => $tags_obj
		);
	}
}
