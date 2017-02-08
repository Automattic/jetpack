<?php

WP_CLI::add_command( 'jetpack', 'Jetpack_CLI' );

/**
 * Control your local Jetpack installation.
 */
class Jetpack_CLI extends WP_CLI_Command {

	// Aesthetics
	public $green_open  = "\033[32m";
	public $red_open    = "\033[31m";
	public $yellow_open = "\033[33m";
	public $color_close = "\033[0m";

	/**
	 * Get Jetpack Details
	 *
	 * ## OPTIONS
	 *
	 * empty: Leave it empty for basic stats
	 *
	 * full: View full stats.  It's the data from the heartbeat
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack status
	 * wp jetpack status full
	 *
	 */
	public function status( $args, $assoc_args ) {
		if ( ! Jetpack::is_active() ) {
			WP_CLI::error( __( 'Jetpack is not currently connected to WordPress.com', 'jetpack' ) );
		}

		if ( isset( $args[0] ) && 'full' !== $args[0] ) {
			/* translators: %s is a command like "prompt" */
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $args[0] ) );
		}

		/*
		 * Are they asking for all data?
		 *
		 * Loop through heartbeat data and organize by priority.
		 */
		$all_data = ( isset( $args[0] ) && 'full' == $args[0] ) ? 'full' : false;
		if ( $all_data ) {
			WP_CLI::success( __( 'Jetpack is currently connected to WordPress.com', 'jetpack' ) );
			WP_CLI::line( sprintf( __( "The Jetpack Version is %s", 'jetpack' ), JETPACK__VERSION ) );
			WP_CLI::line( sprintf( __( "The WordPress.com blog_id is %d", 'jetpack' ), Jetpack_Options::get_option( 'id' ) ) );

			// Heartbeat data
			WP_CLI::line( "\n" . __( 'Additional data: ', 'jetpack' ) );

			// Get the filtered heartbeat data.
			// Filtered so we can color/list by severity
			$stats = Jetpack::jetpack_check_heartbeat_data();

			// Display red flags first
			foreach ( $stats['bad'] as $stat => $value ) {
				printf( "$this->red_open%-'.16s %s $this->color_close\n", $stat, $value );
			}

			// Display caution warnings next
			foreach ( $stats['caution'] as $stat => $value ) {
				printf( "$this->yellow_open%-'.16s %s $this->color_close\n", $stat, $value );
			}

			// The rest of the results are good!
			foreach ( $stats['good'] as $stat => $value ) {

				// Modules should get special spacing for aestetics
				if ( strpos( $stat, 'odule-' ) ) {
					printf( "%-'.30s %s\n", $stat, $value );
					usleep( 4000 ); // For dramatic effect lolz
					continue;
				}
				printf( "%-'.16s %s\n", $stat, $value );
				usleep( 4000 ); // For dramatic effect lolz
			}
		} else {
			// Just the basics
			WP_CLI::success( __( 'Jetpack is currently connected to WordPress.com', 'jetpack' ) );
			WP_CLI::line( sprintf( __( 'The Jetpack Version is %s', 'jetpack' ), JETPACK__VERSION ) );
			WP_CLI::line( sprintf( __( 'The WordPress.com blog_id is %d', 'jetpack' ), Jetpack_Options::get_option( 'id' ) ) );
			WP_CLI::line( "\n" . _x( "View full status with 'wp jetpack status full'", '"wp jetpack status full" is a command - do not translate', 'jetpack' ) );
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
	 * @synopsis <blog|user> [<user_identifier>]
	 */
	public function disconnect( $args, $assoc_args ) {
		if ( ! Jetpack::is_active() ) {
			WP_CLI::error( __( 'You cannot disconnect, without having first connected.', 'jetpack' ) );
		}

		$action = isset( $args[0] ) ? $args[0] : 'prompt';
		if ( ! in_array( $action, array( 'blog', 'user', 'prompt' ) ) ) {
			/* translators: %s is a command like "prompt" */
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
				WP_CLI::error( __( 'Please specify a user by either ID, username, or email.', 'jetpack' ) );
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
					WP_CLI::success( __( 'User has been successfully disconnected.', 'jetpack' ) );
				} else {
					/* translators: %s is a username */
					WP_CLI::error( sprintf( __( "User %s could not be disconnected. Are you sure they're connected currently?", 'jetpack' ), "{$user->login} <{$user->email}>" ) );
				}
				break;
			case 'prompt':
				WP_CLI::error( __( 'Please specify if you would like to disconnect a blog or user.', 'jetpack' ) );
				break;
		}
	}

	/**
	 * Reset Jetpack options and settings to default
	 *
	 * ## OPTIONS
	 *
	 * modules: Resets modules to default state ( get_default_modules() )
	 *
	 * options: Resets all Jetpack options except:
	 *  - All private options (Blog token, user token, etc...)
	 *  - id (The Client ID/WP.com Blog ID of this site)
	 *  - master_user
	 *  - version
	 *  - activated
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack reset options
	 * wp jetpack reset modules
	 *
	 * @synopsis <modules|options>
	 */
	public function reset( $args, $assoc_args ) {
		$action = isset( $args[0] ) ? $args[0] : 'prompt';
		if ( ! in_array( $action, array( 'options', 'modules' ) ) ) {
			/* translators: %s is a command like "prompt" */
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $action ) );
		}

		// Are you sure?
		jetpack_cli_are_you_sure();

		switch ( $action ) {
			case 'options':
				$options_to_reset = Jetpack::get_jetpack_options_for_reset();

				// Reset the Jetpack options
				_e( "Resetting Jetpack Options...\n", "jetpack" );
				sleep(1); // Take a breath
				foreach ( $options_to_reset['jp_options'] as $option_to_reset ) {
					Jetpack_Options::delete_option( $option_to_reset );
					usleep( 100000 );
					/* translators: This is the result of an action. The option named %s was reset */
					WP_CLI::success( sprintf( __( '%s option reset', 'jetpack' ), $option_to_reset ) );
				}

				// Reset the WP options
				_e( "Resetting the jetpack options stored in wp_options...\n", "jetpack" );
				usleep( 500000 ); // Take a breath
				foreach ( $options_to_reset['wp_options'] as $option_to_reset ) {
					delete_option( $option_to_reset );
					usleep( 100000 );
					/* translators: This is the result of an action. The option named %s was reset */
					WP_CLI::success( sprintf( __( '%s option reset', 'jetpack' ), $option_to_reset ) );
				}

				// Reset to default modules
				_e( "Resetting default modules...\n", "jetpack" );
				usleep( 500000 ); // Take a breath
				$default_modules = Jetpack::get_default_modules();
				Jetpack::update_active_modules( $default_modules );
				WP_CLI::success( __( 'Modules reset to default.', 'jetpack' ) );

				// Jumpstart option is special
				Jetpack_Options::update_option( 'jumpstart', 'new_connection' );
				WP_CLI::success( __( 'jumpstart option reset', 'jetpack' ) );
				break;
			case 'modules':
				$default_modules = Jetpack::get_default_modules();
				Jetpack::update_active_modules( $default_modules );
				WP_CLI::success( __( 'Modules reset to default.', 'jetpack' ) );
				break;
			case 'prompt':
				WP_CLI::error( __( 'Please specify if you would like to reset your options, or modules', 'jetpack' ) );
				break;
		}
	}

	/**
	 * Manage Jetpack Modules
	 *
	 * ## OPTIONS
	 *
	 * list          : View all available modules, and their status.
	 * activate all  : Activate all modules
	 * deactivate all: Deactivate all modules
	 *
	 * activate   <module_slug> : Activate a module.
	 * deactivate <module_slug> : Deactivate a module.
	 * toggle     <module_slug> : Toggle a module on or off.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack module list
	 * wp jetpack module activate stats
	 * wp jetpack module deactivate stats
	 * wp jetpack module toggle stats
	 *
	 * wp jetpack module activate all
	 * wp jetpack module deactivate all
	 *
	 * @synopsis <list|activate|deactivate|toggle> [<module_name>]
	 */
	public function module( $args, $assoc_args ) {
		$action = isset( $args[0] ) ? $args[0] : 'list';
		if ( ! in_array( $action, array( 'list', 'activate', 'deactivate', 'toggle' ) ) ) {
			/* translators: %s is a command like "prompt" */
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $action ) );
		}
		if ( in_array( $action, array( 'activate', 'deactivate', 'toggle' ) ) ) {
			if ( isset( $args[1] ) ) {
				$module_slug = $args[1];
				if ( 'all' !== $module_slug && ! Jetpack::is_module( $module_slug ) ) {
					WP_CLI::error( sprintf( __( '%s is not a valid module.', 'jetpack' ), $module_slug ) );
				}
				if ( 'toggle' == $action ) {
					$action = Jetpack::is_module_active( $module_slug ) ? 'deactivate' : 'activate';
				}
				// Bulk actions
				if ( 'all' == $args[1] ) {
					$action = ( 'deactivate' == $action ) ? 'deactivate_all' : 'activate_all';
				}
				// VaultPress needs to be handled elsewhere.
				if ( in_array( $action, array( 'activate', 'deactivate', 'toggle' ) ) && 'vaultpress' == $args[1] ) {
					WP_CLI::error( sprintf( _x( 'Please visit %s to configure your VaultPress subscription.', '%s is a website', 'jetpack' ), esc_url( 'https://vaultpress.com/jetpack/' ) ) );
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
					if ( 'vaultpress' == $module_slug ) {
						continue;
					}
					$active = Jetpack::is_module_active( $module_slug ) ? __( 'Active', 'jetpack' ) : __( 'Inactive', 'jetpack' );
					WP_CLI::line( "\t" . str_pad( $module_slug, 24 ) . $active );
				}
				break;
			case 'activate':
				$module = Jetpack::get_module( $module_slug );
				Jetpack::log( 'activate', $module_slug );
				Jetpack::activate_module( $module_slug, false, false );
				WP_CLI::success( sprintf( __( '%s has been activated.', 'jetpack' ), $module['name'] ) );
				break;
			case 'activate_all':
				$modules = Jetpack::get_available_modules();
				Jetpack::update_active_modules( $modules );
				WP_CLI::success( __( 'All modules activated!', 'jetpack' ) );
				break;
			case 'deactivate':
				$module = Jetpack::get_module( $module_slug );
				Jetpack::log( 'deactivate', $module_slug );
				Jetpack::deactivate_module( $module_slug );
				WP_CLI::success( sprintf( __( '%s has been deactivated.', 'jetpack' ), $module['name'] ) );
				break;
			case 'deactivate_all':
				Jetpack::delete_active_modules();
				WP_CLI::success( __( 'All modules deactivated!', 'jetpack' ) );
				break;
			case 'toggle':
				// Will never happen, should have been handled above and changed to activate or deactivate.
				break;
		}
	}

	/**
	 * Manage Protect Settings
	 *
	 * ## OPTIONS
	 *
	 * whitelist: Whitelist an IP address.  You can also read or clear the whitelist.
	 *
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack protect whitelist <ip address>
	 * wp jetpack protect whitelist list
	 * wp jetpack protect whitelist clear
	 *
	 * @synopsis <whitelist> [<ip|ip_low-ip_high|list|clear>]
	 */
	public function protect( $args, $assoc_args ) {
		$action = isset( $args[0] ) ? $args[0] : 'prompt';
		if ( ! in_array( $action, array( 'whitelist' ) ) ) {
			/* translators: %s is a command like "prompt" */
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $action ) );
		}
		// Check if module is active
		if ( ! Jetpack::is_module_active( __FUNCTION__ ) ) {
			WP_CLI::error( sprintf( _x( '%s is not active. You can activate it with "wp jetpack module activate %s"', '"wp jetpack module activate" is a command - do not translate', 'jetpack' ), __FUNCTION__, __FUNCTION__ ) );
		}
		if ( in_array( $action, array( 'whitelist' ) ) ) {
			if ( isset( $args[1] ) ) {
				$action = 'whitelist';
			} else {
				$action = 'prompt';
			}
		}
		switch ( $action ) {
			case 'whitelist':
				$whitelist         = array();
				$new_ip            = $args[1];
				$current_whitelist = get_site_option( 'jetpack_protect_whitelist' );

				// Build array of IPs that are already whitelisted.
				// Re-build manually instead of using jetpack_protect_format_whitelist() so we can easily get
				// low & high range params for jetpack_protect_ip_address_is_in_range();
				foreach( $current_whitelist as $whitelisted ) {

					// IP ranges
					if ( $whitelisted->range ) {

						// Is it already whitelisted?
						if ( jetpack_protect_ip_address_is_in_range( $new_ip, $whitelisted->range_low, $whitelisted->range_high ) ) {
							/* translators: %s is an IP address */
							WP_CLI::error( sprintf( __( '%s has already been whitelisted', 'jetpack' ), $new_ip ) );
							break;
						}
						$whitelist[] = $whitelisted->range_low . " - " . $whitelisted->range_high;

					} else { // Individual IPs

						// Check if the IP is already whitelisted (single IP only)
						if ( $new_ip == $whitelisted->ip_address ) {
							/* translators: %s is an IP address */
							WP_CLI::error( sprintf( __( '%s has already been whitelisted', 'jetpack' ), $new_ip ) );
							break;
						}
						$whitelist[] = $whitelisted->ip_address;

					}
				}

				/*
				 * List the whitelist
				 * Done here because it's easier to read the $whitelist array after it's been rebuilt
				 */
				if ( isset( $args[1] ) && 'list' == $args[1] ) {
					if ( ! empty( $whitelist ) ) {
						WP_CLI::success( __( 'Here are your whitelisted IPs:', 'jetpack' ) );
						foreach ( $whitelist as $ip ) {
							WP_CLI::line( "\t" . str_pad( $ip, 24 ) ) ;
						}
					} else {
						WP_CLI::line( __( 'Whitelist is empty.', "jetpack" ) ) ;
					}
					break;
				}

				/*
				 * Clear the whitelist
				 */
				if ( isset( $args[1] ) && 'clear' == $args[1] ) {
					if ( ! empty( $whitelist ) ) {
						$whitelist = array();
						jetpack_protect_save_whitelist( $whitelist );
						WP_CLI::success( __( 'Cleared all whitelisted IPs', 'jetpack' ) );
					} else {
						WP_CLI::line( __( 'Whitelist is empty.', "jetpack" ) ) ;
					}
					break;
				}

				// Append new IP to whitelist array
				array_push( $whitelist, $new_ip );

				// Save whitelist if there are no errors
				$result = jetpack_protect_save_whitelist( $whitelist );
				if ( is_wp_error( $result ) ) {
					WP_CLI::error( __( $result, 'jetpack' ) );
				}

				/* translators: %s is an IP address */
				WP_CLI::success( sprintf( __( '%s has been whitelisted.', 'jetpack' ), $new_ip ) );
				break;
			case 'prompt':
				WP_CLI::error(
					__( 'No command found.', 'jetpack' ) . "\n" .
					__( 'Please enter the IP address you want to whitelist.', 'jetpack' ) . "\n" .
					_x( 'You can save a range of IPs {low_range}-{high_range}. No spaces allowed.  (example: 1.1.1.1-2.2.2.2)', 'Instructions on how to whitelist IP ranges - low_range/high_range should be translated.', 'jetpack' ) . "\n" .
					_x( "You can also 'list' or 'clear' the whitelist.", "'list' and 'clear' are commands and should not be translated", 'jetpack' ) . "\n"
				);
				break;
		}
	}

	/**
	 * Manage Jetpack Options
	 *
	 * ## OPTIONS
	 *
	 * list   : List all jetpack options and their values
	 * delete : Delete an option
	 *          - can only delete options that are white listed.
	 * update : update an option
	 *          - can only update option strings
	 * get    : get the value of an option
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack options list
	 * wp jetpack options get    <option_name>
	 * wp jetpack options delete <option_name>
	 * wp jetpack options update <option_name> [<option_value>]
	 *
	 * @synopsis <list|get|delete|update> [<option_name>] [<option_value>]
	 */
	public function options( $args, $assoc_args ) {
		$action = isset( $args[0] ) ? $args[0] : 'list';
		$safe_to_modify = Jetpack::get_jetpack_options_for_reset();

		// Jumpstart is special
		array_push( $safe_to_modify, 'jumpstart' );

		// Is the option flagged as unsafe?
		$flagged = ! in_array( $args[1], $safe_to_modify );

		if ( ! in_array( $action, array( 'list', 'get', 'delete', 'update' ) ) ) {
			/* translators: %s is a command like "prompt" */
			WP_CLI::error( sprintf( __( '%s is not a valid command.', 'jetpack' ), $action ) );
		}

		if ( isset( $args[0] ) ) {
			if ( 'get' == $args[0] && isset( $args[1] ) ) {
				$action = 'get';
			} else if ( 'delete' == $args[0] && isset( $args[1] ) ) {
				$action = 'delete';
			} else if ( 'update' == $args[0] && isset( $args[1] ) ) {
				$action = 'update';
			} else {
				$action = 'list';
			}
		}

		// Bail if the option isn't found
		$option = isset( $args[1] ) ? Jetpack_Options::get_option( $args[1] ) : false;
		if ( isset( $args[1] ) && ! $option && 'update' !== $args[0] ) {
			WP_CLI::error( __( 'Option not found or is empty.  Use "list" to list option names', 'jetpack' ) );
		}

		// Let's print_r the option if it's an array
		// Used in the 'get' and 'list' actions
		$option = is_array( $option ) ? print_r( $option ) : $option;

		switch ( $action ) {
			case 'get':
				WP_CLI::success( "\t" . $option );
				break;
			case 'delete':
				jetpack_cli_are_you_sure( $flagged );

				Jetpack_Options::delete_option( $args[1] );
				WP_CLI::success( sprintf( __( 'Deleted option: %s', 'jetpack' ), $args[1] ) );
				break;
			case 'update':
				jetpack_cli_are_you_sure( $flagged );

				// Updating arrays would get pretty tricky...
				$value = Jetpack_Options::get_option( $args[1] );
				if ( $value && is_array( $value ) ) {
					WP_CLI::error( __( 'Sorry, no updating arrays at this time', 'jetpack' ) );
				}

				Jetpack_Options::update_option( $args[1], $args[2] );
				WP_CLI::success( sprintf( _x( 'Updated option: %s to "%s"', 'Updating an option from "this" to "that".', 'jetpack' ), $args[1], $args[2] ) );
				break;
			case 'list':
				$options_compact     = Jetpack_Options::get_option_names();
				$options_non_compact = Jetpack_Options::get_option_names( 'non_compact' );
				$options_private     = Jetpack_Options::get_option_names( 'private' );
				$options             = array_merge( $options_compact, $options_non_compact, $options_private );

				// Table headers
				WP_CLI::line( "\t" . str_pad( __( 'Option', 'jetpack' ), 30 ) . __( 'Value', 'jetpack' ) );

				// List out the options and their values
				// Tell them if the value is empty or not
				// Tell them if it's an array
				foreach ( $options as $option ) {
					$value = Jetpack_Options::get_option( $option );
					if ( ! $value ) {
						WP_CLI::line( "\t" . str_pad( $option, 30 ) . 'Empty' );
						continue;
					}

					if ( ! is_array( $value ) ) {
						WP_CLI::line( "\t" . str_pad( $option, 30 ) . $value );
					} else if ( is_array( $value ) ) {
						WP_CLI::line( "\t" . str_pad( $option, 30 ) . 'Array - Use "get <option>" to read option array.' );
					}
				}
				$option_text = '{' . _x( 'option', 'a variable command that a user can write, provided in the printed instructions', 'jetpack' ) . '}';
				$value_text  = '{' . _x( 'value', 'the value that they want to update the option to', 'jetpack' ) . '}';

				WP_CLI::success(
					_x( "Above are your options. You may 'get', 'delete', and 'update' them.", "'get', 'delete', and 'update' are commands - do not translate.", 'jetpack' ) . "\n" .
					str_pad( 'wp jetpack options get', 26 )    . $option_text . "\n" .
					str_pad( 'wp jetpack options delete', 26 ) . $option_text . "\n" .
					str_pad( 'wp jetpack options update', 26 ) . "$option_text $value_text" . "\n" .
					_x( "Type 'wp jetpack options' for more info.", "'wp jetpack options' is a command - do not translate.", 'jetpack' ) . "\n"
				);
				break;
		}
	}

	/**
	 * Get the status of or start a new Jetpack sync.
	 *
	 * ## OPTIONS
	 *
	 * status : Print the current sync status
	 * start  : Start a full sync from this site to WordPress.com
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack sync status
	 * wp jetpack sync start --modules=functions --sync_wait_time=5
	 *
	 * @synopsis <status|start> [--<field>=<value>]
	 */
	public function sync( $args, $assoc_args ) {
		if ( ! Jetpack_Sync_Actions::sync_allowed() ) {
			WP_CLI::error( __( 'Jetpack sync is not currently allowed for this site.', 'jetpack' ) );
		}

		$action = isset( $args[0] ) ? $args[0] : 'status';

		switch ( $action ) {
			case 'status':
				$status = Jetpack_Sync_Actions::get_sync_status();
				$collection = array();
				foreach ( $status as $key => $item ) {
					$collection[]  = array(
						'option' => $key,
						'value' => is_scalar( $item ) ? $item : json_encode( $item )
					);
				}

				WP_CLI\Utils\format_items( 'table', $collection, array( 'option', 'value' ) );
				break;
			case 'start':
				// Get the original settings so that we can restore them later
				$original_settings = Jetpack_Sync_Settings::get_settings();

				// Initialize sync settigns so we can sync as quickly as possible
				$sync_settings = wp_parse_args(
					array_intersect_key( $assoc_args, Jetpack_Sync_Settings::$valid_settings ),
					array(
						'sync_wait_time' => 0,
						'enqueue_wait_time' => 0,
						'queue_max_writes_sec' => 10000,
						'max_queue_size_full_sync' => 100000
					)
				);
				Jetpack_Sync_Settings::update_settings( $sync_settings );

				// Convert comma-delimited string of modules to an array
				if ( ! empty( $assoc_args['modules'] ) ) {
					$modules = array_map( 'trim', explode( ',', $assoc_args['modules'] ) );

					// Convert the array so that the keys are the module name and the value is true to indicate
					// that we want to sync the module
					$modules = array_map( '__return_true', array_flip( $modules ) );
				}

				foreach ( array( 'posts', 'comments', 'users' ) as $module_name ) {
					if (
						'users' === $module_name &&
						isset( $assoc_args[ $module_name ] ) &&
						'initial' === $assoc_args[ $module_name ]
					) {
						$modules[ 'users' ] = 'initial';
					} elseif ( isset( $assoc_args[ $module_name ] ) ) {
						$ids = explode( ',', $assoc_args[ $module_name ] );
						if ( count( $ids ) > 0 ) {
							$modules[ $module_name ] = $ids;
						}
					}
				}

				if ( empty( $modules ) ) {
					$modules = null;
				}

				// Kick off a full sync
				if ( Jetpack_Sync_Actions::do_full_sync( $modules ) ) {
					if ( $modules ) {
						WP_CLI::log( sprintf( __( 'Initialized a new full sync with modules: ', 'jetpack' ), join( ', ', $modules ) ) );
					} else {
						WP_CLI::log( __( 'Initialized a new full sync', 'jetpack' ) );
					}
				} else {

					// Reset sync settings to original.
					Jetpack_Sync_Settings::update_settings( $original_settings );

					if ( $modules ) {
						WP_CLI::error( sprintf( __( 'Could not start a new full sync with modules: %s', 'jetpack' ), join( ', ', $modules ) ) );
					} else {
						WP_CLI::error( __( 'Could not start a new full sync', 'jetpack' ) );
					}
				}

				// Keep sending to WPCOM until there's nothing to send
				$i = 1;
				do {
					$result = Jetpack_Sync_Actions::$sender->do_full_sync();
					if ( $result ) {
						if ( 1 == $i++ ) {
							WP_CLI::log( __( 'Sent data to WordPress.com', 'jetpack' ) );
						} else {
							WP_CLI::log( __( 'Sent more data to WordPress.com', 'jetpack' ) );
						}
					}
				} while ( $result );

				// Reset sync settings to original.
				Jetpack_Sync_Settings::update_settings( $original_settings );

				WP_CLI::success( __( 'Finished syncing to WordPress.com', 'jetpack' ) );
				break;
		}
	}

	/**
	 * List the contents of a specific Jetpack sync queue.
	 *
	 * ## OPTIONS
	 *
	 * peek : List the 100 front-most items on the queue.
	 *
	 * ## EXAMPLES
	 *
	 * wp jetpack sync_queue full_sync peek
	 *
	 * @synopsis <incremental|full_sync> <peek>
	 */
	public function sync_queue( $args, $assoc_args ) {
		if ( ! Jetpack_Sync_Actions::sync_allowed() ) {
			WP_CLI::error( __( 'Jetpack sync is not currently allowed for this site.', 'jetpack' ) );
		}

		$queue_name = isset( $args[0] ) ? $args[0] : 'sync';
		$action = isset( $args[1] ) ? $args[1] : 'peek';

		// We map the queue name that way we can support more friendly queue names in the commands, but still use
		// the queue name that the code expects.
		$queue_name_map = $allowed_queues = array(
			'incremental' => 'sync',
			'full'        => 'full_sync',
		);
		$mapped_queue_name = isset( $queue_name_map[ $queue_name ] ) ? $queue_name_map[ $queue_name ] : $queue_name;

		switch( $action ) {
			case 'peek':
				require_once JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-queue.php';
				$queue = new Jetpack_Sync_Queue( $mapped_queue_name );
				$items = $queue->peek( 100 );

				if ( empty( $items ) ) {
					/* translators: %s is the name of the queue, either 'incremental' or 'full' */
					WP_CLI::log( sprintf( __( 'Nothing is in the queue: %s', 'jetpack' ), $queue_name  ) );
				} else {
					$collection = array();
					foreach ( $items as $item ) {
						$collection[] = array(
							'action'          => $item[0],
							'args'            => json_encode( $item[1] ),
							'current_user_id' => $item[2],
							'microtime'       => $item[3],
							'importing'       => (string) $item[4],
						);
					}
					WP_CLI\Utils\format_items(
						'table',
						$collection,
						array(
							'action',
							'args',
							'current_user_id',
							'microtime',
							'importing',
						)
					);
				}
				break;
		}
	}
}

/*
 * Standard "ask for permission to continue" function.
 * If action cancelled, ask if they need help.
 *
 * Written outside of the class so it's not listed as an executable command w/ 'wp jetpack'
 *
 * @param $flagged   bool   false = normal option | true = flagged by get_jetpack_options_for_reset()
 * @param $error_msg string (optional)
 */
function jetpack_cli_are_you_sure( $flagged = false, $error_msg = false ) {
	$cli = new Jetpack_CLI();

	// Default cancellation message
	if ( ! $error_msg ) {
		$error_msg =
			__( 'Action cancelled. Have a question?', 'jetpack' )
			. ' '
			. $cli->green_open
			. 'jetpack.com/support'
			.  $cli->color_close;
	}

	if ( ! $flagged ) {
		$prompt_message = __( 'Are you sure? This cannot be undone. Type "yes" to continue:', '"yes" is a command.  Do not translate that.', 'jetpack' );
	} else {
		/* translators: Don't translate the word yes here. */
		$prompt_message = __( 'Are you sure? Modifying this option may disrupt your Jetpack connection.  Type "yes" to continue.', 'jetpack' );
	}

	WP_CLI::line( $prompt_message );
	$handle = fopen( "php://stdin", "r" );
	$line = fgets( $handle );
	if ( 'yes' != trim( $line ) ){
		WP_CLI::error( $error_msg );
	}
}
