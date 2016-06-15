<?php

/**
 * A simple in-memory implementation of iJetpack_Sync_Replicastore
 * used for development and testing
 */
class Jetpack_Sync_Test_Replicastore implements iJetpack_Sync_Replicastore {

	private $posts;
	private $post_status;
	private $comments;
	private $comment_status;
	private $options;
	private $theme_support;
	private $meta;
	private $meta_filter;
	private $constants;
	private $updates;
	private $callable;
	private $network_options;
	private $terms;
	private $object_terms;
	private $users;
	private $allowed_mime_types;

	function __construct() {
		$this->reset();
	}

	function reset() {
		$this->posts           = array();
		$this->comments        = array();
		$this->options         = array();
		$this->theme_support   = array();
		$this->meta            = array();
		$this->constants       = array();
		$this->updates         = array();
		$this->callable        = array();
		$this->network_options = array();
		$this->terms           = array();
		$this->object_terms    = array();
		$this->users           = array();
	}

	function full_sync_start() {
		$this->reset();
	}

	function full_sync_end( $checksum ) {
		// noop right now
	}

	function post_count( $status = null ) {
		return count( $this->get_posts( $status ) );
	}

	function get_posts( $status = null ) {
		$this->post_status = $status;

		return array_filter( array_values( $this->posts ), array( $this, 'filter_post_status' ) );
	}

	function posts_checksum() {
		return strtoupper( dechex( array_reduce( $this->posts, array( $this, 'post_checksum' ), 0 ) ) );
	}

	private function post_checksum( $carry, $post ) {
		return $carry ^ sprintf( '%u', crc32( $post->ID . $post->post_modified ) ) + 0;
	}

	function filter_post_status( $post ) {
		$matched_status = ! in_array( $post->post_status, array( 'inherit' ) )
		                  && ( $this->post_status ? $post->post_status === $this->post_status : true );

		return $matched_status;
	}

	function get_post( $id ) {
		return isset( $this->posts[ $id ] ) ? $this->posts[ $id ] : false;
	}

	function upsert_post( $post, $silent = false ) {
		$this->posts[ $post->ID ] = $this->cast_to_post( $post );
	}

	function delete_post( $post_id ) {
		unset( $this->posts[ $post_id ] );
	}

	function comment_count( $status = null ) {
		return count( $this->get_comments( $status ) );
	}

	function get_comments( $status = null ) {
		$this->comment_status = $status;

		// valid statuses: 'hold', 'approve', 'spam', or 'trash'.
		return array_filter( array_values( $this->comments ), array( $this, 'filter_comment_status' ) );
	}

	function comments_checksum() {
		return strtoupper( dechex( array_reduce( $this->comments, array( $this, 'comment_checksum' ), 0 ) ) );
	}

	private function comment_checksum( $carry, $comment ) {
		return $carry ^ sprintf( '%u', crc32( $comment->comment_ID . $comment->comment_content ) ) + 0;
	}

	function filter_comment_status( $comment ) {
		switch ( $this->comment_status ) {
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
	}

	function get_comment( $id ) {
		if ( isset( $this->comments[ $id ] ) ) {
			return $this->comments[ $id ];
		}
		return false;
	}

	function upsert_comment( $comment, $silent = false ) {
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

	function get_option( $option, $default = false ) {
		return isset( $this->options[ $option ] ) ? $this->options[ $option ] : $default;
	}

	function update_option( $option, $value ) {
		$this->options[ $option ] = $value;
	}

	function delete_option( $option ) {
		$this->options[ $option ] = false;
	}

	function options_checksum() {
		return strtoupper( dechex( array_reduce( Jetpack_Sync_Defaults::$default_options_whitelist, array( $this, 'option_checksum' ), 0 ) ) );
	}

	private function option_checksum( $carry, $option_name ) {
		return $carry ^ ( array_key_exists( $option_name, $this->options ) ? ( sprintf( '%u', crc32( $option_name . $this->options[ $option_name ] ) ) + 0 ) : 0 );
	}

	// theme functions
	function set_theme_support( $theme_support ) {
		$this->theme_support = (object) $theme_support;
	}

	function current_theme_supports( $feature ) {
		return isset( $this->theme_support->{ $feature } );
	}

	// meta
	public function get_metadata( $type, $object_id, $meta_key = '', $single = false ) {

		$object_id                      = absint( $object_id );
		$this->meta_filter['type']      = $type;
		$this->meta_filter['object_id'] = $object_id;
		$this->meta_filter['meta_key']  = $meta_key;

		$meta_entries = array_values( array_filter( $this->meta, array( $this, 'find_meta' ) ) );

		if ( count( $meta_entries ) === 0 ) {
			// match return signature of WP code
			if ( $single ) {
				return '';
			} else {
				return array();
			}
		}

		$meta_values = array_map( array( $this, 'get_meta_valued' ), $meta_entries );

		if ( $single ) {
			return $meta_values[0];
		}

		return $meta_values;
	}

	public function find_meta( $meta ) {
		// must match object and type
		$match = ( $this->meta_filter['type'] === $meta->type && $this->meta_filter['object_id'] === $meta->object_id );

		// match key if given
		if ( $match && $this->meta_filter['meta_key'] ) {
			$match = ( $meta->meta_key === $this->meta_filter['meta_key'] );
		}

		return $match;
	}

	public function get_meta_valued( $meta ) {
		return $meta->meta_value;
	}

	public function upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {
		$this->meta[ $meta_id ] = (object) array(
			'meta_id'   => $meta_id,
			'type'      => $type,
			'object_id' => absint( $object_id ),
			'meta_key'  => $meta_key,
			'meta_value'  => $meta_value,
		);
	}

	public function delete_metadata( $type, $object_id, $meta_ids ) {
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

	public function set_constant( $constant, $value ) {
		return $this->constants[$constant] = $value;
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

	public function set_callable( $name, $value ) {
		$this->callable[ $name ] = $value;
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

	function get_term( $taxonomy, $term_id, $term_key = 'term_id' ) {
		if ( ! $taxonomy && $term_key === 'term_taxonomy_id' ) {
			foreach ( $this->terms as $tax => $terms_array ) {
				$term = $this->get_term( $tax, $term_id, 'term_taxonomy_id' );
				if ( $term ) {
					return $term;
				}
			}
		}
		if ( ! isset( $this->terms[ $taxonomy ] ) ) {
			return array();
		}
		foreach ( $this->terms[ $taxonomy ] as $term_object ) {
			switch ( $term_key ) {
				case 'term_id':
					$term = ( $term_id == $term_object->term_id ) ? $term_object : null;
					break;
				case 'term_taxonomy_id':
					$term = ( $term_id == $term_object->term_taxonomy_id ) ? $term_object : null;
					break;
				case 'slug':
					$term = ( $term_id === $term_object->slug ) ? $term_object : null;
					break;
			}

			if ( $term ) {
				return $term;
			}
		}

		return array();
	}

	function get_the_terms( $object_id, $taxonomy ) {
		$terms = array();
		if ( ! isset( $this->object_terms[ $taxonomy ] ) ) {
			return false;
		}
		foreach ( $this->object_terms[ $taxonomy ][ $object_id ] as $term_id ) {
			$term_key = is_numeric( $term_id ) ? 'term_id' : 'slug';
			$terms[]  = $this->get_term( $taxonomy, $term_id, $term_key );
		}

		return $terms;
	}

	function update_term( $term_object ) {
		$taxonomy = $term_object->taxonomy;

		if ( ! isset( $this->terms[ $taxonomy ] ) ) {
			// empty
			$this->terms[ $taxonomy ]   = array();
			$this->terms[ $taxonomy ][] = $term_object;
		}
		$terms  = array();
		$action = 'none';

		// Note: array_map might be better for this but didn't want to write a callback
		foreach ( $this->terms[ $taxonomy ] as $saved_term_object ) {
			if ( $saved_term_object->term_id === $term_object->term_id ) {
				$terms[] = $term_object;
				$action  = 'updated';
			} else {
				$terms[] = $saved_term_object;
			}
		}
		if ( $action !== 'updated' ) {
			// we should add the tem since we didn't update it.
			$terms[] = $term_object;
		}
		$this->terms[ $taxonomy ] = $terms;
	}

	private function update_term_count( $taxonomy, $term_id ) {
		$term_key    = is_numeric( $term_id ) ? 'term_id' : 'slug';
		$term_object = $this->get_term( $taxonomy, $term_id, $term_key );
		$count       = 0;
		foreach ( $this->object_terms[ $taxonomy ] as $object_id => $term_ids ) {
			foreach ( $term_ids as $saved_term_id ) {
				if ( $saved_term_id === $term_id ) {
					$count ++;
				}
			}
		}
		if ( empty( $term_object ) ) {
			return;
		}
		$term_object->count = $count;
		$this->update_term( $term_object );
	}

	function delete_term( $term_id, $taxonomy ) {
		if ( ! isset( $this->terms[ $taxonomy ] ) ) {
			// empty
			$this->terms[ $taxonomy ] = array();
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

	function delete_object_terms( $object_id, $tt_ids ) {
		$saved_data = array();
		foreach ( $this->object_terms as $taxonomy => $taxonomy_object_terms ) {
			foreach ( $taxonomy_object_terms as $saved_object_id => $term_ids ) {
				foreach ( $term_ids as $saved_term_id ) {
					$term = $this->get_term( $taxonomy, $saved_term_id, 'term_id' );
					if ( isset( $term->term_taxonomy_id ) && ! in_array( $term->term_taxonomy_id, $tt_ids ) && $object_id === $saved_object_id ) {
						$saved_data[ $taxonomy ] [ $saved_object_id ][] = $saved_term_id;
					} else if ( isset( $term->term_taxonomy_id ) && in_array( $term->term_taxonomy_id, $tt_ids ) && $object_id === $saved_object_id ) {
						$this->update_term_count( $taxonomy, $term->term_id );
					}
				}
			}
		}
		$this->object_terms = $saved_data;
	}

	function update_object_terms( $object_id, $taxonomy, $term_ids, $append ) {
		if ( $append ) {
			$previous_array                                = isset( $this->object_terms[ $taxonomy ] )
			                                                 && isset( $this->object_terms[ $taxonomy ][ $object_id ] )
				? $this->object_terms[ $taxonomy ][ $object_id ] : array();
			$this->object_terms[ $taxonomy ][ $object_id ] = array_merge( $previous_array, $term_ids );
		} else {
			$this->object_terms[ $taxonomy ][ $object_id ] = $term_ids;
		}

		foreach ( $term_ids as $term_id ) {
			$this->update_term_count( $taxonomy, $term_id );
		}
	}

	function user_count() {
		return count( $this->users );
	}

	function get_user( $user_id ) {
		return isset( $this->users[ $user_id ] ) ? $this->users[ $user_id ] : null;
	}

	function get_allowed_mime_types( $user_id ) {
		return isset( $this->allowed_mime_types[ $user_id ] ) ? $this->allowed_mime_types[ $user_id ] : null;
	}

	function upsert_user( $user ) {
		if ( isset( $user->allowed_mime_types ) ) {
			$this->allowed_mime_types[ $user->ID ] = $user->allowed_mime_types;
			unset( $user->allowed_mime_types );
		}
		// when doing a full sync
		if ( isset( $user->data->allowed_mime_types ) ) {
			$this->allowed_mime_types[ $user->ID ] = $user->data->allowed_mime_types;
			unset( $user->data->allowed_mime_types );
		}
		$this->users[ $user->ID ] = $user;
	}

	function delete_user( $user_id ) {
		unset( $this->users[ $user_id ] );
	}


	function checksum_all() {
		return array(
			'posts' => $this->posts_checksum(),
			'comments' => $this->comments_checksum(),
			'options' => $this->options_checksum(),
		);
	}

	function cast_to_post( $object ) {
		if ( isset( $object->extra ) ) {
			$object->extra = (array) $object->extra;
		}
		$post = new WP_Post( $object );
		return $post;
	}

}
