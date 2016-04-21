<?php

/**
 * A simple in-memory implementation of iJetpack_Sync_Replicastore
 * used for development and testing
 */
class Jetpack_Sync_Server_Replicastore implements iJetpack_Sync_Replicastore {

	private $wp_version;
	private $posts;
	private $comments;
	private $options;
	private $theme_support;
	private $meta;
	private $constants;
	private $updates;
	private $callable;
	private $network_options;
	private $terms;
	private $users;

	function __construct() {
		$this->reset();
	}

	function reset() {
		$wp_version = null;
		$this->posts = array();
		$this->comments = array();
		$this->options = array();
		$this->theme_support = array();
		$this->meta = array();
		$this->constants = array();
		$this->updates = array();
		$this->callable = array();
		$this->network_options = array();
		$this->terms = array();
		$this->users = array();
	}

	function full_sync_start() {
		$this->reset();
	}
	
	function full_sync_end() {
		// noop right now
	}

	function get_wp_version() {
		return $this->wp_version;
	}
	
	function set_wp_version( $version ) {
		$this->wp_version = $version;
	}

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
		if ( ! isset( $this->constants[ $constant ] ) ) {
			return null;
		}
		return $this->constants[ $constant ];
	}

	public function set_constants( $constants ) {
		return $this->constants = $constants;
	}

	// updates
	public function get_updates( $type ) {
		if ( ! isset( $this->updates[ $type ] ) ) {
			return null;
		}
		return $this->updates[ $type ];
	}

	public function set_updates( $type, $updates ) {
		$this->updates[ $type ] = $updates;
	}

	// updates
	public function get_callable( $function ) {
		if ( ! isset( $this->callable[ $function ] ) ) {
			return null;
		}
		return $this->callable[ $function ];
	}

	public function set_callables( $callables ) {
		$this->callable = $callables;
	}

	// network options
	function get_site_option( $option ) {
		return isset( $this->network_options[ $option ] ) ? $this->network_options[ $option ] : false;
	}


	function update_site_option( $option, $value ) {
		$this->network_options[ $option ] = $value;
	}

	function delete_site_option( $option ) {
		$this->network_options[ $option ] = false;
	}

	// terms
	function get_terms( $taxonomy ) {
		return isset( $this->terms[ $taxonomy ] ) ? $this->terms[ $taxonomy ] : array();
	}
	function get_the_terms( $object_id, $taxonomy ) {
		// TODO: Implement get_the_terms() method.
		$this->object_terms[$taxonomy][$object_id];
	}

	function update_term( $taxonomy, $term_object ) {
		if( ! isset( $this->terms[ $taxonomy ] ) ) {
			// empty 
			$this->terms[ $taxonomy ] = array();
			$this->terms[ $taxonomy ][] = $term_object;
		}
		$terms = array();
		// Note: array_map might be better for this but didn't want to write a callback
		foreach ( $this->terms[ $taxonomy ] as $saved_term_object ) {
			if ( $saved_term_object->term_id === $term_object->term_id ) {
				$terms[] = $term_object;
			} else {
				$terms[] = $saved_term_object;
			}
		}
		$this->terms[ $taxonomy ] = $terms;
	}

	function delete_term( $term_id, $taxonomy, $object_ids ) {
		if ( ! isset( $this->terms[ $taxonomy ] ) ) {
			// empty
			$this->terms[ $taxonomy ] = array();
			$this->terms[ $taxonomy ][] = $term_object;
		}
		$terms = array();
		// Note: array_map might be better for this but didn't want to write a callback
		foreach ( $this->terms[ $taxonomy ] as $saved_term_object ) {
			if ( $saved_term_object->term_id !== $term_id ) {
				$terms[] = $saved_term_object;
			}
		}
		$this->terms[ $taxonomy ] = $terms;
		if ( empty( $this->terms[ $taxonomy ] ) ) {
			unset( $this->terms[ $taxonomy ] );
		}
 	}

	function get_user( $user_id ) {
		return isset( $this->users[ $user_id ] ) ? $this->users[ $user_id ] : false;
	}

	function update_user( $user_id, $user ) {
		$this->users[ $user_id ] = $user;
	}

	function delete_user( $user_id ) {
		unset( $this->users[ $user_id ] );
	}

}
