<?php

/**
 * Plugins that shouldn't be deactivated by the deactivate-user-plugins command.
 */
define( 'WPCOMSH_CLI_DONT_DEACTIVATE_PLUGINS', array(
	'akismet',
	'jetpack',
	// Avoid deactivating the file shim before the Atomic media backfill is complete
	'wpcom-file-shim',
) );

/**
 * eCommerce plan plugins that shouldn't be deactivated by deactivate-user-plugins
 * when the site has an eCommerce plan.
 */
define( 'WPCOMSH_CLI_ECOMMERCE_PLAN_PLUGINS', array(
	'storefront-powerpack',
	'woocommerce',
	'facebook-for-woocommerce',
	'mailchimp-for-woocommerce',
	'woocommerce-services',
	'woocommerce-product-addons',
	'taxjar-simplified-taxes-for-woocommerce',
) );

/**
 * The option where we keep a list of plugins deactivated via wp-cli.
 */
define( 'WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS', 'wpcomsh_deactivated_user_installed_plugins' );

/**
 * We keep a record of plugins deactivated via wp-cli so we can reactivate them later
 * with `wp wpcomsh reactivate-user-plugins`. This constant is the amount of time we'll
 * consider a deactivation valid for reactivation via `reactivate-user-plugins`.
 */
define( 'WPCOMSH_CLI_PLUGIN_REACTIVATION_MAX_AGE', 14 * DAY_IN_SECONDS );

define( 'WPCOMSH_CLI_DEACTIVATED_PLUGIN_RECORD_CLEANUP_JOB', 'wpcomsh_cli_cleanup_deactivated_user_plugin_record' );

/**
 * Ask the user to confirm a yes/no question.
 *
 * @param  string $question The yes/no question to ask the user.
 * @return boolean          Whether the user confirmed or not.
 */
function wpcomsh_cli_confirm( $question ) {
	fwrite( STDOUT, $question . ' [Y/n] ' );
	$answer = strtolower( trim( fgets( STDIN ) ) );
	return 'y' === $answer || ! $answer;
}

/**
 * Get the names of plugins with the specified status.
 * 
 * @param string $status The plugin status to match
 * 
 * @return string[]|false An array of plugin names. `false` if there is an error
 */
function wpcomsh_cli_get_plugins_with_status( $status ) {
	$list_result = WP_CLI::runcommand( "--skip-plugins --skip-themes plugin list --format=json --status=$status", array(
		'launch' => false,
		'return' => 'all',
		'exit_error' => false,
	) );
	if ( 0 !== $list_result->return_code ) {
		return false;
	}

	$decoded_result = json_decode( $list_result->stdout );
	if ( NULL === $decoded_result ) {
		return false;
	}
	if ( ! is_array( $decoded_result ) ) {
		return false;
	}

	return array_map(
		function( $plugin ) { return $plugin->name; },
		$decoded_result
	);
}

/**
 * Save the latest record of deactivated plugins.
 */
function wpcomsh_cli_save_deactivated_plugins_record( $deactivated_plugins ) {
	if ( empty( $deactivated_plugins ) ) {
		delete_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS );
		return;
	}

	$updated = update_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS, $deactivated_plugins, false /* don't autoload */ );
	if (
		false === $updated &&
		// Make sure the update didn't fail because the option is already set to the desired value.
		get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS ) !== $deactivated_plugins
	) {
		WP_CLI::warning( 'Failed to update deactivated plugins list.' );
	}
}

/**
 * Removes expired deactivations from the deactivation record.
 */
function wpcomsh_cli_remove_expired_from_deactivation_record() {
	$deactivated_plugins = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS, array() );
	$deactivated_plugins_to_remember = array();
	$current_time = time();

	foreach ( $deactivated_plugins as $plugin_name => $timestamp ) {
		if ( ( $current_time - $timestamp ) < WPCOMSH_CLI_PLUGIN_REACTIVATION_MAX_AGE ) {
			$deactivated_plugins_to_remember[ $plugin_name ] = $timestamp;
		}
	}
	
	wpcomsh_cli_save_deactivated_plugins_record( $deactivated_plugins_to_remember );
}

/**
 * Keeps a single event scheduled to clean up the deactivated user plugin record.
 * 
 * @return boolean Whether the scheduling update succeeded.
 */
function wpcomsh_cli_reschedule_deactivated_list_cleanup() {
	static $rescheduled_cleanup = false;

	// Avoid unnecessarily rescheduling multiple times within the same CLI command.
	if ( ! $rescheduled_cleanup ) {
		if (
			false !== wp_next_scheduled( WPCOMSH_CLI_DEACTIVATED_PLUGIN_RECORD_CLEANUP_JOB ) &&
			false === wp_unschedule_hook( WPCOMSH_CLI_DEACTIVATED_PLUGIN_RECORD_CLEANUP_JOB )
		) {
			// Avoid scheduling cleanup if we cannot unschedule existing cleanup
			// because scheduled jobs could accumulate
			return false;
		}

		if ( false === get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS ) ) {
			// No need to clean up a nonexistent option
			return true;
		}

		$rescheduled_cleanup = wp_schedule_single_event(
			// Pad scheduled time to give everything time to expire
			time() + WPCOMSH_CLI_PLUGIN_REACTIVATION_MAX_AGE + 15 * MINUTE_IN_SECONDS,
			WPCOMSH_CLI_DEACTIVATED_PLUGIN_RECORD_CLEANUP_JOB
		);
	}

	return $rescheduled_cleanup;
}

/**
 * Action hook for updating the deactivated plugin record when a plugin is deactivated.
 * 
 * This allows us to maintain the deactivated plugin record in response to both
 * the `wp plugin deactivate` and `wp wpcomsh deactivate-user-plugins` commands.
 * 
 * @param string $file Plugin file
 */
function wpcomsh_cli_remember_plugin_deactivation( $file ) {
	$deactivated_plugins = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS );
	$plugin_name = WP_CLI\Utils\get_plugin_name( $file );
	$deactivated_plugins[ $plugin_name ] = time();
	wpcomsh_cli_save_deactivated_plugins_record( $deactivated_plugins );
	wpcomsh_cli_reschedule_deactivated_list_cleanup();
}

/**
 * Action hook for pruning the deactivated plugin record when a plugin is activated.
 * 
 * This allows us to neatly maintain the deactivated plugin record in response to both
 * the `wp plugin activate` and `wp wpcomsh reactivate-user-plugins` commands.
 * 
 * @param string $file Plugin file
 */
function wpcomsh_cli_forget_plugin_deactivation( $file ) {
	$deactivated_plugins = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS );
	$plugin_name = WP_CLI\Utils\get_plugin_name( $file );
	unset( $deactivated_plugins[ $plugin_name ] );
	wpcomsh_cli_save_deactivated_plugins_record( $deactivated_plugins );
}

if ( class_exists( 'WP_CLI_Command' ) ) {
	/**
	 * Wordpress.com Site Helper (= Atomic) specific CLI commands
	 */
	class WPCOMSH_CLI_Commands extends WP_CLI_Command {
		/**
		 * Bulk deactivate user installed plugins
		 *
		 * Deactivate all user installed plugins except for important ones for Atomic.
		 *
		 * ## OPTIONS
		 *
		 * [--interactive]
		 * : Ask for each active plugin whether to deactivate
		 *
		 * @subcommand deactivate-user-plugins
		 */
		function deactivate_user_installed_plugins( $args, $assoc_args = array() ) {
			$active_plugins = wpcomsh_cli_get_plugins_with_status( 'active' );
			if ( false === $active_plugins ) {
				WP_CLI::log( 'Failed to list active plugins.' );
			}

			$plugins_to_skip = WPCOMSH_CLI_DONT_DEACTIVATE_PLUGINS;
			if ( Atomic_Plan_Manager::current_plan_slug() === Atomic_Plan_Manager::ECOMMERCE_PLAN_SLUG ) {
				// This site is on an e-commerce plan, so we don't want to deactivate the e-commerce plugins.
				$plugins_to_skip = array_unique( array_merge( $plugins_to_skip, WPCOMSH_CLI_ECOMMERCE_PLAN_PLUGINS ) );
			}

			foreach( array_intersect( $active_plugins, $plugins_to_skip ) as $skipped ) {
				WP_CLI::log( WP_CLI::colorize( "  %b- skipping '$skipped'%n" ) );
			}

			$plugins_to_deactivate = array_diff( $active_plugins, $plugins_to_skip );
			if ( empty( $plugins_to_deactivate ) ) {
				WP_CLI::warning( 'No active user-installed plugins found.' );
				return;
			}

			$interactive = WP_CLI\Utils\get_flag_value( $assoc_args, 'interactive', false );
			$green_check_mark = WP_CLI::colorize( "%G\xE2\x9C\x94%n" );
			$red_x = WP_CLI::colorize( "%Rx%n" );
			foreach ( $plugins_to_deactivate as $plugin ) {
				$deactivate = true;
				if ( $interactive ) {
					$deactivate = wpcomsh_cli_confirm( 'Deactivate plugin "' . $plugin . '"?' );
				}

				if ( $deactivate ) {
					// Deactivate and print success/failure
					$result = WP_CLI::runcommand( "--skip-plugins --skip-themes plugin deactivate $plugin", array(
						'launch' => false,
						'return' => 'all',
						'exit_error' => false,
					) );
					if ( 0 === $result->return_code ) {
						WP_CLI::log( "  $green_check_mark deactivated '$plugin'" );
					} else {
						WP_CLI::log( "  $red_x failed to deactivate '$plugin'" );
						if ( ! empty( $result->stderr ) ) {
							WP_CLI::log( $result->stderr );
						}
					}
				}
			}
		}

		/**
		 * Bulk re-activate user installed plugins
		 *
		 * If previously user installed plugins had been deactivated, this re-activates these plugins.
		 *
		 * ## OPTIONS
		 *
		 * [--interactive]
		 * : Ask for each previously deactivated plugin whether to activate
		 *
		 * @subcommand reactivate-user-plugins
		 */
		function reactivate_user_installed_plugins( $args, $assoc_args = array() ) {
			// Clean up before getting the deactivation list so there are only current entries
			wpcomsh_cli_remove_expired_from_deactivation_record();
			
			$inactive_plugins = wpcomsh_cli_get_plugins_with_status( 'inactive' );
			if ( false === $inactive_plugins ) {
				WP_CLI::error( 'Failed to list inactive plugins for reactivation.' );
				return;
			}

			$deactivation_records = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS );
			if ( false === $deactivation_records ) {
				WP_CLI::warning( "Can't find any previously deactivated plugins to activate." );
				return;
			}

			// TODO: Should we reactivate these in the reverse order that they were deactivated?
			// Only try to reactivate plugins that exist and are inactive
			$plugins_to_reactivate = array_keys( $deactivation_records );
			$plugins_to_reactivate = array_intersect( $plugins_to_reactivate, $inactive_plugins );

			if ( empty( $plugins_to_reactivate ) ) {
				WP_CLI::warning( "Can't find any previously deactivated plugins to activate." );
				return;
			}

			$interactive = WP_CLI\Utils\get_flag_value( $assoc_args, 'interactive', false );
			if ( ! $interactive ) {
				// Since we're not confirming one-by-one, we'll confirm once for all.
				WP_CLI::log( "The following will be reactivated:" );
				WP_CLI::log( "  - " . implode( "\n  - ", $plugins_to_reactivate ) );
				if ( ! wpcomsh_cli_confirm( 'Do you wish to proceed?' ) ) {
					return;
				}
			}

			$green_check_mark = WP_CLI::colorize( "%G\xE2\x9C\x94%n" );
			$red_x = WP_CLI::colorize( "%Rx%n" );
			foreach ( $plugins_to_reactivate as $plugin ) {
				$reactivate = true;
				if ( $interactive ) {
					$reactivate = wpcomsh_cli_confirm( 'Reactivate plugin "' . $plugin . '"?' );
				}

				if ( $reactivate ) {
					$result = WP_CLI::runcommand( "--skip-plugins --skip-themes plugin activate $plugin", array(
						'launch' => false,
						'return' => 'all',
						'exit_error' => false,
					) );
					if ( 0 === $result->return_code ) {
						WP_CLI::log( "  $green_check_mark activated '$plugin'" );
					} else {
						WP_CLI::log( "  $red_x failed to activate '$plugin'" );
						if ( ! empty( $result->stderr ) ) {
							WP_CLI::log( $result->stderr );
						}
					}
				}
			}
		}

		/**
		 * Fire the update_option_home action for domain change.
		 *
		 * This is necessary for some plugins such as Yoast that looks for this action when a domain is updated,
		 * and since the Atomic platform uses direct SQL queries to update the URL when it's changed in wpcom,
		 * this action never fires.
		 *
		 * ## OPTIONS
		 *
		 * [--old_url=<old_url>]
		 * : The URL that the domain was changed from
		 *
		 * [--new_url=<new_url>]
		 * : The URL that the domain was changed to
		 *
		 * @subcommand domain-name-changed
		 */
		function domain_name_changed( $args, $assoc_args = array() ) {
			$old_domain = WP_CLI\Utils\get_flag_value( $assoc_args, 'old_url', false );
			if ( false === $old_domain ) {
				WP_CLI::error( 'Missing required --old_url=url value.' );
			}

			$new_domain = WP_CLI\Utils\get_flag_value( $assoc_args, 'new_url', false );
			if ( false === $new_domain ) {
				WP_CLI::error( 'Missing required --new_url=url value.' );
			}

			// Bail if we're getting a value that does not match reality of what's current.
			if ( get_home_url() !== $new_domain ) {
				WP_CLI::warning( 'Did not send action. New domain does not match current get_home_url value.' );
				return;
			}

			if ( ! defined( 'WP_HOME' ) || WP_HOME !== $new_domain  ) {
				WP_CLI::warning( 'Did not send action. New domain does not match current WP_HOME value.' );
				return;
			}

			do_action( 'update_option_home', $old_domain, $new_domain );
			WP_CLI::success( "Sent the update_option_home action successfully." );
		}
	}
}

if ( class_exists( 'Checksum_Plugin_Command' ) ) {
	/*
	* This works just like plugin verify-checksums except it filters language translation files.
	* Language files are not part of WordPress.org's checksums so they are listed as added and
	* they obfuscate the output. This makes it hard to spot actual checksum verification errors.
	*/
	class Checksum_Plugin_Command_WPCOMSH extends Checksum_Plugin_Command {
		protected function filter_file( $filepath ) {
			return ! preg_match( '#^(languages/)?[a-z0-9-]+-[a-z]{2}_[A-Z]{2}(_[a-z]+)?([.](mo|po)|-[a-f0-9]{32}[.]json)$#', $filepath );
		}
	}
}

/**
 * Symlinks a managed plugin into the site's plugins directory.
 *
 * ## OPTIONS
 *
 * <plugin>
 * : The managed plugin to symlink.
 */
function wpcomsh_cli_plugin_symlink( $args, $assoc_args = array() ) {
	$plugin_to_symlink = $args[0];

	if ( 'wpcomsh' === $plugin_to_symlink ) {
		// wpcomsh is in the managed plugins directory,
		// but it should not be symlinked into the plugins directory
		WP_CLI::error( 'Cannot symlink wpcomsh' );
	}

	if ( false === chdir( WP_PLUGIN_DIR ) ) {
		WP_CLI::error( "Cannot switch to plugins directory '" . WP_PLUGIN_DIR . "'" );
	}

	$managed_plugin_relative_path = "../../../../wordpress/plugins/$plugin_to_symlink/latest";
	if ( false === realpath( $managed_plugin_relative_path ) ) {
		WP_CLI::error( "'$plugin_to_symlink' is not a managed plugin" );
	}

	if ( realpath( $plugin_to_symlink ) === realpath( $managed_plugin_relative_path ) ) {
		WP_CLI::success( "Plugin '$plugin_to_symlink' is already symlinked" );
		exit( -1 );
	}

	if ( is_dir( $plugin_to_symlink ) ) {
		$answer = wpcomsh_cli_confirm( "Plugin '$plugin_to_symlink' exists. Delete it and replace with symlink?" );
		if ( false === $answer ) {
			exit( -1 );
		}

		WP_CLI::runcommand(
			"--skip-plugins --skip-themes plugin delete '$plugin_to_symlink'",
			array(
				'launch' => false,
				'exit_error' => true,
			)
		);
	}

	if ( symlink( $managed_plugin_relative_path, $plugin_to_symlink ) ) {
		WP_CLI::success( "Symlinked '$plugin_to_symlink' plugin" );
		exit( 0 );
	} else {
		WP_CLI::error( "Failed to symlink '$plugin_to_symlink' plugin" );
		exit( -1 );
	}
}

// Cleanup via WP-Cron event
add_action( WPCOMSH_CLI_DEACTIVATED_PLUGIN_RECORD_CLEANUP_JOB, 'wpcomsh_cli_remove_expired_from_deactivation_record' );

if ( ! defined( 'WP_CLI' ) || true !== WP_CLI ) {
	// We aren't running in a WP-CLI context, so there is nothing more to do.
	return;
}

// Force WordPress to always output English at the command line.
WP_CLI::add_wp_hook( 'pre_option_WPLANG', function() {
	return 'en_US';
});

// Maintain a record of deactivated plugins so that they can be reactivated
// by the reactivate-user-plugins command
add_action( 'deactivated_plugin', 'wpcomsh_cli_remember_plugin_deactivation' );
add_action( 'activated_plugin', 'wpcomsh_cli_forget_plugin_deactivation' );

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
WP_CLI::add_command( 'wpcomsh plugin verify-checksums', 'Checksum_Plugin_Command_WPCOMSH' );
WP_CLI::add_command( 'plugin symlink', 'wpcomsh_cli_plugin_symlink' );
