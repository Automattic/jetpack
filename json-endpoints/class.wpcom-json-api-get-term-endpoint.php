<?php
/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */

class WPCOM_JSON_API_Get_Term_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/taxonomies/%s/terms/slug:%s -> $blog_id, $taxonomy, $slug
	function callback( $path = '', $blog_id = 0, $taxonomy = 'category', $slug = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		$taxonomy_meta = get_taxonomy( $taxonomy );
		if ( false === $taxonomy_meta || ( ! $taxonomy_meta->public && 
				! current_user_can( $taxonomy_meta->cap->assign_terms ) ) ) {
			return new WP_Error( 'invalid_taxonomy', 'The taxonomy does not exist', 400 );
		}

		$args = $this->query_args();
		$term = $this->get_taxonomy( $slug, $taxonomy, $args['context'] );
		if ( ! $term || is_wp_error( $term ) ) {
			return $term;
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'terms' );

		return $term;
	}
}
