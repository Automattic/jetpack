<?php

/**
 * A simple in-memory implementation of iJetpack_Sync_Replicastore
 * used for development and testing
 */
class Jetpack_Sync_Server_Replicastore implements iJetpack_Sync_Replicastore {
	private $posts = array();
	private $comments = array();
	private $options = array();
	private $theme_support = array();

	function post_count( $status = null ) {
		return count( $this->get_posts( $status ) );
	}

	function get_posts( $status = null ) {
		return array_filter( array_values( $this->posts ), function ( $post ) use ( $status ) {
			$matched_status = ! in_array( $post->post_status, array( 'inherit' ) )
			                  && ( $status ? $post->post_status === $status : true );

			return $matched_status;
		} );
	}

	function get_post( $id ) {
		return $this->posts[ $id ];
	}

	function upsert_post( $post ) {
		$this->posts[ $post->ID ] = $post;
	}

	function delete_post( $post_id ) {
		unset( $this->posts[ $post_id ] );
	}

	function comment_count( $status = null ) {
		return count( $this->get_comments( $status ) );
	}

	function get_comments( $status = null ) {
		// valid statuses: 'hold', 'approve', 'spam', or 'trash'.
		return array_filter( array_values( $this->comments ), function ( $comment ) use ( $status ) {
			switch ( $status ) {
				case 'approve':
					return $comment->comment_approved === "1";
				case 'hold':
					return $comment->comment_approved === "0";
				case 'spam':
					return $comment->comment_approved === 'spam';
				case 'trash':
					return $comment->comment_approved === 'trash';
				case 'any':
					return true;
				case 'all':
					return true;
				default:
					return true;
			}
		} );
	}

	function get_comment( $id ) {
		return $this->comments[ $id ];
	}

	function upsert_comment( $comment ) {
		$this->comments[ $comment->comment_ID ] = $comment;
	}

	function trash_comment( $comment_id ) {
		$this->comments[ $comment_id ]->comment_approved = 'trash';
	}

	function spam_comment( $comment_id ) {
		$this->comments[ $comment_id ]->comment_approved = 'spam';
	}

	function delete_comment( $comment_id ) {
		unset( $this->comments[ $comment_id ] );
	}

	function get_option( $option ) {
		return isset( $this->options[ $option ] ) ? $this->options[ $option ] : false;
	}

	function update_option( $option, $value ) {
		$this->options[ $option ] = $value;
	}

	function delete_option( $option ) {
		$this->options[ $option ] = false;
	}

	// theme functions
	function set_theme_support( $theme_support ) {
		$this->theme_support = $theme_support;
	}

	function current_theme_supports( $feature ) {
		return isset( $this->theme_support[ $feature ] );
	}
}
