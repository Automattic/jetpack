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
	private $meta = array();
	private $constants = array();
	private $updates = array();

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
		if ( isset( $this->comments[ $id ] ) ) {
			return $this->comments[ $id ];	
		}
		return false;		
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

	// meta
	public function get_metadata( $type, $object_id, $meta_key = '', $single = false ) {

		$object_id = absint( $object_id );

		$meta_entries = array_values( array_filter( $this->meta, function( $meta ) use ( $type, $object_id, $meta_key ) {
			// must match object and type
			$match = ( $type === $meta->type && $object_id === $meta->object_id );

			// match key if given
			if ( $match && $meta_key ) 
				$match = ( $meta->meta_key === $meta_key );

			return $match;

		} ) );

		if ( count( $meta_entries ) === 0 ) {
			// match return signature of WP code
			if ($single)
                return '';
	        else
                return array();
		}

		$meta_values = array_map( function( $meta ) { return $meta->meta_value; }, $meta_entries );

		if ( $single ) {
			return $meta_values[0];
		}

		return $meta_values;
	}

	public function add_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {
		$this->meta[ $meta_id ] = (object) array( 
			'meta_id'   => $meta_id,
			'type'      => $type,
			'object_id' => absint( $object_id ),
			'meta_key'  => $meta_key,
			'meta_value'  => $meta_value,
		);
	}

	public function update_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {
		$this->add_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id );
	}

	public function delete_metadata( $meta_ids ) {
		foreach ( $meta_ids as $meta_id ) {
			unset( $this->meta[ $meta_id ] );
		}
	}

	// constants
	public function get_constant( $constant ) {
		return $this->constants[ $constant ];
	}

	public function set_constants( $constants ) {
		return $this->constants = $constants;
	}

	// updates
	public function get_updates( $type ) {
		return $this->updates[ $type ];
	}

	public function set_updates( $type, $updates ) {
		$this->updates[ $type ] = $updates;
	}
}
