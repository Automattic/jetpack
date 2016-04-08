<?php

/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */

class Jetpack_Post extends SAL_Post {
	public function get_like_count() {
		return 0;
	}

	public function is_liked() {
		return false;
	}

	public function is_reblogged() {
		return false;
	}

	public function is_following() {
		return false;
	}

	public function get_global_id() {
		return '';
	}

	public function get_geo() {
		return false;
	}

	public function is_public() {
		if ( 0 < strlen( $this->get_password() ) ) {
			return false;
		}
		if ( ! in_array( $this->get_type(), get_post_types( array( 'public' => true ) ) ) ) {
			return false;
		}
		$post_status = get_post_status( $this->ID ); // Inherited status is resolved here.
		if ( ! in_array( $post_status, get_post_stati( array( 'public' => true ) ) ) ) {
			return false;
		}

		return true;
	}

	public function is_excluded_from_search() {
		return get_post_type_object( $this->get_type() )->exclude_from_search;
	}

	public function get_taxonomies() {
		$tax = array();
		$taxonomies  = get_object_taxonomies( $this );
		foreach ( $taxonomies as $taxonomy ) {
			$terms = get_object_term_cache( $this->ID, $taxonomy );
			if ( empty( $terms ) ) {
				$terms = wp_get_object_terms( $this->ID, $taxonomy );
			}
			$term_names = array();
			foreach ( $terms as $term ) {
				$term_names[] = $term->name;
			}
			$tax[ $taxonomy ] = $term_names;
		}
		return $tax;
	}

	public function get_meta() {
		$meta = array();
		$metas = get_post_meta( $this->ID, false );
		foreach ( $metas as $key => $value ) {
			$meta[ $key ] = array_map( 'maybe_unserialize', $value );
		}
		return $meta;
	}
}
