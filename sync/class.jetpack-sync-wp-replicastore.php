<?php

require_once dirname( __FILE__ ) . '/interface.jetpack-sync-replicastore.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';

/**
 * An implementation of iJetpack_Sync_Replicastore which returns data stored in a WordPress.org DB.
 * This is useful to compare values in the local WP DB to values in the synced replica store
 */
class Jetpack_Sync_WP_Replicastore implements iJetpack_Sync_Replicastore {


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
		$wpdb->query( "DELETE FROM $wpdb->postmeta WHERE meta_key NOT LIKE '\_%'" );
	}

	function full_sync_start( $config ) {
		$this->reset();
	}

	function full_sync_end( $checksum ) {
		// noop right now
	}

	public function post_count( $status = null, $min_id = null, $max_id = null ) {
		global $wpdb;

		$where = '';

		if ( $status ) {
			$where = "post_status = '" . esc_sql( $status ) . "'";
		} else {
			$where = '1=1';
		}

		if ( null != $min_id ) {
			$where .= ' AND ID >= ' . intval( $min_id );
		}

		if ( null != $max_id ) {
			$where .= ' AND ID <= ' . intval( $max_id );
		}

		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->posts WHERE $where" );
	}

	// TODO: actually use max_id/min_id
	public function get_posts( $status = null, $min_id = null, $max_id = null ) {
		$args = array( 'orderby' => 'ID', 'posts_per_page' => -1 );

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

	public function posts_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->posts, Jetpack_Sync_Defaults::$default_post_checksum_columns , 'ID', Jetpack_Sync_Settings::get_blacklisted_post_types_sql(), $min_id, $max_id );
	}

	public function post_meta_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->postmeta, Jetpack_Sync_Defaults::$default_post_meta_checksum_columns , 'meta_id', Jetpack_Sync_Settings::get_whitelisted_post_meta_sql(), $min_id, $max_id );
	}

	public function comment_count( $status = null, $min_id = null, $max_id = null ) {
		global $wpdb;

		$comment_approved = $this->comment_status_to_approval_value( $status );

		if ( $comment_approved !== false ) {
			$where = "comment_approved = '" . esc_sql( $comment_approved ) . "'";
		} else {
			$where = '1=1';
		}

		if ( $min_id != null ) {
			$where .= ' AND comment_ID >= ' . intval( $min_id );
		}

		if ( $max_id != null ) {
			$where .= ' AND comment_ID <= ' . intval( $max_id );
		}

		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->comments WHERE $where" );
	}

	private function comment_status_to_approval_value( $status ) {
		switch ( $status ) {
			case 'approve':
				return '1';
			case 'hold':
				return '0';
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

	// TODO: actually use max_id/min_id
	public function get_comments( $status = null, $min_id = null, $max_id = null ) {
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
			'user_id',
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

	public function trashed_post_comments( $post_id, $statuses ) {
		wp_trash_post_comments( $post_id );
	}

	public function untrashed_post_comments( $post_id ) {
		wp_untrash_post_comments( $post_id );
	}

	public function comments_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->comments, Jetpack_Sync_Defaults::$default_comment_checksum_columns, 'comment_ID', Jetpack_Sync_Settings::get_comments_filter_sql(), $min_id, $max_id );
	}

	public function comment_meta_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->commentmeta, Jetpack_Sync_Defaults::$default_comment_meta_checksum_columns , 'meta_id', Jetpack_Sync_Settings::get_whitelisted_comment_meta_sql(), $min_id, $max_id );
	}

	public function options_checksum() {
		global $wpdb;

		$options_whitelist = "'" . implode( "', '", Jetpack_Sync_Defaults::$default_options_whitelist ) . "'";
		$where_sql = "option_name IN ( $options_whitelist )";

		return $this->table_checksum( $wpdb->options, Jetpack_Sync_Defaults::$default_option_checksum_columns, null, $where_sql, null, null );
	}


	public function update_option( $option, $value ) {
		return update_option( $option, $value );
	}

	public function get_option( $option, $default = false ) {
		return get_option( $option, $default );
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
			$wpdb->update( $table, array(
				'meta_key'   => $meta_key,
				'meta_value' => maybe_serialize( $meta_value ),
			), array( 'meta_id' => $meta_id ) );
		} else {
			$object_id_field = $type . '_id';
			$wpdb->insert( $table, array(
				'meta_id'        => $meta_id,
				$object_id_field => $object_id,
				'meta_key'       => $meta_key,
				'meta_value'     => maybe_serialize( $meta_value ),
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

	public function set_constant( $constant, $value ) {
		update_option( 'jetpack_constant_' . $constant, $value );
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

	public function get_allowed_mime_types( $user_id ) {

	}

	public function checksum_all() {
		$post_meta_checksum = $this->checksum_histogram( 'post_meta', 1 );
		$comment_meta_checksum = $this->checksum_histogram( 'comment_meta', 1 );

		return array(
			'posts'    => $this->posts_checksum(),
			'comments' => $this->comments_checksum(),
			'post_meta'=> reset( $post_meta_checksum ),
			'comment_meta'=> reset( $comment_meta_checksum ),
		);
	}

	function checksum_histogram( $object_type, $buckets, $start_id = null, $end_id = null, $columns = null, $strip_non_ascii = true ) {
		global $wpdb;

		$wpdb->queries = array();

		switch( $object_type ) {
			case "posts":
				$object_count = $this->post_count( null, $start_id, $end_id );
				$object_table = $wpdb->posts;
				$id_field     = 'ID';
				$where_sql    = Jetpack_Sync_Settings::get_blacklisted_post_types_sql();
				if ( empty( $columns ) ) {
					$columns  = Jetpack_Sync_Defaults::$default_post_checksum_columns;
				}
				break;
			case "post_meta":
				$object_table = $wpdb->postmeta;
				$where_sql    = Jetpack_Sync_Settings::get_whitelisted_post_meta_sql();
				$object_count = $this->meta_count( $object_table, $where_sql, $start_id, $end_id );
				$id_field     = 'meta_id';
				
				if ( empty( $columns ) ) {
					$columns  = Jetpack_Sync_Defaults::$default_post_meta_checksum_columns;
				}
				break;
			case "comments":
				$object_count = $this->comment_count( null, $start_id, $end_id );
				$object_table = $wpdb->comments;
				$id_field     = 'comment_ID';
				$where_sql    = Jetpack_Sync_Settings::get_comments_filter_sql();
				if ( empty( $columns ) ) {
					$columns  = Jetpack_Sync_Defaults::$default_comment_checksum_columns;
				}
				break;
			case "comment_meta":
				$object_table = $wpdb->commentmeta;
				$where_sql    = Jetpack_Sync_Settings::get_whitelisted_comment_meta_sql();
				$object_count = $this->meta_count( $object_table, $where_sql, $start_id, $end_id );
				$id_field     = 'meta_id';
				if ( empty( $columns ) ) {
					$columns  = Jetpack_Sync_Defaults::$default_post_meta_checksum_columns;
				}
				break;
			default:
				return false;
		}

		$bucket_size  = intval( ceil( $object_count / $buckets ) );
		$previous_max_id = 0;
		$histogram    = array();

		$where = '1=1';

		if ( $start_id ) {
			$where .= " AND $id_field >= " . intval( $start_id );
		}

		if ( $end_id ) {
			$where .= " AND $id_field <= " . intval( $end_id );
		}

		do {
			list( $first_id, $last_id ) = $wpdb->get_row(
				"SELECT MIN($id_field) as min_id, MAX($id_field) as max_id FROM ( SELECT $id_field FROM $object_table WHERE $where AND $id_field > $previous_max_id ORDER BY $id_field ASC LIMIT $bucket_size ) as ids",
				ARRAY_N
			);

			// get the checksum value
			$value = $this->table_checksum( $object_table, $columns, $id_field, $where_sql, $first_id, $last_id, $strip_non_ascii );

			if ( is_wp_error( $value ) ) {
				return $value;
			}

			if ( $first_id === null || $last_id === null ) {
				break;
			} elseif ( $first_id === $last_id ) {
				$histogram[ $first_id ] = $value;
			} else {
				$histogram[ "{$first_id}-{$last_id}" ] = $value;
			}

			$previous_max_id = $last_id;
		} while ( true );

		return $histogram;
	}

	private function table_checksum( $table, $columns, $id_column, $where_sql = '1=1', $min_id = null, $max_id = null, $strip_non_ascii = true ) {
		global $wpdb;

		// sanitize to just valid MySQL column names
		$sanitized_columns = preg_grep ( '/^[0-9,a-z,A-Z$_]+$/i', $columns );

		if ( $strip_non_ascii ) {
			$columns_sql = implode( ',', array_map( array( $this, 'strip_non_ascii_sql' ), $sanitized_columns ) );
		} else {
			$columns_sql = implode( ',', $sanitized_columns );
		}

		if ( $min_id !== null ) {
			$min_id = intval( $min_id );
			$where_sql .= " AND $id_column >= $min_id";
		}

		if ( $max_id !== null ) {
			$max_id = intval( $max_id );
			$where_sql .= " AND $id_column <= $max_id";
		}

		$query = <<<ENDSQL
			SELECT CONV(BIT_XOR(CRC32(CONCAT({$columns_sql}))), 10, 16)
				FROM $table
				WHERE $where_sql
ENDSQL;
		$result = $wpdb->get_var( $query );

		if ( $wpdb->last_error ) {
			return new WP_Error( 'database_error', $wpdb->last_error );
		}

		return $result;

	}

	private function meta_count( $table, $where_sql, $min_id, $max_id ) {
		global $wpdb;

		if ( $min_id != null ) {
			$where_sql .= ' AND meta_id >= ' . intval( $min_id );
		}

		if ( $max_id != null ) {
			$where_sql .= ' AND meta_id <= ' . intval( $max_id );
		}

		return $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE $where_sql" );
	}

	/**
	 * Wraps a column name in SQL which strips non-ASCII chars.
	 * This helps normalize data to avoid checksum differences caused by
	 * badly encoded data in the DB
	 */
	function strip_non_ascii_sql( $column_name ) {
		return "REPLACE( CONVERT( $column_name USING ascii ), '?', '' )";
	}

	private function invalid_call() {
		$backtrace = debug_backtrace();
		$caller    = $backtrace[1]['function'];
		throw new Exception( "This function $caller is not supported on the WP Replicastore" );
	}
}
