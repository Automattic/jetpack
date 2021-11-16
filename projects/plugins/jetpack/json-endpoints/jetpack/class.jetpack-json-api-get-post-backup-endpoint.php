<?php

class Jetpack_JSON_API_Get_Post_Backup_Endpoint extends Jetpack_JSON_API_Endpoint {
	// /sites/%s/posts/%d/backup      -> $blog_id, $post_id

	protected $needed_capabilities = array(); // This endpoint is only accessible using a site token
	protected $post_id;

	function validate_input( $post_id ) {
		if ( empty( $post_id ) || ! is_numeric( $post_id ) ) {
			return new WP_Error( 'post_id_not_specified', __( 'You must specify a Post ID', 'jetpack' ), 400 );
		}

		$this->post_id = (int) $post_id;

		return true;
	}

	protected function result() {
		global $wpdb;

		// Disable Sync as this is a read-only operation and triggered by sync activity.
		\Automattic\Jetpack\Sync\Actions::mark_sync_read_only();

		$post = get_post( $this->post_id );
		if ( empty( $post ) ) {
			return new WP_Error( 'post_not_found', __( 'Post not found', 'jetpack' ), 404 );
		}

		// Fetch terms associated with this post object
		$terms = $wpdb->get_results( $wpdb->prepare(
			"SELECT term_taxonomy_id, term_order FROM {$wpdb->term_relationships} WHERE object_id = %d;", $post->ID
		) );

		return array(
			'post'  => (array)$post,
			'meta'  => get_post_meta( $post->ID ),
			'terms' => (array)$terms,
		);
	}

}
