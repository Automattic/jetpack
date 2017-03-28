<?php

class Jetpack_JSON_API_Get_Term_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/terms/%d/backup      -> $blog_id, $term_id

	protected $needed_capabilities = array();
	protected $term_id;

	function validate_input( $term_id ) {
		if ( empty( $term_id ) || ! is_numeric( $term_id ) ) {
			return new WP_Error( 400, __( 'You must specify a Term ID', 'jetpack' ) );
		}

		$this->term_id = intval( $term_id );

		return true;
	}

	protected function result() {
		$term = get_term( $this->term_id );
		if ( empty( $term ) ) {
			return new WP_Error( 404, __( 'Term not found', 'jetpack' ) );
		}

		return array(
			'term' => (array)$term,
		);
	}

}

