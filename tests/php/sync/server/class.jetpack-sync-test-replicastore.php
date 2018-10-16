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
	private $users_locale;
	private $allowed_mime_types;
	private $checksum_fields;

	function __construct() {
		$this->reset();
	}

	function reset() {
		$this->posts[ get_current_blog_id() ]           = array();
		$this->comments[ get_current_blog_id() ]        = array();
		$this->options[ get_current_blog_id() ]         = array();
		$this->theme_support[ get_current_blog_id() ]   = array();
		$this->meta[ get_current_blog_id() ]            = array( 'post' => array(), 'comment' => array() );
		$this->constants[ get_current_blog_id() ]       = array();
		$this->updates[ get_current_blog_id() ]         = array();
		$this->callable[ get_current_blog_id() ]        = array();
		$this->network_options[ get_current_blog_id() ] = array();
		$this->terms[ get_current_blog_id() ]           = array();
		$this->object_terms[ get_current_blog_id() ]    = array();
		$this->users[ get_current_blog_id() ]           = array();
		$this->users_locale[ get_current_blog_id() ]    = array();
	}

	function full_sync_start( $config ) {
		$this->reset();
	}

	function full_sync_end( $checksum ) {
		// noop right now
	}

	function post_count( $status = null, $min_id = null, $max_id = null ) {
		return count( $this->get_posts( $status, $min_id, $max_id ) );
	}

	function get_posts( $status = null, $min_id = null, $max_id = null ) {
		$this->post_status[ get_current_blog_id() ] = $status;

		$posts = array_filter( array_values( $this->posts[ get_current_blog_id() ] ), array( $this, 'filter_post_status' ) );

		foreach ( $posts as $i => $post ) {
			if ( ( $min_id && $post->ID < $min_id ) || ( $max_id && $post->ID > $max_id ) ) {
				unset( $posts[ $i ] );
			}
		}

		return array_values( $posts );
	}

	function posts_checksum( $min_id = null, $max_id = null ) {
		return $this->calculate_checksum( $this->posts[ get_current_blog_id() ], 'ID', $min_id, $max_id, Jetpack_Sync_Defaults::$default_post_checksum_columns );
	}

	function post_meta_checksum( $min_id = null, $max_id = null ) {
		return null;
	}

	private function reduce_checksum( $carry, $object ) {
		// append fields
		$value = '';
		foreach ( $this->checksum_fields[ get_current_blog_id() ] as $field ) {
			$value .= preg_replace( '/[^\x20-\x7E]/','', $object->{ $field } );
		}

		$result = $carry ^ sprintf( '%u', crc32( $value ) ) + 0;
		return $result;
	}

	function filter_post_status( $post ) {
		$matched_status = ! in_array( $post->post_status, array( 'inherit' ) )
		                  && ( $this->post_status[ get_current_blog_id() ] ? $post->post_status === $this->post_status[ get_current_blog_id() ] : true );

		return $matched_status;
	}

	function get_post( $id ) {
		return isset( $this->posts[ get_current_blog_id() ][ $id ] ) ? $this->posts[ get_current_blog_id() ][ $id ] : false;
	}

	function upsert_post( $post, $silent = false ) {
		$this->posts[ get_current_blog_id() ][ $post->ID ] = $this->cast_to_post( $post );
	}

	function delete_post( $post_id ) {
		unset( $this->posts[ get_current_blog_id() ][ $post_id ] );
	}

	function comment_count( $status = null, $min_id = null, $max_id = null ) {
		return count( $this->get_comments( $status, $min_id, $max_id ) );
	}

	function get_comments( $status = null, $min_id = null, $max_id = null ) {
		$this->comment_status[ get_current_blog_id() ] = $status;

		// valid statuses: 'hold', 'approve', 'spam', 'trash', or 'post-trashed.
		$comments = array_filter( array_values( $this->comments[ get_current_blog_id() ] ), array( $this, 'filter_comment_status' ) );

		foreach ( $comments as $i => $comment ) {
			if ( $min_id && $comment->comment_ID < $min_id || $max_id && $comment->comment_ID > $max_id ) {
				unset( $comments[ $i ] );
			}
		}

		return array_values( $comments );
	}

	function comments_checksum( $min_id = null, $max_id = null ) {
		return $this->calculate_checksum( array_filter( $this->comments[ get_current_blog_id() ], array( $this, 'is_not_spam' ) ), 'comment_ID', $min_id, $max_id, Jetpack_Sync_Defaults::$default_comment_checksum_columns );
	}

	function comment_meta_checksum( $min_id = null, $max_id = null ) {
		return null;
	}

	function is_not_spam( $comment ) {
		return $comment->comment_approved !== 'spam';
	}

	function filter_comment_status( $comment ) {
		switch ( $this->comment_status[ get_current_blog_id() ] ) {
			case 'approve':
				return '1' === $comment->comment_approved;
			case 'hold':
				return '0' === $comment->comment_approved;
			case 'spam':
				return 'spam' === $comment->comment_approved;
			case 'trash':
				return 'trash' === $comment->comment_approved;
			case 'post-trashed':
				return 'post-trashed' === $comment->comment_approved;
			case 'any':
				return true;
			case 'all':
				return true;
			default:
				return true;
		}
	}

	function get_comment( $id ) {
		if ( isset( $this->comments[ get_current_blog_id() ][ $id ] ) ) {
			return $this->comments[ get_current_blog_id() ][ $id ];
		}

		return false;
	}

	function upsert_comment( $comment, $silent = false ) {
		$this->comments[ get_current_blog_id() ][ $comment->comment_ID ] = $comment;
	}

	function trash_comment( $comment_id ) {
		$this->comments[ get_current_blog_id() ][ $comment_id ]->comment_approved = 'trash';
	}

	function spam_comment( $comment_id ) {
		$this->comments[ get_current_blog_id() ][ $comment_id ]->comment_approved = 'spam';
	}

	function trashed_post_comments( $post_id, $statuses ) {
		$statuses = (array) $statuses;
		foreach( $statuses as $comment_id => $status ) {
			$this->comments[ get_current_blog_id() ][ $comment_id ]->comment_approved = 'post-trashed';
		}
	}

	function untrashed_post_comments( $post_id ) {
		$statuses = (array) $this->get_metadata( 'post', $post_id, '_wp_trash_meta_comments_status', true );

		foreach( $statuses as $comment_id => $status ) {
			$this->comments[ get_current_blog_id() ][ $comment_id ]->comment_approved = $status;
		}
	}

	function delete_comment( $comment_id ) {
		unset( $this->comments[ get_current_blog_id() ][ $comment_id ] );
	}

	function get_option( $option, $default = false ) {
		return isset( $this->options[ get_current_blog_id() ][ $option ] ) ? $this->options[ get_current_blog_id() ][ $option ] : $default;
	}

	function update_option( $option, $value ) {
		$this->options[ get_current_blog_id() ][ $option ] = $value;
	}

	function delete_option( $option ) {
		$this->options[ get_current_blog_id() ][ $option ] = false;
	}

	function options_checksum() {
		return strtoupper( dechex( array_reduce( Jetpack_Sync_Defaults::$default_options_whitelist, array( $this, 'option_checksum' ), 0 ) ) );
	}

	private function option_checksum( $carry, $option_name ) {
		return $carry ^ ( array_key_exists( $option_name, $this->options[ get_current_blog_id() ] ) ? ( sprintf( '%u', crc32( $option_name . $this->options[ get_current_blog_id() ][ $option_name ] ) ) + 0 ) : 0 );
	}

	// theme functions
	function set_theme_support( $theme_support ) {
		$this->theme_support[ get_current_blog_id() ] = (object) $theme_support;
	}

	function current_theme_supports( $feature ) {
		return isset( $this->theme_support[ get_current_blog_id() ]->{$feature} );
	}

	// meta
	public function get_metadata( $type, $object_id, $meta_key = '', $single = false ) {

		$object_id                      = absint( $object_id );
		$this->meta_filter[ get_current_blog_id() ]['type']      = $type;
		$this->meta_filter[ get_current_blog_id() ]['object_id'] = $object_id;
		$this->meta_filter[ get_current_blog_id() ]['meta_key']  = $meta_key;

		$meta_entries = array_values( array_filter( $this->meta[ get_current_blog_id() ][ $type ], array( $this, 'find_meta' ) ) );

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

	// this is just here to support checksum histograms
	function get_post_meta_by_id( $meta_id ) {
		$matching_metas = array();
		$metas = $this->meta[ get_current_blog_id() ]['post'];
		foreach ( $metas as $m ) {
			if ( $m->meta_id === $meta_id ) {
				$matching_metas[] = $m;
			}
		}
		return reset( $matching_metas );
	}

	// this is just here to support checksum histograms
	function get_comment_meta_by_id( $meta_id ) {
		$matching_metas = array();
		$metas = $this->meta[ get_current_blog_id() ]['comment'];
		foreach ( $metas as $m ) {
			if ( $m->meta_id === $meta_id ) {
				$matching_metas[] = $m;
			}
		}
		return reset( $matching_metas );
	}

	public function find_meta( $meta ) {
		// must match object ID
		$match = ( $this->meta_filter[ get_current_blog_id() ]['object_id'] === $meta->object_id );

		// match key if given
		if ( $match && $this->meta_filter[ get_current_blog_id() ]['meta_key'] ) {
			$match = ( $meta->meta_key === $this->meta_filter[ get_current_blog_id() ]['meta_key'] );
		}

		return $match;
	}

	public function get_meta_valued( $meta ) {
		return $meta->meta_value;
	}

	public function upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {
		$this->meta[ get_current_blog_id() ][ $type ][ $meta_id ] = (object) array(
			'meta_id'    => $meta_id,
			'type'       => $type,
			'object_id'  => absint( $object_id ),
			'meta_key'   => $meta_key,
			'meta_value' => $meta_value,
		);
	}

	public function delete_metadata( $type, $object_id, $meta_ids ) {
		foreach ( $meta_ids as $meta_id ) {
			unset( $this->meta[ get_current_blog_id() ][ $type ][ $meta_id ] );
		}
	}

	public function delete_batch_metadata( $type, $object_ids, $meta_key ) {
		$meta_ids = array();
		foreach ( $this->meta[ get_current_blog_id() ][ $type ] as $meta_id => $meta_data ) {
			if (
				$meta_data->meta_key === $meta_key &&
				in_array( $meta_data->object_id, $object_ids )
			) {
			$meta_ids[] = $meta_id;
			}
		}

		foreach ( $meta_ids as $meta_id ) {
			unset( $this->meta[ get_current_blog_id() ][ $type ][ $meta_id ] );
		}
	}



	// constants
	public function get_constant( $constant ) {
		if ( ! isset( $this->constants[ get_current_blog_id() ][ $constant ] ) ) {
			return null;
		}

		return $this->constants[ get_current_blog_id() ][ $constant ];
	}

	public function set_constant( $constant, $value ) {
		return $this->constants[ get_current_blog_id() ][ $constant ] = $value;
	}

	// updates
	public function get_updates( $type ) {
		if ( ! isset( $this->updates[ get_current_blog_id() ][ $type ] ) ) {
			return null;
		}

		return $this->updates[ get_current_blog_id() ][ $type ];
	}

	public function set_updates( $type, $updates ) {
		$this->updates[ get_current_blog_id() ][ $type ] = $updates;
	}

	// updates
	public function get_callable( $function ) {
		if ( ! isset( $this->callable[ get_current_blog_id() ][ $function ] ) ) {
			return null;
		}

		return $this->callable[ get_current_blog_id() ][ $function ];
	}

	public function set_callable( $name, $value ) {
		$this->callable[ get_current_blog_id() ][ $name ] = $value;
	}

	// network options
	function get_site_option( $option ) {
		return isset( $this->network_options[ get_current_blog_id() ][ $option ] ) ? $this->network_options[ get_current_blog_id() ][ $option ] : false;
	}

	function update_site_option( $option, $value ) {
		$this->network_options[ get_current_blog_id() ][ $option ] = $value;
	}

	function delete_site_option( $option ) {
		$this->network_options[ get_current_blog_id() ][ $option ] = false;
	}

	// terms
	function get_terms( $taxonomy ) {
		return isset( $this->terms[ get_current_blog_id() ][ $taxonomy ] ) ? $this->terms[ get_current_blog_id() ][ $taxonomy ] : array();
	}

	function get_term( $taxonomy, $term_id, $term_key = 'term_id' ) {
		if ( ! $taxonomy && 'term_taxonomy_id' === $term_key ) {
			foreach ( $this->terms[ get_current_blog_id() ] as $tax => $terms_array ) {
				$term = $this->get_term( $tax, $term_id, 'term_taxonomy_id' );
				if ( $term ) {
					return $term;
				}
			}
		}
		if ( ! isset( $this->terms[ get_current_blog_id() ][ $taxonomy ] ) ) {
			return array();
		}
		foreach ( $this->terms[ get_current_blog_id() ][ $taxonomy ] as $term_object ) {
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

			if ( ! empty( $term ) ) {
				return $term;
			}
		}

		return array();
	}

	function get_the_terms( $object_id, $taxonomy ) {
		$terms = array();
		if ( ! isset( $this->object_terms[ get_current_blog_id() ][ $taxonomy ] ) ) {
			return false;
		}
		foreach ( $this->object_terms[ get_current_blog_id() ][ $taxonomy ][ $object_id ] as $term_id ) {
			$term_key = is_numeric( $term_id ) ? 'term_id' : 'slug';
			$terms[]  = $this->get_term( $taxonomy, $term_id, $term_key );
		}

		return $terms;
	}

	function update_term( $term_object ) {
		$taxonomy = $term_object->taxonomy;

		if ( ! isset( $this->terms[ get_current_blog_id() ][ $taxonomy ] ) ) {
			// empty
			$this->terms[ get_current_blog_id() ][ $taxonomy ]   = array();
			$this->terms[ get_current_blog_id() ][ $taxonomy ][] = $term_object;
		}
		$terms  = array();
		$action = 'none';

		// Note: array_map might be better for this but didn't want to write a callback
		foreach ( $this->terms[ get_current_blog_id() ][ $taxonomy ] as $saved_term_object ) {
			if ( $saved_term_object->term_id === $term_object->term_id ) {
				$terms[] = $term_object;
				$action  = 'updated';
			} else {
				$terms[] = $saved_term_object;
			}
		}
		if ( 'updated' !== $action ) {
			// we should add the tem since we didn't update it.
			$terms[] = $term_object;
		}
		$this->terms[ get_current_blog_id() ][ $taxonomy ] = $terms;
	}

	private function update_term_count( $taxonomy, $term_id ) {
		$term_key    = is_numeric( $term_id ) ? 'term_id' : 'slug';
		$term_object = $this->get_term( $taxonomy, $term_id, $term_key );
		$count       = 0;
		foreach ( $this->object_terms[ get_current_blog_id() ][ $taxonomy ] as $object_id => $term_ids ) {
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
		if ( ! isset( $this->terms[ get_current_blog_id() ][ $taxonomy ] ) ) {
			// empty
			$this->terms[ get_current_blog_id() ][ $taxonomy ] = array();
		}
		$terms = array();

		// Note: array_map might be better for this but didn't want to write a callback
		foreach ( $this->terms[ get_current_blog_id() ][ $taxonomy ] as $saved_term_object ) {
			if ( $saved_term_object->term_id !== $term_id ) {
				$terms[] = $saved_term_object;
			}
		}
		$this->terms[ get_current_blog_id() ][ $taxonomy ] = $terms;
		if ( empty( $this->terms[ get_current_blog_id() ][ $taxonomy ] ) ) {
			unset( $this->terms[ get_current_blog_id() ][ $taxonomy ] );
		}
	}

	function delete_object_terms( $object_id, $tt_ids ) {
		$saved_data = array();
		foreach ( $this->object_terms[ get_current_blog_id() ] as $taxonomy => $taxonomy_object_terms ) {
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
		$this->object_terms[ get_current_blog_id() ] = $saved_data;
	}

	function update_object_terms( $object_id, $taxonomy, $term_ids, $append ) {
		if ( $append ) {
			$previous_array                                = isset( $this->object_terms[ get_current_blog_id() ][ $taxonomy ] )
			                                                 && isset( $this->object_terms[ get_current_blog_id() ][ $taxonomy ][ $object_id ] )
				? $this->object_terms[ get_current_blog_id() ][ $taxonomy ][ $object_id ] : array();
			$this->object_terms[ get_current_blog_id() ][ $taxonomy ][ $object_id ] = array_merge( $previous_array, $term_ids );
		} else {
			$this->object_terms[ get_current_blog_id() ][ $taxonomy ][ $object_id ] = $term_ids;
		}

		foreach ( $term_ids as $term_id ) {
			$this->update_term_count( $taxonomy, $term_id );
		}
	}

	function user_count() {
		return count( $this->users[ get_current_blog_id() ] );
	}

	function get_user( $user_id ) {
		return isset( $this->users[ get_current_blog_id() ][ $user_id ] ) ? $this->users[ get_current_blog_id() ][ $user_id ] : null;
	}

	function upsert_user_locale( $user_id, $user_locale ) {
		$this->users_locale[ get_current_blog_id() ][ $user_id ] = $user_locale;
	}

	function delete_user_locale( $user_id ) {
		unset( $this->users_locale[ get_current_blog_id() ][ $user_id ] );
	}

	function get_user_locale( $user_id ) {
		return isset( $this->users_locale[ get_current_blog_id() ][ $user_id ] ) ? $this->users_locale[ get_current_blog_id() ][ $user_id ] : null;
	}

	function get_allowed_mime_types( $user_id ) {
		return isset( $this->allowed_mime_types[ get_current_blog_id() ][ $user_id ] ) ? $this->allowed_mime_types[ get_current_blog_id() ][ $user_id ] : null;
	}

	function upsert_user( $user ) {
		if ( isset( $user->allowed_mime_types ) ) {
			$this->allowed_mime_types[ get_current_blog_id() ][ $user->ID ] = $user->allowed_mime_types;
			unset( $user->allowed_mime_types );
		}
		// when doing a full sync
		if ( isset( $user->data->allowed_mime_types ) ) {
			$this->allowed_mime_types[ get_current_blog_id() ][ $user->ID ] = $user->data->allowed_mime_types;
			unset( $user->data->allowed_mime_types );
		}

		if ( isset( $user->data->locale ) ) {
			$this->users_locale[ get_current_blog_id() ][ $user->ID ] = $user->data->locale;
			unset( $user->data->locale );
		}
		$this->users[ get_current_blog_id() ][ $user->ID ] = $user;
	}

	function delete_user( $user_id ) {
		unset( $this->users[ get_current_blog_id() ][ $user_id ] );
	}


	function checksum_all() {
		$post_meta_checksum = $this->checksum_histogram( 'post_meta', 1 );
		$comment_meta_checksum = $this->checksum_histogram( 'comment_meta', 1 );

		return array(
			'posts'    => $this->posts_checksum(),
			'comments' => $this->comments_checksum(),
			'post_meta'=> reset( $post_meta_checksum ),
			'comment_meta'=> reset( $comment_meta_checksum ),
		);
	}

	function object_id( $o ) {
		return $o->ID;
	}

	function is_comment( $m ) {
		return 'comment' === $m->type;
	}

	function is_post( $m ) {
		return 'post' === $m->type;
	}

	function comment_id( $o ) {
		return $o->comment_ID;
	}

	function meta_id( $o ) {
		return $o->meta_id;
	}

	function checksum_histogram( $object_type, $buckets, $start_id = null, $end_id = null, $fields = null ) {
		// divide all IDs into the number of buckets
		switch ( $object_type ) {
			case 'posts':
				$posts         = $this->get_posts( null, $start_id, $end_id );
				$all_ids      = array_map( array( $this, 'object_id' ), $posts );
				$id_field      = 'ID';
				$get_function  = 'get_post';

				if ( empty( $fields ) ) {
					$fields = Jetpack_Sync_Defaults::$default_post_checksum_columns;
				}

				break;
			case 'post_meta':
				$post_meta = array_filter( $this->meta[ get_current_blog_id() ]['post'], array( $this, 'is_post' ) );
				$all_ids  = array_values( array_map( array( $this, 'meta_id' ), $post_meta ) );
				$id_field     = 'meta_id';
				$get_function = 'get_post_meta_by_id';

				if ( empty( $fields ) ) {
					$fields = Jetpack_Sync_Defaults::$default_post_meta_checksum_columns;
				}
				break;
			case 'comments':
				$comments     = $this->get_comments( null, $start_id, $end_id );
				$all_ids  = array_map( array( $this, 'comment_id' ), $comments );
				$id_field     = 'comment_ID';
				$get_function = 'get_comment';

				if ( empty( $fields ) ) {
					$fields = Jetpack_Sync_Defaults::$default_comment_checksum_columns;
				}
				break;
			case 'comment_meta':
				$comment_meta = array_filter( $this->meta[ get_current_blog_id() ]['comment'], array( $this, 'is_comment' ) );
				$all_ids  = array_values( array_map( array( $this, 'meta_id' ), $comment_meta ) );
				$id_field     = 'meta_id';
				$get_function = 'get_comment_meta_by_id';

				if ( empty( $fields ) ) {
					$fields = Jetpack_Sync_Defaults::$default_comment_meta_checksum_columns;
				}
				break;
			default:
				return false;
		}

		sort( $all_ids );
		$bucket_size = intval( ceil( count( $all_ids ) / $buckets ) );

		if ( $bucket_size === 0 ) {
			return array();
		}

		$id_chunks   = array_chunk( $all_ids, $bucket_size );
		$histogram   = array();

		foreach ( $id_chunks as $id_chunk ) {
			$first_id      = $id_chunk[0];
			$last_id_array = array_slice( $id_chunk, -1 );
			$last_id       = array_pop( $last_id_array );

			if ( count( $id_chunk ) === 1 ) {
				$key = "{$first_id}";
			} else {
				$key = "{$first_id}-{$last_id}";
			}

			$objects           = array_map( array( $this, $get_function ), $id_chunk );
			$value             = $this->calculate_checksum( $objects, null, null, null, $fields );
			$histogram[ $key ] = $value;
		}

		return $histogram;
	}

	function cast_to_post( $object ) {
		if ( isset( $object->extra ) ) {
			$object->extra = (array) $object->extra;
		}
		$post = new WP_Post( $object );

		return $post;
	}

	private function calculate_checksum( $array, $id_field = null, $min_id = null, $max_id = null, $fields = null ) {
		$this->checksum_fields[ get_current_blog_id() ] = $fields;

		if ( $id_field && ( $min_id || $max_id ) ) {
			$filtered_array = $array;
			foreach ( $filtered_array as $index => $object ) {
				if ( ( $min_id && $object->{$id_field} < $min_id ) || ( $max_id && $object->{$id_field} > $max_id ) ) {
					unset( $filtered_array[ $index ] );
				}
			}
			$array = $filtered_array;
		}

		return strtoupper( dechex( array_reduce( $array, array( $this, 'reduce_checksum' ), 0 ) ) );
	}
}
