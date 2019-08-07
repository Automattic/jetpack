<?php
/**
 * Sync replicastore.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * An implementation of Replicastore Interface which returns data stored in a WordPress.org DB.
 * This is useful to compare values in the local WP DB to values in the synced replica store
 */
class Replicastore implements Replicastore_Interface {
	/**
	 * Empty and reset the replicastore.
	 *
	 * @access public
	 */
	public function reset() {
		global $wpdb;

		$wpdb->query( "DELETE FROM $wpdb->posts" );
		$wpdb->query( "DELETE FROM $wpdb->comments" );

		// Also need to delete terms from cache.
		$term_ids = $wpdb->get_col( "SELECT term_id FROM $wpdb->terms" );
		foreach ( $term_ids as $term_id ) {
			wp_cache_delete( $term_id, 'terms' );
		}

		$wpdb->query( "DELETE FROM $wpdb->terms" );

		$wpdb->query( "DELETE FROM $wpdb->term_taxonomy" );
		$wpdb->query( "DELETE FROM $wpdb->term_relationships" );

		// Callables and constants.
		$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE 'jetpack_%'" );
		$wpdb->query( "DELETE FROM $wpdb->postmeta WHERE meta_key NOT LIKE '\_%'" );
	}

	/**
	 * Ran when full sync has just started.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 */
	public function full_sync_start( $config ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->reset();
	}

	/**
	 * Ran when full sync has just finished.
	 *
	 * @access public
	 *
	 * @param string $checksum Deprecated since 7.3.0.
	 */
	public function full_sync_end( $checksum ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Noop right now.
	}

	/**
	 * Retrieve the number of terms.
	 *
	 * @access public
	 *
	 * @return int Number of terms.
	 */
	public function term_count() {
		global $wpdb;
		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->terms" );
	}

	/**
	 * Retrieve the number of rows in the `term_taxonomy` table.
	 *
	 * @access public
	 *
	 * @return int Number of terms.
	 */
	public function term_taxonomy_count() {
		global $wpdb;
		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->term_taxonomy" );
	}

	/**
	 * Retrieve the number of term relationships.
	 *
	 * @access public
	 *
	 * @return int Number of rows in the term relationships table.
	 */
	public function term_relationship_count() {
		global $wpdb;
		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->term_relationships" );
	}

	/**
	 * Retrieve the number of posts with a particular post status within a certain range.
	 *
	 * @access public
	 *
	 * @todo Prepare the SQL query before executing it.
	 *
	 * @param string $status Post status.
	 * @param int    $min_id Minimum post ID.
	 * @param int    $max_id Maximum post ID.
	 * @return int Number of posts.
	 */
	public function post_count( $status = null, $min_id = null, $max_id = null ) {
		global $wpdb;

		$where = '';

		if ( $status ) {
			$where = "post_status = '" . esc_sql( $status ) . "'";
		} else {
			$where = '1=1';
		}

		if ( ! empty( $min_id ) ) {
			$where .= ' AND ID >= ' . intval( $min_id );
		}

		if ( ! empty( $max_id ) ) {
			$where .= ' AND ID <= ' . intval( $max_id );
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->posts WHERE $where" );
	}

	/**
	 * Retrieve the posts with a particular post status.
	 *
	 * @access public
	 *
	 * @todo Implement range and actually use max_id/min_id arguments.
	 *
	 * @param string $status Post status.
	 * @param int    $min_id Minimum post ID.
	 * @param int    $max_id Maximum post ID.
	 * @return array Array of posts.
	 */
	public function get_posts( $status = null, $min_id = null, $max_id = null ) {
		$args = array(
			'orderby'        => 'ID',
			'posts_per_page' => -1,
		);

		if ( $status ) {
			$args['post_status'] = $status;
		} else {
			$args['post_status'] = 'any';
		}

		return get_posts( $args );
	}

	/**
	 * Retrieve a post object by the post ID.
	 *
	 * @access public
	 *
	 * @param int $id Post ID.
	 * @return \WP_Post Post object.
	 */
	public function get_post( $id ) {
		return get_post( $id );
	}

	/**
	 * Update or insert a post.
	 *
	 * @access public
	 *
	 * @param \WP_Post $post   Post object.
	 * @param bool     $silent Whether to perform a silent action. Not used in this implementation.
	 */
	public function upsert_post( $post, $silent = false ) {
		global $wpdb;

		// Reject the post if it's not a \WP_Post.
		if ( ! $post instanceof \WP_Post ) {
			return;
		}

		$post = $post->to_array();

		// Reject posts without an ID.
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

	/**
	 * Delete a post by the post ID.
	 *
	 * @access public
	 *
	 * @param int $post_id Post ID.
	 */
	public function delete_post( $post_id ) {
		wp_delete_post( $post_id, true );
	}

	/**
	 * Retrieve the checksum for posts within a range.
	 *
	 * @access public
	 *
	 * @param int $min_id Minimum post ID.
	 * @param int $max_id Maximum post ID.
	 * @return int The checksum.
	 */
	public function posts_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->posts, Defaults::$default_post_checksum_columns, 'ID', Settings::get_blacklisted_post_types_sql(), $min_id, $max_id );
	}

	/**
	 * Retrieve the checksum for post meta within a range.
	 *
	 * @access public
	 *
	 * @param int $min_id Minimum post meta ID.
	 * @param int $max_id Maximum post meta ID.
	 * @return int The checksum.
	 */
	public function post_meta_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->postmeta, Defaults::$default_post_meta_checksum_columns, 'meta_id', Settings::get_whitelisted_post_meta_sql(), $min_id, $max_id );
	}

	/**
	 * Retrieve the number of comments with a particular comment status within a certain range.
	 *
	 * @access public
	 *
	 * @todo Prepare the SQL query before executing it.
	 *
	 * @param string $status Comment status.
	 * @param int    $min_id Minimum comment ID.
	 * @param int    $max_id Maximum comment ID.
	 * @return int Number of comments.
	 */
	public function comment_count( $status = null, $min_id = null, $max_id = null ) {
		global $wpdb;

		$comment_approved = $this->comment_status_to_approval_value( $status );

		if ( false !== $comment_approved ) {
			$where = "comment_approved = '" . esc_sql( $comment_approved ) . "'";
		} else {
			$where = '1=1';
		}

		if ( ! empty( $min_id ) ) {
			$where .= ' AND comment_ID >= ' . intval( $min_id );
		}

		if ( ! empty( $max_id ) ) {
			$where .= ' AND comment_ID <= ' . intval( $max_id );
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->comments WHERE $where" );
	}

	/**
	 * Translate a comment status to a value of the comment_approved field.
	 *
	 * @access private
	 *
	 * @param string $status Comment status.
	 * @return string|bool New comment_approved value, false if the status doesn't affect it.
	 */
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

	/**
	 * Retrieve the comments with a particular comment status.
	 *
	 * @access public
	 *
	 * @todo Implement range and actually use max_id/min_id arguments.
	 *
	 * @param string $status Comment status.
	 * @param int    $min_id Minimum comment ID.
	 * @param int    $max_id Maximum comment ID.
	 * @return array Array of comments.
	 */
	public function get_comments( $status = null, $min_id = null, $max_id = null ) {
		$args = array(
			'orderby' => 'ID',
			'status'  => 'all',
		);

		if ( $status ) {
			$args['status'] = $status;
		}

		return get_comments( $args );
	}

	/**
	 * Retrieve a comment object by the comment ID.
	 *
	 * @access public
	 *
	 * @param int $id Comment ID.
	 * @return \WP_Comment Comment object.
	 */
	public function get_comment( $id ) {
		return \WP_Comment::get_instance( $id );
	}

	/**
	 * Update or insert a comment.
	 *
	 * @access public
	 *
	 * @param \WP_Comment $comment Comment object.
	 */
	public function upsert_comment( $comment ) {
		global $wpdb;

		$comment = $comment->to_array();

		// Filter by fields on comment table.
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
			if ( ! in_array( $key, $comment_fields_whitelist, true ) ) {
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

	/**
	 * Trash a comment by the comment ID.
	 *
	 * @access public
	 *
	 * @param int $comment_id Comment ID.
	 */
	public function trash_comment( $comment_id ) {
		wp_delete_comment( $comment_id );
	}

	/**
	 * Delete a comment by the comment ID.
	 *
	 * @access public
	 *
	 * @param int $comment_id Comment ID.
	 */
	public function delete_comment( $comment_id ) {
		wp_delete_comment( $comment_id, true );
	}

	/**
	 * Mark a comment by the comment ID as spam.
	 *
	 * @access public
	 *
	 * @param int $comment_id Comment ID.
	 */
	public function spam_comment( $comment_id ) {
		wp_spam_comment( $comment_id );
	}

	/**
	 * Trash the comments of a post.
	 *
	 * @access public
	 *
	 * @param int   $post_id  Post ID.
	 * @param array $statuses Post statuses. Not used in this implementation.
	 */
	public function trashed_post_comments( $post_id, $statuses ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		wp_trash_post_comments( $post_id );
	}

	/**
	 * Untrash the comments of a post.
	 *
	 * @access public
	 *
	 * @param int $post_id Post ID.
	 */
	public function untrashed_post_comments( $post_id ) {
		wp_untrash_post_comments( $post_id );
	}

	/**
	 * Retrieve the checksum for comments within a range.
	 *
	 * @access public
	 *
	 * @param int $min_id Minimum comment ID.
	 * @param int $max_id Maximum comment ID.
	 * @return int The checksum.
	 */
	public function comments_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->comments, Defaults::$default_comment_checksum_columns, 'comment_ID', Settings::get_comments_filter_sql(), $min_id, $max_id );
	}

	/**
	 * Retrieve the checksum for comment meta within a range.
	 *
	 * @access public
	 *
	 * @param int $min_id Minimum comment meta ID.
	 * @param int $max_id Maximum comment meta ID.
	 * @return int The checksum.
	 */
	public function comment_meta_checksum( $min_id = null, $max_id = null ) {
		global $wpdb;
		return $this->table_checksum( $wpdb->commentmeta, Defaults::$default_comment_meta_checksum_columns, 'meta_id', Settings::get_whitelisted_comment_meta_sql(), $min_id, $max_id );
	}

	/**
	 * Retrieve the checksum for all options.
	 *
	 * @access public
	 *
	 * @return int The checksum.
	 */
	public function options_checksum() {
		global $wpdb;
		$options_whitelist = "'" . implode( "', '", Defaults::$default_options_whitelist ) . "'";
		$where_sql         = "option_name IN ( $options_whitelist )";

		return $this->table_checksum( $wpdb->options, Defaults::$default_option_checksum_columns, null, $where_sql, null, null );
	}

	/**
	 * Update the value of an option.
	 *
	 * @access public
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Option value.
	 * @return bool False if value was not updated and true if value was updated.
	 */
	public function update_option( $option, $value ) {
		return update_option( $option, $value );
	}

	/**
	 * Retrieve an option value based on an option name.
	 *
	 * @access public
	 *
	 * @param string $option  Name of option to retrieve.
	 * @param mixed  $default Optional. Default value to return if the option does not exist.
	 * @return mixed Value set for the option.
	 */
	public function get_option( $option, $default = false ) {
		return get_option( $option, $default );
	}

	/**
	 * Remove an option by name.
	 *
	 * @access public
	 *
	 * @param string $option Name of option to remove.
	 * @return bool True, if option is successfully deleted. False on failure.
	 */
	public function delete_option( $option ) {
		return delete_option( $option );
	}

	/**
	 * Change the features that the current theme supports.
	 * Intentionally not implemented in this replicastore.
	 *
	 * @access public
	 *
	 * @param array $theme_support Features that the theme supports.
	 */
	public function set_theme_support( $theme_support ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Noop.
	}

	/**
	 * Whether the current theme supports a certain feature.
	 *
	 * @access public
	 *
	 * @param string $feature Name of the feature.
	 */
	public function current_theme_supports( $feature ) {
		return current_theme_supports( $feature );
	}

	/**
	 * Retrieve metadata for the specified object.
	 *
	 * @access public
	 *
	 * @param string $type       Meta type.
	 * @param int    $object_id  ID of the object.
	 * @param string $meta_key   Meta key.
	 * @param bool   $single     If true, return only the first value of the specified meta_key.
	 *
	 * @return mixed Single metadata value, or array of values.
	 */
	public function get_metadata( $type, $object_id, $meta_key = '', $single = false ) {
		return get_metadata( $type, $object_id, $meta_key, $single );
	}

	/**
	 * Stores remote meta key/values alongside an ID mapping key.
	 *
	 * @access public
	 *
	 * @todo Refactor to not use interpolated values when preparing the SQL query.
	 *
	 * @param string $type       Meta type.
	 * @param int    $object_id  ID of the object.
	 * @param string $meta_key   Meta key.
	 * @param mixed  $meta_value Meta value.
	 * @param int    $meta_id    ID of the meta.
	 *
	 * @return bool False if meta table does not exist, true otherwise.
	 */
	public function upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {
		$table = _get_meta_table( $type );
		if ( ! $table ) {
			return false;
		}

		global $wpdb;

		$exists = $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT EXISTS( SELECT 1 FROM $table WHERE meta_id = %d )",
				$meta_id
			)
		);

		if ( $exists ) {
			$wpdb->update(
				$table,
				array(
					'meta_key'   => $meta_key,
					'meta_value' => maybe_serialize( $meta_value ),
				),
				array( 'meta_id' => $meta_id )
			);
		} else {
			$object_id_field = $type . '_id';
			$wpdb->insert(
				$table,
				array(
					'meta_id'        => $meta_id,
					$object_id_field => $object_id,
					'meta_key'       => $meta_key,
					'meta_value'     => maybe_serialize( $meta_value ),
				)
			);
		}

		wp_cache_delete( $object_id, $type . '_meta' );

		return true;
	}

	/**
	 * Delete metadata for the specified object.
	 *
	 * @access public
	 *
	 * @todo Refactor to not use interpolated values when preparing the SQL query.
	 *
	 * @param string $type      Meta type.
	 * @param int    $object_id ID of the object.
	 * @param array  $meta_ids  IDs of the meta objects to delete.
	 */
	public function delete_metadata( $type, $object_id, $meta_ids ) {
		global $wpdb;

		$table = _get_meta_table( $type );
		if ( ! $table ) {
			return false;
		}

		foreach ( $meta_ids as $meta_id ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE meta_id = %d", $meta_id ) );
		}

		// If we don't have an object ID what do we do - invalidate ALL meta?
		if ( $object_id ) {
			wp_cache_delete( $object_id, $type . '_meta' );
		}
	}

	/**
	 * Delete metadata with a certain key for the specified objects.
	 *
	 * @access public
	 *
	 * @todo Test this out to make sure it works as expected.
	 * @todo Refactor to not use interpolated values when preparing the SQL query.
	 *
	 * @param string $type       Meta type.
	 * @param array  $object_ids IDs of the objects.
	 * @param string $meta_key   Meta key.
	 */
	public function delete_batch_metadata( $type, $object_ids, $meta_key ) {
		global $wpdb;

		$table = _get_meta_table( $type );
		if ( ! $table ) {
			return false;
		}
		$column = sanitize_key( $type . '_id' );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( $wpdb->prepare( "DELETE FROM $table WHERE $column IN (%s) && meta_key = %s", implode( ',', $object_ids ), $meta_key ) );

		// If we don't have an object ID what do we do - invalidate ALL meta?
		foreach ( $object_ids as $object_id ) {
			wp_cache_delete( $object_id, $type . '_meta' );
		}
	}

	/**
	 * Retrieve value of a constant based on the constant name.
	 *
	 * @access public
	 *
	 * @param string $constant Name of constant to retrieve.
	 * @return mixed Value set for the constant.
	 */
	public function get_constant( $constant ) {
		$value = get_option( 'jetpack_constant_' . $constant );

		if ( $value ) {
			return $value;
		}

		return null;
	}

	/**
	 * Set the value of a constant.
	 *
	 * @access public
	 *
	 * @param string $constant Name of constant to retrieve.
	 * @param mixed  $value    Value set for the constant.
	 */
	public function set_constant( $constant, $value ) {
		update_option( 'jetpack_constant_' . $constant, $value );
	}

	/**
	 * Retrieve the number of the available updates of a certain type.
	 * Type is one of: `plugins`, `themes`, `wordpress`, `translations`, `total`, `wp_update_version`.
	 *
	 * @access public
	 *
	 * @param string $type Type of updates to retrieve.
	 * @return int|null Number of updates available, `null` if type is invalid or missing.
	 */
	public function get_updates( $type ) {
		$all_updates = get_option( 'jetpack_updates', array() );

		if ( isset( $all_updates[ $type ] ) ) {
			return $all_updates[ $type ];
		} else {
			return null;
		}
	}

	/**
	 * Set the available updates of a certain type.
	 * Type is one of: `plugins`, `themes`, `wordpress`, `translations`, `total`, `wp_update_version`.
	 *
	 * @access public
	 *
	 * @param string $type    Type of updates to set.
	 * @param int    $updates Total number of updates.
	 */
	public function set_updates( $type, $updates ) {
		$all_updates          = get_option( 'jetpack_updates', array() );
		$all_updates[ $type ] = $updates;
		update_option( 'jetpack_updates', $all_updates );
	}

	/**
	 * Retrieve a callable value based on its name.
	 *
	 * @access public
	 *
	 * @param string $name Name of the callable to retrieve.
	 * @return mixed Value of the callable.
	 */
	public function get_callable( $name ) {
		$value = get_option( 'jetpack_' . $name );

		if ( $value ) {
			return $value;
		}

		return null;
	}

	/**
	 * Update the value of a callable.
	 *
	 * @access public
	 *
	 * @param string $name  Callable name.
	 * @param mixed  $value Callable value.
	 */
	public function set_callable( $name, $value ) {
		update_option( 'jetpack_' . $name, $value );
	}

	/**
	 * Retrieve a network option value based on a network option name.
	 *
	 * @access public
	 *
	 * @param string $option Name of network option to retrieve.
	 * @return mixed Value set for the network option.
	 */
	public function get_site_option( $option ) {
		return get_option( 'jetpack_network_' . $option );
	}

	/**
	 * Update the value of a network option.
	 *
	 * @access public
	 *
	 * @param string $option Network option name.
	 * @param mixed  $value  Network option value.
	 * @return bool False if value was not updated and true if value was updated.
	 */
	public function update_site_option( $option, $value ) {
		return update_option( 'jetpack_network_' . $option, $value );
	}

	/**
	 * Remove a network option by name.
	 *
	 * @access public
	 *
	 * @param string $option Name of option to remove.
	 * @return bool True, if option is successfully deleted. False on failure.
	 */
	public function delete_site_option( $option ) {
		return delete_option( 'jetpack_network_' . $option );
	}

	/**
	 * Retrieve the terms from a particular taxonomy.
	 *
	 * @access public
	 *
	 * @param string $taxonomy Taxonomy slug.
	 * @return array Array of terms.
	 */
	public function get_terms( $taxonomy ) {
		return get_terms( $taxonomy );
	}

	/**
	 * Retrieve a particular term.
	 *
	 * @access public
	 *
	 * @param string $taxonomy   Taxonomy slug.
	 * @param int    $term_id    ID of the term.
	 * @param bool   $is_term_id Whether this is a `term_id` or a `term_taxonomy_id`.
	 * @return \WP_Term|\WP_Error Term object on success, \WP_Error object on failure.
	 */
	public function get_term( $taxonomy, $term_id, $is_term_id = true ) {
		$t = $this->ensure_taxonomy( $taxonomy );
		if ( ! $t || is_wp_error( $t ) ) {
			return $t;
		}

		return get_term( $term_id, $taxonomy );
	}

	/**
	 * Verify a taxonomy is legitimate and register it if necessary.
	 *
	 * @access private
	 *
	 * @param string $taxonomy Taxonomy slug.
	 * @return bool|void|\WP_Error True if already exists; void if it was registered; \WP_Error on error.
	 */
	private function ensure_taxonomy( $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			// Try re-registering synced taxonomies.
			$taxonomies = $this->get_callable( 'taxonomies' );
			if ( ! isset( $taxonomies[ $taxonomy ] ) ) {
				// Doesn't exist, or somehow hasn't been synced.
				return new \WP_Error( 'invalid_taxonomy', "The taxonomy '$taxonomy' doesn't exist" );
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

	/**
	 * Retrieve all terms from a taxonomy that are related to an object with a particular ID.
	 *
	 * @access public
	 *
	 * @param int    $object_id Object ID.
	 * @param string $taxonomy  Taxonomy slug.
	 * @return array|bool|\WP_Error Array of terms on success, `false` if no terms or post doesn't exist, \WP_Error on failure.
	 */
	public function get_the_terms( $object_id, $taxonomy ) {
		return get_the_terms( $object_id, $taxonomy );
	}

	/**
	 * Insert or update a term.
	 *
	 * @access public
	 *
	 * @param \WP_Term $term_object Term object.
	 * @return array|bool|\WP_Error Array of term_id and term_taxonomy_id if updated, true if inserted, \WP_Error on failure.
	 */
	public function update_term( $term_object ) {
		$taxonomy = $term_object->taxonomy;
		global $wpdb;
		$exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT EXISTS( SELECT 1 FROM $wpdb->terms WHERE term_id = %d )",
				$term_object->term_id
			)
		);
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

	/**
	 * Delete a term by the term ID and its corresponding taxonomy.
	 *
	 * @access public
	 *
	 * @param int    $term_id  Term ID.
	 * @param string $taxonomy Taxonomy slug.
	 * @return bool|int|\WP_Error True on success, false if term doesn't exist. Zero if trying with default category. \WP_Error on invalid taxonomy.
	 */
	public function delete_term( $term_id, $taxonomy ) {
		return wp_delete_term( $term_id, $taxonomy );
	}

	/**
	 * Add/update terms of a particular taxonomy of an object with the specified ID.
	 *
	 * @access public
	 *
	 * @param int              $object_id The object to relate to.
	 * @param string           $taxonomy  The context in which to relate the term to the object.
	 * @param string|int|array $terms     A single term slug, single term id, or array of either term slugs or ids.
	 * @param bool             $append    Optional. If false will delete difference of terms. Default false.
	 */
	public function update_object_terms( $object_id, $taxonomy, $terms, $append ) {
		wp_set_object_terms( $object_id, $terms, $taxonomy, $append );
	}

	/**
	 * Remove certain term relationships from the specified object.
	 *
	 * @access public
	 *
	 * @todo Refactor to not use interpolated values when preparing the SQL query.
	 *
	 * @param int   $object_id ID of the object.
	 * @param array $tt_ids    Term taxonomy IDs.
	 * @return bool True on success, false on failure.
	 */
	public function delete_object_terms( $object_id, $tt_ids ) {
		global $wpdb;

		if ( is_array( $tt_ids ) && ! empty( $tt_ids ) ) {
			// Escape.
			$tt_ids_sanitized = array_map( 'intval', $tt_ids );

			$taxonomies = array();
			foreach ( $tt_ids_sanitized as $tt_id ) {
				$term                            = get_term_by( 'term_taxonomy_id', $tt_id );
				$taxonomies[ $term->taxonomy ][] = $tt_id;
			}
			$in_tt_ids = implode( ', ', $tt_ids_sanitized );

			/**
			 * Fires immediately before an object-term relationship is deleted.
			 *
			 * @since 2.9.0
			 *
			 * @param int   $object_id Object ID.
			 * @param array $tt_ids    An array of term taxonomy IDs.
			 */
			do_action( 'delete_term_relationships', $object_id, $tt_ids_sanitized );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$deleted = $wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->term_relationships WHERE object_id = %d AND term_taxonomy_id IN ($in_tt_ids)", $object_id ) );
			foreach ( $taxonomies as $taxonomy => $taxonomy_tt_ids ) {
				$this->ensure_taxonomy( $taxonomy );
				wp_cache_delete( $object_id, $taxonomy . '_relationships' );
				/**
				 * Fires immediately after an object-term relationship is deleted.
				 *
				 * @since 2.9.0
				 *
				 * @param int   $object_id Object ID.
				 * @param array $tt_ids    An array of term taxonomy IDs.
				 */
				do_action( 'deleted_term_relationships', $object_id, $taxonomy_tt_ids );
				wp_update_term_count( $taxonomy_tt_ids, $taxonomy );
			}

			return (bool) $deleted;
		}

		return false;
	}

	/**
	 * Retrieve the number of users.
	 * Not supported in this replicastore.
	 *
	 * @access public
	 */
	public function user_count() {
		// Noop.
	}

	/**
	 * Retrieve a user object by the user ID.
	 *
	 * @access public
	 *
	 * @param int $user_id User ID.
	 * @return \WP_User User object.
	 */
	public function get_user( $user_id ) {
		return \WP_User::get_instance( $user_id );
	}

	/**
	 * Insert or update a user.
	 * Not supported in this replicastore.
	 *
	 * @access public
	 * @throws \Exception If this method is invoked.
	 *
	 * @param \WP_User $user User object.
	 */
	public function upsert_user( $user ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->invalid_call();
	}

	/**
	 * Delete a user.
	 * Not supported in this replicastore.
	 *
	 * @access public
	 * @throws \Exception If this method is invoked.
	 *
	 * @param int $user_id User ID.
	 */
	public function delete_user( $user_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->invalid_call();
	}

	/**
	 * Update/insert user locale.
	 * Not supported in this replicastore.
	 *
	 * @access public
	 * @throws \Exception If this method is invoked.
	 *
	 * @param int    $user_id User ID.
	 * @param string $local   The user locale.
	 */
	public function upsert_user_locale( $user_id, $local ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->invalid_call();
	}

	/**
	 * Delete user locale.
	 * Not supported in this replicastore.
	 *
	 * @access public
	 * @throws \Exception If this method is invoked.
	 *
	 * @param int $user_id User ID.
	 */
	public function delete_user_locale( $user_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->invalid_call();
	}

	/**
	 * Retrieve the user locale.
	 *
	 * @access public
	 *
	 * @param int $user_id User ID.
	 * @return string The user locale.
	 */
	public function get_user_locale( $user_id ) {
		return get_user_locale( $user_id );
	}

	/**
	 * Retrieve the allowed mime types for the user.
	 * Not supported in this replicastore.
	 *
	 * @access public
	 *
	 * @param int $user_id User ID.
	 */
	public function get_allowed_mime_types( $user_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Noop.
	}

	/**
	 * Retrieve all the checksums we are interested in.
	 * Currently that is posts, comments, post meta and comment meta.
	 *
	 * @access public
	 *
	 * @return array Checksums.
	 */
	public function checksum_all() {
		$post_meta_checksum    = $this->checksum_histogram( 'post_meta', 1 );
		$comment_meta_checksum = $this->checksum_histogram( 'comment_meta', 1 );

		return array(
			'posts'        => $this->posts_checksum(),
			'comments'     => $this->comments_checksum(),
			'post_meta'    => reset( $post_meta_checksum ),
			'comment_meta' => reset( $comment_meta_checksum ),
		);
	}

	/**
	 * Retrieve the columns that are needed to calculate a checksum for an object type.
	 *
	 * @access public
	 *
	 * @todo Refactor to not use interpolated values and prepare the SQL query.
	 *
	 * @param string $object_type Object type.
	 * @return array|bool Columns, or false if invalid object type is specified.
	 */
	public function get_checksum_columns_for_object_type( $object_type ) {
		switch ( $object_type ) {
			case 'posts':
				return Defaults::$default_post_checksum_columns;
			case 'post_meta':
				return Defaults::$default_post_meta_checksum_columns;
			case 'comments':
				return Defaults::$default_comment_checksum_columns;
			case 'comment_meta':
				return Defaults::$default_post_meta_checksum_columns;
			case 'terms':
				return Defaults::$default_term_checksum_columns;
			case 'term_taxonomy':
				return Defaults::$default_term_taxonomy_checksum_columns;
			case 'term_relationships':
				return Defaults::$default_term_relationships_checksum_columns;
			default:
				return false;
		}
	}

	/**
	 * Grabs the minimum and maximum object ids for the given parameters.
	 *
	 * @access public
	 *
	 * @param string $id_field     The id column in the table to query.
	 * @param string $object_table The table to query.
	 * @param string $where        A sql where clause without 'WHERE'.
	 * @param int    $bucket_size  The maximum amount of objects to include in the query.
	 *                             For `term_relationships` table, the bucket size will refer to the amount
	 *                             of distinct object ids. This will likely include more database rows than
	 *                             the bucket size implies.
	 *
	 * @return object An object with min_id and max_id properties.
	 */
	public function get_min_max_object_id( $id_field, $object_table, $where, $bucket_size ) {
		global $wpdb;

		// The term relationship table's unique key is a combination of 2 columns. `DISTINCT` helps us get a more acurate query.
		$distinct_sql = ( $wpdb->term_relationships === $object_table ) ? 'DISTINCT' : '';
		$where_sql    = $where ? "WHERE $where" : '';

		// Since MIN() and MAX() do not work with LIMIT, we'll need to adjust the dataset we query if a limit is present.
		// With a limit present, we'll look at a dataset consisting of object_ids that meet the constructs of the $where clause.
		// Without a limit, we can use the actual table as a dataset.
		$from = $bucket_size ?
			"( SELECT $distinct_sql $id_field FROM $object_table $where_sql ORDER BY $id_field ASC LIMIT $bucket_size ) as ids" :
			"$object_table $where_sql ORDER BY $id_field ASC";

		return $wpdb->get_row(
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT MIN($id_field) as min, MAX($id_field) as max FROM $from"
		);
	}

	/**
	 * Retrieve the checksum histogram for a specific object type.
	 *
	 * @access public
	 *
	 * @todo Refactor to not use interpolated values and properly prepare the SQL query.
	 *
	 * @param string $object_type     Object type.
	 * @param int    $buckets         Number of buckets to split the objects to.
	 * @param int    $start_id        Minimum object ID.
	 * @param int    $end_id          Maximum object ID.
	 * @param array  $columns         Table columns to calculate the checksum from.
	 * @param bool   $strip_non_ascii Whether to strip non-ASCII characters.
	 * @param string $salt            Salt, used for $wpdb->prepare()'s args.
	 * @return array The checksum histogram.
	 */
	public function checksum_histogram( $object_type, $buckets, $start_id = null, $end_id = null, $columns = null, $strip_non_ascii = true, $salt = '' ) {
		global $wpdb;

		$wpdb->queries = array();

		if ( empty( $columns ) ) {
			$columns = $this->get_checksum_columns_for_object_type( $object_type );
		}

		switch ( $object_type ) {
			case 'posts':
				$object_count = $this->post_count( null, $start_id, $end_id );
				$object_table = $wpdb->posts;
				$id_field     = 'ID';
				$where_sql    = Settings::get_blacklisted_post_types_sql();
				break;
			case 'post_meta':
				$object_table = $wpdb->postmeta;
				$where_sql    = Settings::get_whitelisted_post_meta_sql();
				$object_count = $this->meta_count( $object_table, $where_sql, $start_id, $end_id );
				$id_field     = 'meta_id';
				break;
			case 'comments':
				$object_count = $this->comment_count( null, $start_id, $end_id );
				$object_table = $wpdb->comments;
				$id_field     = 'comment_ID';
				$where_sql    = Settings::get_comments_filter_sql();
				break;
			case 'comment_meta':
				$object_table = $wpdb->commentmeta;
				$where_sql    = Settings::get_whitelisted_comment_meta_sql();
				$object_count = $this->meta_count( $object_table, $where_sql, $start_id, $end_id );
				$id_field     = 'meta_id';
				break;
			case 'terms':
				$object_table = $wpdb->terms;
				$object_count = $this->term_count();
				$id_field     = 'term_id';
				$where_sql    = '1=1';
				break;
			case 'term_taxonomy':
				$object_table = $wpdb->term_taxonomy;
				$object_count = $this->term_taxonomy_count();
				$id_field     = 'term_taxonomy_id';
				$where_sql    = '1=1';
				break;
			case 'term_relationships':
				$object_table = $wpdb->term_relationships;
				$object_count = $this->term_relationship_count();
				$id_field     = 'object_id';
				$where_sql    = '1=1';
				break;
			default:
				return false;
		}

		$bucket_size     = intval( ceil( $object_count / $buckets ) );
		$previous_max_id = 0;
		$histogram       = array();

		// This is used for the min / max query, while $where_sql is used for the checksum query.
		$where = $where_sql;

		if ( $start_id ) {
			$where .= " AND $id_field >= " . intval( $start_id );
		}

		if ( $end_id ) {
			$where .= " AND $id_field <= " . intval( $end_id );
		}

		do {
			$result = $this->get_min_max_object_id(
				$id_field,
				$object_table,
				$where . " AND $id_field > $previous_max_id",
				$bucket_size
			);

			if ( null === $result->min || null === $result->max ) {
				// Nothing to checksum here...
				break;
			}

			// Get the checksum value.
			$value = $this->table_checksum( $object_table, $columns, $id_field, $where_sql, $result->min, $result->max, $strip_non_ascii, $salt );

			if ( is_wp_error( $value ) ) {
				return $value;
			}

			if ( null === $result->min || null === $result->max ) {
				break;
			} elseif ( $result->min === $result->max ) {
				$histogram[ $result->min ] = $value;
			} else {
				$histogram[ "{$result->min}-{$result->max}" ] = $value;
			}

			$previous_max_id = $result->max;
		} while ( true );

		return $histogram;
	}

	/**
	 * Retrieve the checksum for a specific database table.
	 *
	 * @access private
	 *
	 * @todo Refactor to properly prepare the SQL query.
	 *
	 * @param string $table           Table name.
	 * @param array  $columns         Table columns to calculate the checksum from.
	 * @param int    $id_column       Name of the unique ID column.
	 * @param string $where_sql       Additional WHERE clause SQL.
	 * @param int    $min_id          Minimum object ID.
	 * @param int    $max_id          Maximum object ID.
	 * @param bool   $strip_non_ascii Whether to strip non-ASCII characters.
	 * @param string $salt            Salt, used for $wpdb->prepare()'s args.
	 * @return int|\WP_Error The table histogram, or \WP_Error on failure.
	 */
	private function table_checksum( $table, $columns, $id_column, $where_sql = '1=1', $min_id = null, $max_id = null, $strip_non_ascii = true, $salt = '' ) {
		global $wpdb;

		// Sanitize to just valid MySQL column names.
		$sanitized_columns = preg_grep( '/^[0-9,a-z,A-Z$_]+$/i', $columns );

		if ( $strip_non_ascii ) {
			$columns_sql = implode( ',', array_map( array( $this, 'strip_non_ascii_sql' ), $sanitized_columns ) );
		} else {
			$columns_sql = implode( ',', $sanitized_columns );
		}

		if ( null !== $min_id && null !== $max_id ) {
			if ( $min_id === $max_id ) {
				$min_id     = intval( $min_id );
				$where_sql .= " AND $id_column = $min_id LIMIT 1";
			} else {
				$min_id     = intval( $min_id );
				$max_id     = intval( $max_id );
				$size       = $max_id - $min_id;
				$where_sql .= " AND $id_column >= $min_id AND $id_column <= $max_id LIMIT $size";
			}
		} else {
			if ( null !== $min_id ) {
				$min_id     = intval( $min_id );
				$where_sql .= " AND $id_column >= $min_id";
			}

			if ( null !== $max_id ) {
				$max_id     = intval( $max_id );
				$where_sql .= " AND $id_column <= $max_id";
			}
		}

		$query = <<<ENDSQL
			SELECT CAST( SUM( CRC32( CONCAT_WS( '#', '%s', {$columns_sql} ) ) ) AS UNSIGNED INT )
			FROM $table
			WHERE $where_sql;
ENDSQL;
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$result = $wpdb->get_var( $wpdb->prepare( $query, $salt ) );
		if ( $wpdb->last_error ) {
			return new \WP_Error( 'database_error', $wpdb->last_error );
		}

		return $result;
	}

	/**
	 * Retrieve the type of the checksum.
	 *
	 * @access public
	 *
	 * @return string Type of the checksum.
	 */
	public function get_checksum_type() {
		return 'sum';
	}

	/**
	 * Count the meta values in a table, within a specified range.
	 *
	 * @access private
	 *
	 * @todo Refactor to not use interpolated values when preparing the SQL query.
	 *
	 * @param string $table     Table name.
	 * @param string $where_sql Additional WHERE SQL.
	 * @param int    $min_id    Minimum meta ID.
	 * @param int    $max_id    Maximum meta ID.
	 * @return int Number of meta values.
	 */
	private function meta_count( $table, $where_sql, $min_id, $max_id ) {
		global $wpdb;

		if ( ! empty( $min_id ) ) {
			$where_sql .= ' AND meta_id >= ' . intval( $min_id );
		}

		if ( ! empty( $max_id ) ) {
			$where_sql .= ' AND meta_id <= ' . intval( $max_id );
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_var( "SELECT COUNT(*) FROM $table WHERE $where_sql" );
	}

	/**
	 * Wraps a column name in SQL which strips non-ASCII chars.
	 * This helps normalize data to avoid checksum differences caused by
	 * badly encoded data in the DB.
	 *
	 * @param string $column_name Name of the column.
	 * @return string Column name, without the non-ASCII chars.
	 */
	public function strip_non_ascii_sql( $column_name ) {
		return "REPLACE( CONVERT( $column_name USING ascii ), '?', '' )";
	}

	/**
	 * Used in methods that are not implemented and shouldn't be invoked.
	 *
	 * @access private
	 * @throws \Exception If this method is invoked.
	 */
	private function invalid_call() {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace
		$backtrace = debug_backtrace();
		$caller    = $backtrace[1]['function'];
		throw new \Exception( "This function $caller is not supported on the WP Replicastore" );
	}
}
