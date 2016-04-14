<?php

/**
 * An implementation of iJetpack_Sync_Replicastore which returns data stored in a WordPress.org DB.
 * This is useful to compare values in the local WP DB to values in the synced replica store
 */
class Jetpack_Sync_Test_Replicastore implements iJetpack_Sync_Replicastore {
	public function post_count( $status = null ) {
		return count( $this->get_posts( $status ) );
	}

	public function get_posts( $status = null ) {
		$args = array( 'orderby' => 'ID' );

		if ( $status ) {
			$args['post_status'] = $status;
		} else {
			$args['post_status'] = 'any';
		}

		return get_posts( $args );
	}

	public function get_post( $id ) {
		return get_post( $id );
	}

	public function upsert_post( $post ) {
		wp_update_post( $post );
	}

	public function delete_post( $post_id ) {
		wp_delete_post( $post_id, true );
	}

	public function comment_count( $status = null ) {
		return count( $this->get_comments() );
	}

	public function get_comments( $status = null ) {
		$args = array( 'orderby' => 'ID', 'status' => 'all' );

		if ( $status ) {
			$args['status'] = $status;
		}

		return get_comments( $args );
	}

	public function get_comment( $id ) {
		return get_comment( $id );
	}

	public function upsert_comment( $comment ) {
		wp_update_comment( (array) $comment );
	}

	public function trash_comment( $comment_id ) {
		wp_delete_comment( $comment_id );
	}

	public function delete_comment( $comment_id ) {
		wp_delete_comment( $comment_id, true );
	}

	public function spam_comment( $comment_id ) {
		wp_spam_comment( $comment_id );
	}

}
