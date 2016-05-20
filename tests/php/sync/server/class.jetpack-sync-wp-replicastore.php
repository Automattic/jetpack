<?php

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
		// TODO
	}

	function full_sync_start() {
		$this->reset();
	}
	
	function full_sync_end() {
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

	public function upsert_post( $post ) {
		global $blog_id, $wpdb;

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
			'comment_status'        => '',
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
			$affected_rows = $wpdb->update( $wpdb->posts, $post, array( 'ID' => $post['ID'] ) );
		} else {
			$affected_rows = $wpdb->insert( $wpdb->posts, $post );
		}

		clean_post_cache( $post['ID'] );
	}

	public function delete_post( $post_id ) {
		wp_delete_post( $post_id, true );
	}

	public function posts_checksum() {
		global $wpdb;

		$query = <<<ENDSQL
			SELECT CONCAT(
				(SELECT sum(crc32(ID)) FROM $wpdb->posts),
				(SELECT sum(crc32(post_modified)) FROM $wpdb->posts)
			);
ENDSQL;

		return $wpdb->get_var($query);
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


	// meta
	public function get_metadata( $type, $object_id, $meta_key = '', $single = false ) {
		return get_metadata( $type, $object_id, $meta_key, $single );
	}
	public function upsert_metadata( $type, $object_id, $meta_key, $meta_value, $meta_id ) {
		// add_metadata( $type, $object_id, $meta_key, $value, $unique );
	}
	public function delete_metadata( $type, $object_id, $meta_ids ) {
		// TODO: SQL delete
		// delete_metadata( $meta_type, $object_id, $meta_key, $meta_value, $delete_all );
	}

	// constants
	public function get_constant( $constant ) {
		// TODO: Implement get_constant() method.
	}
	public function set_constants( $constants ) {
		// TODO: Implement get_constant() method.
	}

	public function get_updates( $type ) {
		// TODO: Implement get_updates() method.
	}

	public function set_updates( $type, $updates ) {
		// TODO: Implement set_updates() method.
	}

	// functions
	public function get_callable( $constant ) {
		// TODO: Implement get_constant() method.
	}
	public function set_callables( $constants ) {
		// TODO: Implement get_constant() method.
	}

	// network options
	public function get_site_option( $option ) {
		// TODO: Implement get_site_option
	}

	public function update_site_option( $option, $value ) {
		// TODO: Implement update_site_option
	}

	public function delete_site_option( $option ) {
		// TODO: Implement delete_site_option
	}

	// terms
	public function get_terms( $taxonomy ) {
		// TODO: Implement get_terms() method.
	}
	public function get_term( $taxonomy, $term_id, $is_term_id = true ) {
		// TODO: Implement get_term() method.
	}
	public function get_the_terms( $object_id, $taxonomy ) {
		// TODO: Implement get_the_terms() method.
	}
	public function update_object_terms( $object_id, $taxonomy, $terms, $append ) {
		// TODO: Implement update_object_terms method.
	}
	public function update_term( $term_object ) {
		// TODO: Implement update_term() method.
	}
	public function delete_term( $term_id, $taxonomy ) {
		// TODO: Implement delete_term() method.
	}
	public function delete_object_terms( $object_id, $tt_ids ) {
		// TODO: Implement delete_object_terms() method.
	}

	// users
	public function get_user( $user_id ) {
		// TODO: Implement get_user() method.
	}
	public function get_users() {
		// TODO: Implement get_users() method.
	}
	public function upsert_user( $user ) {
		// TODO: Implement update_user() method.
	}
	public function delete_user( $user_id ) {
		// TODO: Implement delete_user() method.
	}

}
