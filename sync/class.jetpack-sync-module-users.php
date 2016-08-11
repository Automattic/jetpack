<?php

class Jetpack_Sync_Module_Users extends Jetpack_Sync_Module {
	function name() {
		return 'users';
	}

	public function init_listeners( $callable ) {
		// users
		add_action( 'user_register', array( $this, 'save_user_handler' ) );
		add_action( 'profile_update', array( $this, 'save_user_handler' ), 10, 2 );
		add_action( 'add_user_to_blog', array( $this, 'save_user_handler' ) );
		add_action( 'jetpack_sync_save_user', $callable, 10, 2 );

		add_action( 'deleted_user', $callable, 10, 2 );
		add_action( 'remove_user_from_blog', $callable, 10, 2 );

		// user roles
		add_action( 'add_user_role', array( $this, 'save_user_role_handler' ), 10, 2 );
		add_action( 'set_user_role', array( $this, 'save_user_role_handler' ), 10, 3 );
		add_action( 'remove_user_role', array( $this, 'save_user_role_handler' ), 10, 2 );

		// user capabilities
		add_action( 'added_user_meta', array( $this, 'save_user_cap_handler' ), 10, 4 );
		add_action( 'updated_user_meta', array( $this, 'save_user_cap_handler' ), 10, 4 );
		add_action( 'deleted_user_meta', array( $this, 'save_user_cap_handler' ), 10, 4 );

		// user authentication
		add_action( 'wp_login', $callable, 10, 2 );
		add_action( 'wp_login_failed', $callable, 10, 2 );
		add_action( 'wp_logout', $callable, 10, 0 );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_users', $callable );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_sync_save_user', array( $this, 'expand_user' ) );
		add_filter( 'jetpack_sync_before_send_wp_login', array( $this, 'expand_login_username' ), 10, 1 );
		add_filter( 'jetpack_sync_before_send_wp_logout', array( $this, 'expand_logout_username' ), 10, 2 );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_users', array( $this, 'expand_users' ) );
	}

	public function sanitize_user_and_expand( $user ) {
		$user = $this->sanitize_user( $user );

		return $this->add_to_user( $user );
	}

	public function sanitize_user( $user ) {
		unset( $user->data->user_pass );

		return $user;
	}

	public function add_to_user( $user ) {
		$user->allowed_mime_types = get_allowed_mime_types( $user );

		return $user;
	}

	public function expand_user( $args ) {
		list( $user ) = $args;

		if ( $user ) {
			return array( $this->add_to_user( $user ) );	
		}

		return false;
	}

	public function expand_login_username( $args ) {
		list( $login, $user ) = $args;
		$user = $this->sanitize_user( $user );

		return array( $login, $user );
	}

	public function expand_logout_username( $args, $user_id ) {
		$user  = get_userdata( $user_id );
		$user  = $this->sanitize_user( $user );
		$login = $user->data->user_login;

		return array( $login, $user );
	}

	function save_user_handler( $user_id, $old_user_data = null ) {

		// ensure we only sync users who are members of the current blog
		if ( ! is_user_member_of_blog( $user_id, get_current_blog_id() ) ) {
			return;
		}

		$user = $this->sanitize_user( get_user_by( 'id', $user_id ) );

		// Older versions of WP don't pass the old_user_data in ->data
		if ( isset( $old_user_data->data ) ) {
			$old_user = $old_user_data->data;
		} else {
			$old_user = $old_user_data;
		}

		if ( $old_user !== null ) {
			unset( $old_user->user_pass );
			if ( serialize( $old_user ) === serialize( $user->data ) ) {
				return;
			}
		}
		/**
		 * Fires when the client needs to sync an updated user
		 *
		 * @since 4.2.0
		 *
		 * @param object The WP_User object
		 */
		do_action( 'jetpack_sync_save_user', $user );
	}

	function save_user_role_handler( $user_id, $role, $old_roles = null ) {
		$user = $this->sanitize_user( get_user_by( 'id', $user_id ) );

		/**
		 * Fires when the client needs to sync an updated user
		 *
		 * @since 4.2.0
		 *
		 * @param object The WP_User object
		 */
		do_action( 'jetpack_sync_save_user', $user );
	}

	function save_user_cap_handler( $meta_id, $user_id, $meta_key, $capabilities ) {

		// if a user is currently being removed as a member of this blog, we don't fire the event
		if ( current_filter() === 'deleted_user_meta'
		     &&
		     preg_match( '/capabilities|user_level/', $meta_key )
		     &&
		     ! is_user_member_of_blog( $user_id, get_current_blog_id() )
		) {
			return;
		}

		$user = $this->sanitize_user( get_user_by( 'id', $user_id ) );
		if ( $meta_key === $user->cap_key ) {
			/**
			 * Fires when the client needs to sync an updated user
			 *
			 * @since 4.2.0
			 *
			 * @param object The WP_User object
			 */
			do_action( 'jetpack_sync_save_user', $user );
		}
	}

	protected function enqueue_all_ids_as_action( $action_name, $table_name, $id_field, $where_sql ) {
		global $wpdb;

		if ( ! $where_sql ) {
			$where_sql = '1 = 1';
		}

		$items_per_page = 1000;
		$page           = 1;
		$chunk_count    = 0;
		$previous_id    = 0;

		while ( $ids = $wpdb->get_col( "SELECT user_id FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->base_prefix}user_level' AND {$where_sql} AND user_id > {$previous_id} ORDER BY user_id ASC LIMIT {$items_per_page}" ) ) {
			// Request posts in groups of N for efficiency
			$chunked_ids = array_chunk( $ids, self::ARRAY_CHUNK_SIZE );

			// Send each chunk as an array of objects
			foreach ( $chunked_ids as $chunk ) {
				/**
				 * Fires with a chunk of object IDs during full sync.
				 * These are expanded to full objects before upload
				 *
				 * @since 4.2.0
				 */
				do_action( $action_name, $chunk );
				$chunk_count ++;
			}

			$page += 1;
			$previous_id = end( $ids );
		}

		return $chunk_count;
	}

	public function enqueue_full_sync_actions( $config ) {
		global $wpdb;
		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_users', $wpdb->users, 'ID', $this->get_where_sql( $config ) );
	}

	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->base_prefix}user_level'";
		
		if ( $where_sql = $this->get_where_sql( $config ) ) {
			$query .= ' AND ' . $where_sql;
		}

		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	private function get_where_sql( $config ) {
		$query = '1=1';

		if ( $config === 'initial_sync' ) {
			$query = 'meta_value > 0';
		}

		// config is a list of user IDs to sync
		if ( is_array( $config ) ) {
			$query .= ' AND user_id IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return $query;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_users' );
	}

	public function expand_users( $args ) {
		$user_ids = $args[0];

		return array_map( array( $this, 'sanitize_user_and_expand' ), get_users( array( 'include' => $user_ids ) ) );
	}
}
