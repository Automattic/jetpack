<?php

class Jetpack_Sync_Module_Users extends Jetpack_Sync_Module {
	const MAX_INITIAL_SYNC_USERS = 100;
	
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
		// this create a new user object and stops the passing of the object by reference.
		$user = unserialize( serialize( $user ) );
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

		$user =  get_user_by( 'id', $user_id );
		if ( $meta_key === $user->cap_key ) {
			/**
			 * Fires when the client needs to sync an updated user
			 *
			 * @since 4.2.0
			 *
			 * @param object The Sanitized WP_User object
			 */
			do_action( 'jetpack_sync_save_user', $this->sanitize_user( $user ) );
		}
	}

	public function enqueue_full_sync_actions( $config ) {
		global $wpdb;
		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_users', $wpdb->usermeta, 'user_id', $this->get_where_sql( $config ) );
	}

	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $wpdb->usermeta";
		
		if ( $where_sql = $this->get_where_sql( $config ) ) {
			$query .= ' WHERE ' . $where_sql;
		}

		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	private function get_where_sql( $config ) {
		global $wpdb;

		$query = "meta_key = '{$wpdb->prefix}capabilities'";
		
		// config is a list of user IDs to sync
		if ( is_array( $config ) ) {
			$query .= ' AND user_id IN (' . implode( ',', array_map( 'intval', $config ) ) . ')';
		}

		return $query;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_users' );
	}

	function get_initial_sync_user_config() {
		global $wpdb;

		$user_ids = $wpdb->get_col( "SELECT user_id FROM $wpdb->usermeta WHERE meta_key = '{$wpdb->prefix}user_level' AND meta_value > 0 LIMIT " . ( self::MAX_INITIAL_SYNC_USERS + 1 ) );

		if ( count( $user_ids ) <= self::MAX_INITIAL_SYNC_USERS ) {
			return $user_ids;
		} else {
			return false;
		}
	}

	public function expand_users( $args ) {
		$user_ids = $args[0];

		return array_map( array( $this, 'sanitize_user_and_expand' ), get_users( array( 'include' => $user_ids ) ) );
	}
}
