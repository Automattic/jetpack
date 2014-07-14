<?php

class WPCOM_JSON_API_Update_Taxonomy_Endpoint extends WPCOM_JSON_API_Taxonomy_Endpoint {
	// /sites/%s/tags|categories/new    -> $blog_id
	// /sites/%s/tags|categories/slug:%s -> $blog_id, $taxonomy_id
	// /sites/%s/tags|categories/slug:%s/delete -> $blog_id, $taxonomy_id
	function callback( $path = '', $blog_id = 0, $object_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( preg_match( '#/tags/#i', $path ) ) {
			$taxonomy_type = "post_tag";
		} else {
			$taxonomy_type = "category";
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_taxonomy( $path, $blog_id, $object_id, $taxonomy_type );
		} elseif ( $this->api->ends_with( $path, '/new' ) ) {
			return $this->new_taxonomy( $path, $blog_id, $taxonomy_type );
		}

		return $this->update_taxonomy( $path, $blog_id, $object_id, $taxonomy_type );
	}

	// /sites/%s/tags|categories/new    -> $blog_id
	function new_taxonomy( $path, $blog_id, $taxonomy_type ) {
		$args  = $this->query_args();
		$input = $this->input();
		if ( !is_array( $input ) || !$input || !strlen( $input['name'] ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown data passed', 404 );
		}

		$user = wp_get_current_user();
		if ( !$user || is_wp_error( $user ) || !$user->ID ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to manage taxonomies.', 403 );
		}

		$tax = get_taxonomy( $taxonomy_type );
		if ( !current_user_can( $tax->cap->edit_terms ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
		}

		if ( term_exists( $input['name'], $taxonomy_type ) ) {
			return new WP_Error( 'unknown_taxonomy', 'A taxonomy with that name already exists', 404 );
		}

		if ( 'category' !== $taxonomy_type )
			$input['parent'] = 0;

		$data = wp_insert_term( addslashes( $input['name'] ), $taxonomy_type,
			array(
		  		'description' => addslashes( $input['description'] ),
		  		'parent'      => $input['parent']
			)
		);

		if ( is_wp_error( $data ) )
			return $data;

		$taxonomy = get_term_by( 'id', $data['term_id'], $taxonomy_type );

		$return   = $this->get_taxonomy( $taxonomy->slug, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );
		return $return;
	}

	// /sites/%s/tags|categories/slug:%s -> $blog_id, $taxonomy_id
	function update_taxonomy( $path, $blog_id, $object_id, $taxonomy_type ) {
		$taxonomy = get_term_by( 'slug', $object_id, $taxonomy_type );
		$tax      = get_taxonomy( $taxonomy_type );
		if ( !current_user_can( $tax->cap->edit_terms ) )
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );

		if ( !$taxonomy || is_wp_error( $taxonomy ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		if ( false === term_exists( $object_id, $taxonomy_type ) ) {
			return new WP_Error( 'unknown_taxonomy', 'That taxonomy does not exist', 404 );
		}

		$args  = $this->query_args();
		$input = $this->input( false );
		if ( !is_array( $input ) || !$input ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$update = array();
		if ( 'category' === $taxonomy_type && !empty( $input['parent'] ) )
			$update['parent'] = $input['parent'];

		if ( !empty( $input['description'] ) )
			$update['description'] = addslashes( $input['description'] );

		if ( !empty( $input['name'] ) )
			$update['name'] = addslashes( $input['name'] );


		$data     = wp_update_term( $taxonomy->term_id, $taxonomy_type, $update );
		$taxonomy = get_term_by( 'id', $data['term_id'], $taxonomy_type );

		$return   = $this->get_taxonomy( $taxonomy->slug, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );
		return $return;
	}

	// /sites/%s/tags|categories/%s/delete -> $blog_id, $taxonomy_id
	function delete_taxonomy( $path, $blog_id, $object_id, $taxonomy_type ) {
		$taxonomy = get_term_by( 'slug', $object_id, $taxonomy_type );
		$tax      = get_taxonomy( $taxonomy_type );
		if ( !current_user_can( $tax->cap->delete_terms ) )
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );

		if ( !$taxonomy || is_wp_error( $taxonomy ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		if ( false === term_exists( $object_id, $taxonomy_type ) ) {
			return new WP_Error( 'unknown_taxonomy', 'That taxonomy does not exist', 404 );
		}

		$args  = $this->query_args();
		$return = $this->get_taxonomy( $taxonomy->slug, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );

		wp_delete_term( $taxonomy->term_id, $taxonomy_type );

		return array(
			'slug'    => (string) $taxonomy->slug,
			'success' => 'true',
		);
	}
}
