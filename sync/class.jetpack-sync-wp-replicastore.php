<?php

require_once 'interface.jetpack-sync-replicastore.php';

/**
 * An implementation of iJetpack_Sync_Replicastore which returns data stored in a WordPress.org DB.
 * This is useful to compare values in the local WP DB to values in the synced replica store
 */
class Jetpack_Sync_WP_Replicastore implements iJetpack_Sync_Replicastore {
	public function set_wp_version( $version ) {
		// makes no sense here?
	}

	public function get_wp_version() {
		global $wp_version;

		return $wp_version;
	}

	public function reset() {
		global $wpdb;

		$wpdb->query( "DELETE FROM $wpdb->posts" );
		$wpdb->query( "DELETE FROM $wpdb->comments" );

		// also need to delete terms from cache
		$term_ids = $wpdb->get_col( "SELECT term_id FROM $wpdb->terms" );
		foreach ( $term_ids as $term_id ) {
			wp_cache_delete( $term_id, 'terms' );
		}

		$wpdb->query( "DELETE FROM $wpdb->terms" );

		$wpdb->query( "DELETE FROM $wpdb->term_taxonomy" );
		$wpdb->query( "DELETE FROM $wpdb->term_relationships" );

		// callables and constants
		$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE 'jetpack_%'" );
		$wpdb->query( "DELETE FROM $wpdb->postmeta WHERE meta_key NOT LIKE '_%'" ); //TODO: delete by special prefix?
	}

	function full_sync_start() {
		$this->reset();
	}

	function full_sync_end( $checksum ) {
		// noop right now
	}

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

	public function upsert_post( $post, $silent = false ) {
		global $wpdb;

		// reject the post if it's not a WP_Post
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		$post = $post->to_array();

		// reject posts without an ID
		if ( ! isset( $post['ID'] ) ) {
			return;
		}

		$now     = current_time( 'mysql' );
		$now_gmt = get_gmt_from_date( $now );

		$defaults = array(
			'ID'                    => 0,
			'post_author'           => '0',
			'post_content'          => '',
			'post_content_filtered' => '',
			'post_title'            => '',
			'post_name'             => '',
			'post_excerpt'          => '',
			'post_status'           => 'draft',
			'post_type'             => 'post',
			'comment_status'        => 'closed',
			'comment_count'         => '0',
			'ping_status'           => '',
			'post_password'         => '',
			'to_ping'               => '',
			'pinged'                => '',
			'post_parent'           => 0,
			'menu_order'            => 0,
			'guid'                  => '',
			'post_date'             => $now,
			'post_date_gmt'         => $now_gmt,
			'post_modified'         => $now,
			'post_modified_gmt'     => $now_gmt,
		);

		$post = array_intersect_key( $post, $defaults );

		$post = sanitize_post( $post, 'db' );

		unset( $post['filter'] );

		$exists = $wpdb->get_var( $wpdb->prepare( "SELECT EXISTS( SELECT 1 FROM $wpdb->posts WHERE ID = %d )", $post['ID'] ) );

		if ( $exists ) {
			$wpdb->update( $wpdb->posts, $post, array( 'ID' => $post['ID'] ) );
		} else {
			$wpdb->insert( $wpdb->posts, $post );
		}

		clean_post_cache( $post['ID'] );
	}

	public function delete_post( $post_id ) {
		wp_delete_post( $post_id, true );
	}

	public function posts_checksum() {
		global $wpdb;

		$post_type_sql = Jetpack_Sync_Defaults::get_blacklisted_post_types_sql();

		$query = <<<ENDSQL
			SELECT CONV(BIT_XOR(CRC32(CONCAT(ID,post_modified))), 10, 16) 
				FROM $wpdb->posts
				WHERE $post_type_sql
ENDSQL;

		return $wpdb->get_var( $query );
	}

	public function comment_count( $status = null ) {
		global $wpdb;

		$comment_approved = $this->comment_status_to_approval_value( $status );

		if ( $comment_approved !== false ) {
			return $wpdb->get_var( $wpdb->prepare(
				"SELECT COUNT(*) FROM $wpdb->comments WHERE comment_approved = %s",
				$comment_approved
			) );
		} else {
			return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->comments" );
		}
	}

	private function comment_status_to_approval_value( $status ) {
		switch ( $status ) {
			case 'approve':
				return "1";
			case 'hold':
				return "0";
			case 'spam':
				return 'spam';
			case 'trash':
				return 'trash';
			case 'any':
				return false;
			case 'all':
				return false;
			default:
				return false;
		}
	}

	public function get_comments( $status = null ) {
		$args = array( 'orderby' => 'ID', 'status' => 'all' );

		if ( $status ) {
			$args['status'] = $status;
		}

		return get_comments( $args );
	}

	public function get_comment( $id ) {
		return WP_Comment::get_instance( $id );
	}

	public function upsert_comment( $comment ) {
		global $wpdb, $wp_version;

		if ( version_compare( $wp_version, '4.4', '<' ) ) {
			$comment = (array) $comment;
		} else {
			// WP 4.4 introduced the WP_Comment Class
			$comment = $comment->to_array();
		}

		// filter by fields on comment table
		$comment_fields_whitelist = array(
			'comment_ID',
			'comment_post_ID',
			'comment_author',
			'comment_author_email',
			'comment_author_url',
			'comment_author_IP',
			'comment_date',
			'comment_date_gmt',
			'comment_content',
			'comment_karma',
			'comment_approved',
			'comment_agent',
			'comment_type',
			'comment_parent',
			'user_id'
		);

		foreach ( $comment as $key => $value ) {
			if ( ! in_array( $key, $comment_fields_whitelist ) ) {
				unset( $comment[ $key ] );
			}
		}

		$exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT EXISTS( SELECT 1 FROM $wpdb->comments WHERE comment_ID = %d )",
				$comment['comment_ID']
			)
		);

		if ( $exists ) {
			$wpdb->update( $wpdb->comments, $comment, array( 'comment_ID' => $comment['comment_ID'] ) );
		} else {
			$wpdb->insert( $wpdb->comments, $comment );
		}

		wp_update_comment_count( $comment['comment_post_ID'] );
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

	public function comments_checksum() {
		global $wpdb;

		$query = <<<ENDSQL
			SELECT CONV(BIT_XOR(CRC32(CONCAT(comment_ID,comment_content))), 10, 16) FROM $wpdb->comments
ENDSQL;

		return $wpdb->get_var( $query );
	}

	public function update_option( $option, $value ) {
		return update_option( $option, $value );
	}

	public function get_option( $option ) {
		return get_option( $option );
	}

	public function delete_option( $option ) {
		return delete_option( $option );
	}

	public function set_theme_support( $theme_support ) {
		// noop
	}

	public function current_theme_supports( $feature ) {
		return current_theme_supports( $feature );
	}

	public function get_metadata( $type, $object_id, $meta_key = '', $single = false ) {
		return get_metadata( $type, $object_id, $meta_key, $single );
	}

	/**
	 *
	 * Stores remote meta key/values alongside an ID mapping key
	 *
	 * @param $type
	 * @param $object_id
	 * @param $meta_key
	 * @param $meta_value
	 * @param $meta_id
	 *
	 * @return bool
	 */
	public function upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {

		$table = _get_meta_table( $type );
		if ( ! $table ) {
			return false;
		}

		global $wpdb;

		$exists = $wpdb->get_var( $wpdb->prepare(
			"SELECT EXISTS( SELECT 1 FROM $table WHERE meta_id = %d )",
			$meta_id
		) );

		if ( $exists ) {
			$wpdb->update( $table, array( 'meta_key'   => $meta_key,
			                              'meta_value' => $meta_value
			), array( 'meta_id' => $meta_id ) );
		} else {
			$object_id_field = $type . '_id';
			$wpdb->insert( $table, array( 'meta_id'        => $meta_id,
			                              $object_id_field => $object_id,
			                              'meta_key'       => $meta_key,
			                              'meta_value'     => $meta_value
			) );
		}

		wp_cache_delete( $object_id, $type . '_meta' );

		return true;
	}

	public function delete_metadata( $type, $object_id, $meta_ids ) {
		global $wpdb;

		$table = _get_meta_table( $type );
		if ( ! $table ) {
			return false;
		}

		foreach ( $meta_ids as $meta_id ) {
			$wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE meta_id = %d", $meta_id ) );
		}

		// if we don't have an object ID what do we do - invalidate ALL meta?
		if ( $object_id ) {
			wp_cache_delete( $object_id, $type . '_meta' );
		}
	}

	// constants
	public function get_constant( $constant ) {
		$value = get_option( 'jetpack_constant_' . $constant );

		if ( $value ) {
			return $value;
		}

		return null;
	}

	public function set_constants( $constants ) {
		global $wpdb;

		$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE 'jetpack_constant_%'" );

		foreach ( $constants as $key => $value ) {
			update_option( 'jetpack_constant_' . $key, $value );
		}
	}

	public function get_updates( $type ) {
		$all_updates = get_option( 'jetpack_updates', array() );

		if ( isset( $all_updates[ $type ] ) ) {
			return $all_updates[ $type ];
		} else {
			return null;
		}
	}

	public function set_updates( $type, $updates ) {
		$all_updates          = get_option( 'jetpack_updates', array() );
		$all_updates[ $type ] = $updates;
		update_option( 'jetpack_updates', $all_updates );
	}

	// functions
	public function get_callable( $name ) {
		$value = get_option( 'jetpack_' . $name );

		if ( $value ) {
			return $value;
		}

		return null;
	}

	public function set_callable( $name, $value ) {
		update_option( 'jetpack_' . $name, $value );
	}

	// network options
	public function get_site_option( $option ) {
		return get_option( 'jetpack_network_' . $option );
	}

	public function update_site_option( $option, $value ) {
		return update_option( 'jetpack_network_' . $option, $value );
	}

	public function delete_site_option( $option ) {
		return delete_option( 'jetpack_network_' . $option );
	}

	// terms
	// terms
	public function get_terms( $taxonomy ) {
		return get_terms( $taxonomy );
	}

	public function get_term( $taxonomy, $term_id, $is_term_id = true ) {
		$t = $this->ensure_taxonomy( $taxonomy );
		if ( ! $t || is_wp_error( $t ) ) {
			return $t;
		}

		return get_term( $term_id, $taxonomy );
	}

	private function ensure_taxonomy( $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			// try re-registering synced taxonomies
			$taxonomies = $this->get_callable( 'taxonomies' );
			if ( ! isset( $taxonomies[ $taxonomy ] ) ) {
				// doesn't exist, or somehow hasn't been synced
				return new WP_Error( 'invalid_taxonomy', "The taxonomy '$taxonomy' doesn't exist" );
			}
			$t = $taxonomies[ $taxonomy ];

			return register_taxonomy(
				$taxonomy,
				$t->object_type,
				(array) $t
			);
		}

		return true;
	}

	public function get_the_terms( $object_id, $taxonomy ) {
		return get_the_terms( $object_id, $taxonomy );
	}

	public function update_term( $term_object ) {
		$taxonomy = $term_object->taxonomy;
		global $wpdb;
		$exists = $wpdb->get_var( $wpdb->prepare(
			"SELECT EXISTS( SELECT 1 FROM $wpdb->terms WHERE term_id = %d )",
			$term_object->term_id
		) );
		if ( ! $exists ) {
			$term_object   = sanitize_term( clone( $term_object ), $taxonomy, 'db' );
			$term          = array(
				'term_id'    => $term_object->term_id,
				'name'       => $term_object->name,
				'slug'       => $term_object->slug,
				'term_group' => $term_object->term_group,
			);
			$term_taxonomy = array(
				'term_taxonomy_id' => $term_object->term_taxonomy_id,
				'term_id'          => $term_object->term_id,
				'taxonomy'         => $term_object->taxonomy,
				'description'      => $term_object->description,
				'parent'           => (int) $term_object->parent,
				'count'            => (int) $term_object->count,
			);
			$wpdb->insert( $wpdb->terms, $term );
			$wpdb->insert( $wpdb->term_taxonomy, $term_taxonomy );

//			clean_term_cache( $term_object->term_id, $taxonomy );

			return true;
		}

		return wp_update_term( $term_object->term_id, $taxonomy, (array) $term_object );
	}

	public function delete_term( $term_id, $taxonomy ) {
		return wp_delete_term( $term_id, $taxonomy );
	}

	public function update_object_terms( $object_id, $taxonomy, $terms, $append ) {
		wp_set_object_terms( $object_id, $terms, $taxonomy, $append );
	}

	public function delete_object_terms( $object_id, $tt_ids ) {
		global $wpdb;

		if ( is_array( $tt_ids ) && ! empty( $tt_ids ) ) {
			$taxonomies = array();
			foreach ( $tt_ids as $tt_id ) {
				$term                            = get_term_by( 'term_taxonomy_id', $tt_id );
				$taxonomies[ $term->taxonomy ][] = $tt_id;
			}
			$in_tt_ids = "'" . implode( "', '", $tt_ids ) . "'";

			/**
			 * Fires immediately before an object-term relationship is deleted.
			 *
			 * @since 2.9.0
			 *
			 * @param int $object_id Object ID.
			 * @param array $tt_ids An array of term taxonomy IDs.
			 */
			do_action( 'delete_term_relationships', $object_id, $tt_ids );
			$deleted = $wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->term_relationships WHERE object_id = %d AND term_taxonomy_id IN ($in_tt_ids)", $object_id ) );
			foreach ( $taxonomies as $taxonomy => $taxonomy_tt_ids ) {
				wp_cache_delete( $object_id, $taxonomy . '_relationships' );
				/**
				 * Fires immediately after an object-term relationship is deleted.
				 *
				 * @since 2.9.0
				 *
				 * @param int $object_id Object ID.
				 * @param array $tt_ids An array of term taxonomy IDs.
				 */
				do_action( 'deleted_term_relationships', $object_id, $taxonomy_tt_ids );
				wp_update_term_count( $taxonomy_tt_ids, $taxonomy );
			}

			return (bool) $deleted;
		}

		return false;
	}

	// users
	public function user_count() {

	}

	public function get_user( $user_id ) {
		return WP_User::get_instance( $user_id );
	}

	public function upsert_user( $user ) {
		$this->invalid_call();
	}

	public function delete_user( $user_id ) {
		$this->invalid_call();
	}

	public function checksum_all() {
		return array(
			'posts'    => $this->posts_checksum(),
			'comments' => $this->comments_checksum()
		);
	}

	private function invalid_call() {
		$backtrace = debug_backtrace();
		$caller    = $backtrace[1]['function'];
		throw new Exception( "This function $caller is not supported on the WP Replicastore" );
	}
}
