<?php

WP_CLI::add_command( 'jetpack', 'Jetpack_CLI' );

/**
 * Control your local Jetpack installation.
 */
class Jetpack_CLI extends WP_CLI_Command {

	/**
	 * Get Jetpack Details
	 *
	 * ## OPTIONS
	 *
	 * None. Simply returns details about whether or not your blog
	 * is connected, its Jetpack version, and WordPress.com blog_id.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack status
	 *
	 */
	public function status( $args, $assoc_args ) {
		if ( Jetpack::is_active() ) {
			WP_CLI::success( __( 'Jetpack is currently connected to WordPress.com', 'jetpack' ) );
			WP_CLI::line( sprintf( __( 'The Jetpack Version is %s', 'jetpack' ), JETPACK__VERSION ) );
			WP_CLI::line( sprintf( __( 'The WordPress.com blog_id is %d', 'jetpack' ), Jetpack_Options::get_option( 'id' ) ) );
		} else {
			WP_CLI::line( __( 'Jetpack is not currently connected to WordPress.com', 'jetpack' ) );
		}
	}

	/**
	 * Disconnect Jetpack Blogs or Users
	 *
	 * ## OPTIONS
	 *
	 * blog: Disconnect the entire blog.
	 *
	 * user <user_identifier>: Disconnect a specific user from WordPress.com.
	 *
	 * Please note, the primary account that the blog is connected
	 * to WordPress.com with cannot be disconnected without
	 * disconnecting the entire blog.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack disconnect blog
	 * wp jetpack disconnect user 13
	 * wp jetpack disconnect user username
	 * wp jetpack disconnect user email@domain.com
	 *
	 * @synopsis blog|[user <user_id>]
	 */
	public function disconnect( $args, $assoc_args ) {
		if ( ! Jetpack::is_active() ) {
			WP_CLI::error( __( 'You cannot disconnect, without having first connected.', 'jetpack' ) );
		}

		$action = isset( $args[0] ) ? $args[0] : 'prompt';
		if ( ! in_array( $action, array( 'blog', 'user', 'prompt' ) ) ) {
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $action ) );
		}

		if ( in_array( $action, array( 'user' ) ) ) {
			if ( isset( $args[1] ) ) {
				$user_id = $args[1];
				if ( ctype_digit( $user_id ) ) {
					$field = 'id';
					$user_id = (int) $user_id;
				} elseif ( is_email( $user_id ) ) {
					$field = 'email';
					$user_id = sanitize_user( $user_id, true );
				} else {
					$field = 'login';
					$user_id = sanitize_user( $user_id, true );
				}
				if ( ! $user = get_user_by( $field, $user_id ) ) {
					WP_CLI::error( __( 'Please specify a valid user.', 'jetpack' ) );
				}
			} else {
				WP_CLI::error( __( 'Please specify a user.', 'jetpack' ) );
			}
		}

		switch ( $action ) {
			case 'blog':
				Jetpack::log( 'disconnect' );
				Jetpack::disconnect();
				WP_CLI::success( __( 'Jetpack has been successfully disconnected.', 'jetpack' ) );
				break;
			case 'user':
				if ( Jetpack::unlink_user( $user->ID ) ) {
					Jetpack::log( 'unlink', $user->ID );
					WP_CLI::success( sprintf( __( '%s has been successfully disconnected.', 'jetpack' ), $action ) );
				} else {
					WP_CLI::error( sprintf( __( '%s could not be disconnected.  Are you sure they\'re connected currently?', 'jetpack' ), "{$user->login} <{$user->email}>" ) );
				}
				break;
			case 'prompt':
				WP_CLI::error( __( 'Please specify if you would like to disconnect a blog or user.', 'jetpack' ) );
				break;
		}
	}

	/**
	 * Manage Jetpack Modules
	 *
	 * ## OPTIONS
	 *
	 * list: View all available modules, and their status.
	 *
	 * activate <module_slug>: Activate a module.
	 *
	 * deactivate <module_slug>: Deactivate a module.
	 *
	 * toggle <module_slug>: Toggle a module on or off.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack module list
	 * wp jetpack module activate stats
	 * wp jetpack module deactivate stats
	 * wp jetpack module toggle stats
	 *
	 * @synopsis [list|activate|deactivate|toggle [<module_name>]]
	 */
	public function module( $args, $assoc_args ) {
		$action = isset( $args[0] ) ? $args[0] : 'list';
		if ( ! in_array( $action, array( 'list', 'activate', 'deactivate', 'toggle' ) ) ) {
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $action ) );
		}

		if ( in_array( $action, array( 'activate', 'deactivate', 'toggle' ) ) ) {
			if ( isset( $args[1] ) ) {
				$module_slug = $args[1];
				if ( ! Jetpack::is_module( $module_slug ) ) {
					WP_CLI::error( sprintf( __( '%s is not a valid module.', 'jetpack' ), $module_slug ) );
				}
				if ( 'toggle' == $action ) {
					$action = Jetpack::is_module_active( $module_slug ) ? 'deactivate' : 'activate';
				}
			} else {
				WP_CLI::line( __( 'Please specify a valid module.', 'jetpack' ) );
				$action = 'list';
			}
		}

		switch ( $action ) {
			case 'list':
				WP_CLI::line( __( 'Available Modules:', 'jetpack' ) );
				$modules = Jetpack::get_available_modules();
				sort( $modules );
				foreach( $modules as $module_slug ) {
					$active = Jetpack::is_module_active( $module_slug ) ? __( 'Active', 'jetpack' ) : __( 'Inactive', 'jetpack' );
					WP_CLI::line( "\t" . str_pad( $module_slug, 24 ) . $active );
				}
				break;
			case 'activate':
				$module = Jetpack::get_module( $module_slug );
				Jetpack::log( 'activate', $module_slug );
				Jetpack::activate_module( $module_slug, false );
				WP_CLI::success( sprintf( __( '%s has been activated.', 'jetpack' ), $module['name'] ) );
				break;
			case 'deactivate':
				$module = Jetpack::get_module( $module_slug );
				Jetpack::log( 'deactivate', $module_slug );
				Jetpack::deactivate_module( $module_slug );
				WP_CLI::success( sprintf( __( '%s has been deactivated.', 'jetpack' ), $module['name'] ) );
				break;
			case 'toggle':
				// Will never happen, should have been handled above and changed to activate or deactivate.
				break;
		}
	}

}
