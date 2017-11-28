<?php

class Jetpack_Sync_Module_Users extends Jetpack_Sync_Module {
	const MAX_INITIAL_SYNC_USERS = 100;

	function name() {
		return 'users';
	}

	// this is here to support the backfill API
	public function get_object_by_id( $object_type, $id ) {
		if ( $object_type === 'user' && $user = get_user_by( 'id', intval( $id ) ) ) {
			return $this->sanitize_user_and_expand( $user );
		}

		return false;
	}

	public function init_listeners( $callable ) {
		// users
		add_action( 'user_register', array( $this, 'save_user_handler' ) );
		add_action( 'profile_update', array( $this, 'save_user_handler' ), 10, 2 );
		add_action( 'add_user_to_blog', array( $this, 'save_user_handler' ) );
		add_action( 'jetpack_sync_add_user', $callable, 10, 2 );
		add_action( 'jetpack_sync_register_user', $callable, 10, 2 );
		add_action( 'jetpack_sync_save_user', $callable );

		//Edit user info, see https://github.com/WordPress/WordPress/blob/c05f1dc805bddcc0e76fd90c4aaf2d9ea76dc0fb/wp-admin/user-edit.php#L126
		add_action( 'personal_options_update', array( $this, 'edited_user_handler' ) );
		add_action( 'edit_user_profile_update', array( $this, 'edited_user_handler' ) );
		add_action( 'jetpack_user_edited', $callable );

		add_action( 'jetpack_sync_user_locale', $callable, 10, 2 );
		add_action( 'jetpack_sync_user_locale_delete', $callable, 10, 1 );

		add_action( 'deleted_user', array( $this, 'deleted_user_handler' ), 10, 2 );
		add_action( 'jetpack_deleted_user', $callable, 10, 3 );
		add_action( 'remove_user_from_blog', array( $this, 'remove_user_from_blog_handler' ), 10, 2 );
		add_action( 'jetpack_removed_user_from_blog', $callable, 10, 2 );

		// user roles
		add_action( 'add_user_role', array( $this, 'save_user_role_handler' ), 10, 2 );
		add_action( 'set_user_role', array( $this, 'save_user_role_handler' ), 10, 3 );
		add_action( 'remove_user_role', array( $this, 'save_user_role_handler' ), 10, 2 );

		// user capabilities
		add_action( 'added_user_meta', array( $this, 'maybe_save_user_meta' ), 10, 4 );
		add_action( 'updated_user_meta', array( $this, 'maybe_save_user_meta' ), 10, 4 );
		add_action( 'deleted_user_meta', array( $this, 'maybe_save_user_meta' ), 10, 4 );

		// user authentication
		add_action( 'wp_login', $callable, 10, 2 );
		add_action( 'wp_logout', $callable, 10, 0 );
		add_action( 'wp_masterbar_logout', $callable, 10, 0 );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_users', $callable );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_sync_add_user', array( $this, 'expand_user' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_sync_register_user', array( $this, 'expand_user' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_sync_save_user', array( $this, 'expand_user' ), 10, 2 );
		add_filter( 'jetpack_sync_before_send_wp_login', array( $this, 'expand_login_username' ), 10, 1 );
		add_filter( 'jetpack_sync_before_send_wp_logout', array( $this, 'expand_logout_username' ), 10, 2 );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_users', array( $this, 'expand_users' ) );
	}

	public function sanitize_user_and_expand( $user ) {
		$user = $this->get_user( $user );
		$user = $this->add_to_user( $user );
		return $this->sanitize_user( $user );
	}

	private function get_user( $user ) {
		if ( $user && ! is_object( $user ) && is_numeric( $user ) ) {
			$user = get_user_by( 'id', $user );
		}
		if ( $user instanceof WP_User ) {
			return $user;
		}
		return null;
	}

	public function sanitize_user( $user ) {
		$user = $this->get_user( $user );
		// this create a new user object and stops the passing of the object by reference.
		$user = unserialize( serialize( $user ) );

		if ( is_object( $user ) && is_object( $user->data ) ) {
			unset( $user->data->user_pass );
		}
		if ( $user ) {
			$user->allcaps = $this->get_real_user_capabilities( $user );
		}
		return $user;
	}

	public function add_to_user( $user ) {
		if ( ! is_object( $user ) ) {
			return null;
		}
		$user->allowed_mime_types = get_allowed_mime_types( $user );

		if ( function_exists( 'get_user_locale' ) ) {

			// Only set the user locale if it is different from the site local
			if ( get_locale() !== get_user_locale( $user->ID ) ) {
				$user->locale = get_user_locale( $user->ID );
			}
		}

		return $user;
	}

	public function get_real_user_capabilities( $user ) {
		$user_capabilities = array();
		if ( is_wp_error( $user ) ) {
			return $user_capabilities;
		}
		foreach( Jetpack_Sync_Defaults::get_capabilities_whitelist() as $capability ) {
			if ( $user_has_capabilities = user_can( $user , $capability ) ) {
				$user_capabilities[ $capability ] = true;
			}
		}
		return $user_capabilities;
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
		
		$login = '';
		if ( is_object( $user ) && is_object( $user->data ) ) {
			$login = $user->data->user_login;
		}
		// if we don't have a user here lets not send anything.
		if ( empty( $login ) ) {
			return false;
		}

		return array( $login, $user );
	}

	public function deleted_user_handler( $deleted_user_id, $reassigned_user_id = '' ) {
		$is_multisite = is_multisite();
		/**
		 * Fires when a user is deleted on a site
		 *
		 * @since 5.4.0
		 *
		 * @param int $deleted_user_id - ID of the deleted user
		 * @param int $reassigned_user_id - ID of the user the deleted user's posts is reassigned to (if any)
		 * @param bool $is_multisite - Whether this site is a multisite installation
		 */
		do_action( 'jetpack_deleted_user', $deleted_user_id, $reassigned_user_id, $is_multisite );
	}

	public function edited_user_handler( $user_id ) {
		/**
		 * Fires when a user is edited on a site
		 *
		 * @since 5.4.0
		 *
		 * @param int $user_id - ID of the edited user
		 */
		do_action( 'jetpack_user_edited', $user_id );
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

		if ( 'user_register' === current_filter() ) {
			/**
			 * Fires when a new user is registered on a site
			 *
			 * @since 4.9.0
			 *
			 * @param object The WP_User object
			 */
			do_action( 'jetpack_sync_register_user', $user );

			return;
		}
		/* MU Sites add users instead of register them to sites */
		if ( 'add_user_to_blog' === current_filter() ) {
			/**
			 * Fires when a new user is added to a site. (WordPress Multisite)
			 *
			 * @since 4.9.0
			 *
			 * @param object The WP_User object
			 */
			do_action( 'jetpack_sync_add_user', $user );

			return;
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
		//The jetpack_sync_register_user payload is identical to jetpack_sync_save_user, don't send both
		if ( $this->is_create_user() || $this->is_add_user_to_blog() ) {
			return;
		}

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

	function maybe_save_user_meta( $meta_id, $user_id, $meta_key, $value ) {
		if ( $meta_key === 'locale' ) {
			if ( current_filter() === 'deleted_user_meta' ) {
				/**
				 * Allow listeners to listen for user local delete changes
				 *
				 * @since 4.8.0
				 *
				 * @param int $user_id - The ID of the user whos locale is being deleted
				 */
				do_action( 'jetpack_sync_user_locale_delete', $user_id );
			} else {
				/**
				 * Allow listeners to listen for user local changes
				 *
				 * @since 4.8.0
				 *
				 * @param int $user_id - The ID of the user whos locale is being changed
				 * @param int $value - The value of the new locale
				 */
				do_action( 'jetpack_sync_user_locale', $user_id, $value );
			}
		}
		$this->save_user_cap_handler( $meta_id, $user_id, $meta_key, $value );
	}

	function save_user_cap_handler( $meta_id, $user_id, $meta_key, $capabilities ) {
		//The jetpack_sync_register_user payload is identical to jetpack_sync_save_user, don't send both
		if ( $this->is_create_user() || $this->is_add_user_to_blog() ) {
			return;
		}

		// if a user is currently being removed as a member of this blog, we don't fire the event
		if ( current_filter() === 'deleted_user_meta'
		     &&
		     preg_match( '/capabilities|user_level/', $meta_key )
		     &&
		     ! is_user_member_of_blog( $user_id, get_current_blog_id() )
		) {
			return;
		}

		$user = get_user_by( 'id', $user_id );
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

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;

		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_users', $wpdb->usermeta, 'user_id', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
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

	public function remove_user_from_blog_handler( $user_id, $blog_id ) {
		//User is removed on add, see https://github.com/WordPress/WordPress/blob/0401cee8b36df3def8e807dd766adc02b359dfaf/wp-includes/ms-functions.php#L2114
		if ( $this->is_add_new_user_to_blog() ) {
			return;
		}

		$reassigned_user_id = $this->get_reassigned_network_user_id();

		//Note that we are in the context of the blog the user is removed from, see https://github.com/WordPress/WordPress/blob/473e1ba73bc5c18c72d7f288447503713d518790/wp-includes/ms-functions.php#L233
		/**
		 * Fires when a user is removed from a blog on a multisite installation
		 *
		 * @since 5.4.0
		 *
		 * @param int $user_id - ID of the removed user
		 * @param int $reassigned_user_id - ID of the user the removed user's posts is reassigned to (if any)
		 */
		do_action( 'jetpack_removed_user_from_blog', $user_id, $reassigned_user_id );
	}

	private function is_add_new_user_to_blog() {
		return Jetpack::is_function_in_backtrace( 'add_new_user_to_blog' );
	}

	private function is_add_user_to_blog() {
		return Jetpack::is_function_in_backtrace( 'add_user_to_blog' );
	}

	private function is_create_user() {
		$functions = array(
			'add_new_user_to_blog', // Used to suppress jetpack_sync_save_user in save_user_cap_handler when user registered on multi site
			'wp_create_user', // Used to suppress jetpack_sync_save_user in save_user_role_handler when user registered on multi site
			'wp_insert_user', // Used to suppress jetpack_sync_save_user in save_user_cap_handler and save_user_role_handler when user registered on single site
		);

		return Jetpack::is_function_in_backtrace( $functions );
	}

	private function get_reassigned_network_user_id() {
		$backtrace = debug_backtrace( false );
		foreach ( $backtrace as $call ) {
			if (
				'remove_user_from_blog' === $call['function'] &&
				3 === count( $call['args'] )
			) {
				return $call['args'][2];
			}
		}

		return false;
	}
}
