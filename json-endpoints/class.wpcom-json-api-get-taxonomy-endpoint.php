<?php
class WPCOM_JSON_API_Get_Taxonomy_Endpoint extends WPCOM_JSON_API_Taxonomy_Endpoint {
	// /sites/%s/tags/slug:%s       -> $blog_id, $tag_id
	// /sites/%s/categories/slug:%s -> $blog_id, $tag_id
	function callback( $path = '', $blog_id = 0, $taxonomy_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();
		if ( preg_match( '#/tags/#i', $path ) ) {
			$taxonomy_type = "post_tag";
		} else {
			$taxonomy_type = "category";
		}

		$return = $this->get_taxonomy( $taxonomy_id, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'taxonomies' );

		return $return;
	}
}
