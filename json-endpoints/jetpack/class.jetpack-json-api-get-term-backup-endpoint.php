<?php

class Jetpack_JSON_API_Get_Term_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/terms/%d/backup      -> $blog_id, $term_id

	protected $needed_capabilities = array(); // This endpoint is only accessible using a site token
	protected $term_id;

	function validate_input( $term_id ) {
		if ( empty( $term_id ) || ! is_numeric( $term_id ) ) {
			return new WP_Error( 'term_id_not_specified', __( 'You must specify a Term ID', 'jetpack' ), 400 );
		}

		$this->term_id = intval( $term_id );

		return true;
	}

	protected function result() {
		$term = get_term( $this->term_id );
		if ( empty( $term ) ) {
			return new WP_Error( 'term_not_found', __( 'Term not found', 'jetpack' ), 404 );
		}

		return array(
			'term' => (array)$term,
			'meta' => get_term_meta( $this->term_id ),
		);
	}

}

