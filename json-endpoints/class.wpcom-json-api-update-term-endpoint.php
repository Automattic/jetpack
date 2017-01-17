<?php

class WPCOM_JSON_API_Update_Term_Endpoint extends WPCOM_JSON_API_Taxonomy_Endpoint {
	// /sites/%s/taxonomies/%s/terms/new            -> $blog_id, $taxonomy
	// /sites/%s/taxonomies/%s/terms/slug:%s        -> $blog_id, $taxonomy, $slug
	// /sites/%s/taxonomies/%s/terms/slug:%s/delete -> $blog_id, $taxonomy, $slug
	function callback( $path = '', $blog_id = 0, $taxonomy = 'category', $slug = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->load_theme_functions();
		}

		$user = wp_get_current_user();
		if ( ! $user || is_wp_error( $user ) || ! $user->ID ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to manage taxonomies.', 403 );
		}

		$taxonomy_meta = get_taxonomy( $taxonomy );
		if ( false === $taxonomy_meta || (
				! $taxonomy_meta->public && 
				! current_user_can( $taxonomy_meta->cap->manage_terms ) &&
				! current_user_can( $taxonomy_meta->cap->edit_terms ) &&
				! current_user_can( $taxonomy_meta->cap->delete_terms ) ) ) {
			return new WP_Error( 'invalid_taxonomy', 'The taxonomy does not exist', 400 );
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_term( $path, $blog_id, $slug, $taxonomy );
		} else if ( $this->api->ends_with( $path, '/new' ) ) {
			return $this->new_term( $path, $blog_id, $taxonomy );
		}

		return $this->update_term( $path, $blog_id, $slug, $taxonomy );
	}

	// /sites/%s/taxonomies/%s/terms/new -> $blog_id, $taxonomy
	function new_term( $path, $blog_id, $taxonomy ) {
		$args = $this->query_args();
		$input = $this->input();
		if ( ! is_array( $input ) || ! $input || ! strlen( $input['name'] ) ) {
			return new WP_Error( 'invalid_input', 'Unknown data passed', 400 );
		}

		$tax = get_taxonomy( $taxonomy );
		if ( ! current_user_can( $tax->cap->manage_terms ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
		}

		if ( ! isset( $input['parent'] ) || ! is_taxonomy_hierarchical( $taxonomy ) ) {
			$input['parent'] = 0;
		}

		if ( $term = get_term_by( 'name', $input['name'], $taxonomy ) ) {
			// get_term_by is not case-sensitive, but a name with different casing is allowed
			// also, the exact same name is allowed as long as the parents are different
			if ( $input['name'] === $term->name && $input['parent'] === $term->parent ) {
				return new WP_Error( 'duplicate', 'A taxonomy with that name already exists', 409 );
			}
		}

		$data = wp_insert_term( addslashes( $input['name'] ), $taxonomy, array(
	  		'description' => addslashes( $input['description'] ),
	  		'parent'      => $input['parent']
		) );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$term = get_term_by( 'id', $data['term_id'], $taxonomy );

		$return = $this->get_taxonomy( $term->slug, $taxonomy, $args['context'] );
		if ( ! $return || is_wp_error( $return ) ) {
			return $return;
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'terms' );
		return $return;
	}

	// /sites/%s/taxonomies/%s/terms/slug:%s -> $blog_id, $taxonomy, $slug
	function update_term( $path, $blog_id, $slug, $taxonomy ) {
		$tax = get_taxonomy( $taxonomy );
		if ( ! current_user_can( $tax->cap->edit_terms ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
		}

		$term = get_term_by( 'slug', $slug, $taxonomy );
		if ( ! $term || is_wp_error( $term ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		$args = $this->query_args();
		$input = $this->input( false );
		if ( ! is_array( $input ) || ! $input ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$update = array();
		if ( ! empty( $input['parent'] ) || is_taxonomy_hierarchical( $taxonomy ) ) {
			$update['parent'] = $input['parent'];
		}

		if ( ! empty( $input['description'] ) ) {
			$update['description'] = addslashes( $input['description'] );
		}

		if ( ! empty( $input['name'] ) ) {
			$update['name'] = addslashes( $input['name'] );
		}

		$data = wp_update_term( $term->term_id, $taxonomy, $update );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$term = get_term_by( 'id', $data['term_id'], $taxonomy );

		$return = $this->get_taxonomy( $term->slug, $taxonomy, $args['context'] );
		if ( ! $return || is_wp_error( $return ) ) {
			return $return;
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'terms' );
		return $return;
	}

	// /sites/%s/taxonomies/%s/terms/slug:%s/delete -> $blog_id, $taxonomy, $slug
	function delete_term( $path, $blog_id, $slug, $taxonomy ) {
		$term = get_term_by( 'slug', $slug, $taxonomy );
		$tax = get_taxonomy( $taxonomy );
		if ( ! current_user_can( $tax->cap->delete_terms ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
		}

		if ( ! $term || is_wp_error( $term ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		$args = $this->query_args();
		$return = $this->get_taxonomy( $term->slug, $taxonomy, $args['context'] );
		if ( ! $return || is_wp_error( $return ) ) {
			return $return;
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'terms' );

		wp_delete_term( $term->term_id, $taxonomy );

		return array(
			'slug'    => (string) $term->slug,
			'success' => true
		);
	}
}
