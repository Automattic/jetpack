<?php

class Jetpack_JSON_API_Get_Post_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/posts/%d/backup      -> $blog_id, $post_id

	protected $needed_capabilities = array();
	protected $post_id;

	function validate_input( $post_id ) {
		if ( empty( $post_id ) || ! is_numeric( $post_id ) ) {
			return new WP_Error( 'post_id_not_specified', __( 'You must specify a Post ID', 'jetpack' ) );
		}

		$this->post_id = intval( $post_id );

		return true;
	}

	protected function result() {
		$post = get_post( $this->post_id );
		if ( empty( $post ) ) {
			return new WP_Error( 'post_not_found', __( 'Post not found', 'jetpack' ) );
		}

		return array(
			'post' => (array)$post,
			'meta' => get_post_meta( $post->ID ),
		);
	}

}
