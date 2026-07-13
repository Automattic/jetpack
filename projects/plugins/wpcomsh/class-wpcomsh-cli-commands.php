<?php
/**
 * CLI commands for wpcomsh.
 *
 * @package wpcomsh
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed

/**
 * Plugins that shouldn't be deactivated by the deactivate-user-plugins command.
 */
define(
	'WPCOMSH_CLI_DONT_DEACTIVATE_PLUGINS',
	array(
		'akismet',
		'classic-editor',
		'full-site-editing',
		'gutenberg',
		'jetpack',
		'layout-grid',
		'page-optimize',
		// Avoid deactivating the file shim before the Atomic media backfill is complete
		'wpcom-file-shim',
	)
);

/**
 * ECommerce plan plugins that shouldn't be deactivated by deactivate-user-plugins
 * when the site has an eCommerce plan.
 */
define(
	'WPCOMSH_CLI_ECOMMERCE_PLAN_PLUGINS',
	array(
		'storefront-powerpack',
		'woocommerce',
		'facebook-for-woocommerce',
		'mailchimp-for-woocommerce',
		'woocommerce-services',
		'woocommerce-product-addons',
		'taxjar-simplified-taxes-for-woocommerce',
	)
);

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
 * Don't allow `wp core multisite-install` or `wp core multisite-convert` to be run.
 */
WP_CLI::add_hook(
	'before_run_command',
	function () {
		$runner            = WP_CLI::get_runner();
		$disabled_commands = array(
			array( 'core', 'multisite-install' ),
			array( 'core', 'multisite-convert' ),
		);
		foreach ( $disabled_commands as $disabled_command ) {
			if ( array_slice( $runner->arguments, 0, count( $disabled_command ) ) === $disabled_command ) {
				WP_CLI::error(
					sprintf(
						'The \'%s\' command is disabled on this platform.',
						implode( ' ', $disabled_command )
					)
				);
			}
		}
	}
);

/**
 * Ask the user to confirm a yes/no question.
 *
 * @param  string $question The yes/no question to ask the user.
 * @return boolean Whether the user confirmed or not.
 */
function wpcomsh_cli_confirm( $question ) {
	fwrite( STDOUT, $question . ' [Y/n] ' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	$answer = strtolower( trim( fgets( STDIN ) ) );
	return 'y' === $answer || ! $answer;
}

/**
 * Get the names of plugins with the specified status.
 *
 * @param string $status The plugin status to match.
 *
 * @return string[]|false An array of plugin names. `false` if there is an error.
 */
function wpcomsh_cli_get_plugins_with_status( $status ) {
	$list_result = WP_CLI::runcommand(
		"--skip-plugins --skip-themes plugin list --format=json --status=$status",
		array(
			'launch'     => false,
			'return'     => 'all',
			'exit_error' => false,
		)
	);
	if ( 0 !== $list_result->return_code ) {
		return false;
	}

	$decoded_result = json_decode( $list_result->stdout );
	if ( null === $decoded_result ) {
		return false;
	}
	if ( ! is_array( $decoded_result ) ) {
		return false;
	}

	return array_map(
		function ( $plugin ) {
			return $plugin->name; },
		$decoded_result
	);
}

/**
 * Save the latest record of deactivated plugins.
 *
 * @param array $deactivated_plugins Plugins to deactivate.
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
	$deactivated_plugins             = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS, array() );
	$deactivated_plugins_to_remember = array();
	$current_time                    = time();

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
			// Avoid scheduling cleanup if we can't unschedule existing cleanup because scheduled jobs could accumulate.
			return false;
		}

		if ( false === get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS ) ) {
			// No need to clean up a nonexistent option.
			return true;
		}

		$rescheduled_cleanup = wp_schedule_single_event(
			// Pad scheduled time to give everything time to expire.
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
 * @param string $file Plugin file.
 */
function wpcomsh_cli_remember_plugin_deactivation( $file ) {
	$deactivated_plugins                 = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS );
	$plugin_name                         = WP_CLI\Utils\get_plugin_name( $file );
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
 * @param string $file Plugin file.
 */
function wpcomsh_cli_forget_plugin_deactivation( $file ) {
	$deactivated_plugins = get_option( WPCOMSH_CLI_OPTION_DEACTIVATED_USER_PLUGINS );
	$plugin_name         = WP_CLI\Utils\get_plugin_name( $file );
	unset( $deactivated_plugins[ $plugin_name ] );
	wpcomsh_cli_save_deactivated_plugins_record( $deactivated_plugins );
}

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag
if ( class_exists( 'WP_CLI_Command' ) ) {
	/**
	 * WPCOMSH-specific CLI commands
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
		public function deactivate_user_installed_plugins( $args, $assoc_args = array() ) {
			$active_plugins = wpcomsh_cli_get_plugins_with_status( 'active' );
			if ( false === $active_plugins ) {
				WP_CLI::log( 'Failed to list active plugins.' );
			}

			$plugins_to_skip = WPCOMSH_CLI_DONT_DEACTIVATE_PLUGINS;
			if ( wpcom_site_has_feature( WPCOM_Features::ECOMMERCE_MANAGED_PLUGINS ) ) {
				// This site has access to the e-commerce plugin bundle, so we don't want to deactivate them.
				$plugins_to_skip = array_unique( array_merge( $plugins_to_skip, WPCOMSH_CLI_ECOMMERCE_PLAN_PLUGINS ) );
			}

			foreach ( array_intersect( $active_plugins, $plugins_to_skip ) as $skipped ) {
				WP_CLI::log( WP_CLI::colorize( "  %b- skipping '$skipped'%n" ) );
			}

			$plugins_to_deactivate = array_diff( $active_plugins, $plugins_to_skip );
			if ( empty( $plugins_to_deactivate ) ) {
				WP_CLI::warning( 'No active user-installed plugins found.' );
				return;
			}

			$interactive      = WP_CLI\Utils\get_flag_value( $assoc_args, 'interactive', false );
			$green_check_mark = WP_CLI::colorize( "%G\xE2\x9C\x94%n" );
			$red_x            = WP_CLI::colorize( '%Rx%n' );
			foreach ( $plugins_to_deactivate as $plugin ) {
				$deactivate = true;
				if ( $interactive ) {
					$deactivate = wpcomsh_cli_confirm( 'Deactivate plugin "' . $plugin . '"?' );
				}

				if ( $deactivate ) {
					// Deactivate and print success/failure
					$result = WP_CLI::runcommand(
						"--skip-plugins --skip-themes plugin deactivate $plugin",
						array(
							'launch'     => false,
							'return'     => 'all',
							'exit_error' => false,
						)
					);
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
		 * Bulk re-activate user installed plugins.
		 *
		 * If previously user installed plugins had been deactivated, this re-activates these plugins.
		 *
		 * ## OPTIONS
		 *
		 * [--interactive]
		 * : Ask for each previously deactivated plugin whether to activate.
		 *
		 * @subcommand reactivate-user-plugins
		 */
		public function reactivate_user_installed_plugins( $args, $assoc_args = array() ) {
			// Clean up before getting the deactivation list so there are only current entries.
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
			// Only try to reactivate plugins that exist and are inactive.
			$plugins_to_reactivate = array_keys( $deactivation_records );
			$plugins_to_reactivate = array_intersect( $plugins_to_reactivate, $inactive_plugins );

			if ( empty( $plugins_to_reactivate ) ) {
				WP_CLI::warning( "Can't find any previously deactivated plugins to activate." );
				return;
			}

			$interactive = WP_CLI\Utils\get_flag_value( $assoc_args, 'interactive', false );
			if ( ! $interactive ) {
				// Since we're not confirming one-by-one, we'll confirm once for all.
				WP_CLI::log( 'The following will be reactivated:' );
				WP_CLI::log( '  - ' . implode( "\n  - ", $plugins_to_reactivate ) );
				if ( ! wpcomsh_cli_confirm( 'Do you wish to proceed?' ) ) {
					return;
				}
			}

			$green_check_mark = WP_CLI::colorize( "%G\xE2\x9C\x94%n" );
			$red_x            = WP_CLI::colorize( '%Rx%n' );
			foreach ( $plugins_to_reactivate as $plugin ) {
				$reactivate = true;
				if ( $interactive ) {
					$reactivate = wpcomsh_cli_confirm( 'Reactivate plugin "' . $plugin . '"?' );
				}

				if ( $reactivate ) {
					$result = WP_CLI::runcommand(
						"--skip-plugins --skip-themes plugin activate $plugin",
						array(
							'launch'     => false,
							'return'     => 'all',
							'exit_error' => false,
						)
					);
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
		public function domain_name_changed( $args, $assoc_args = array() ) {
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

			if ( ! defined( 'WP_HOME' ) || WP_HOME !== $new_domain ) {
				WP_CLI::warning( 'Did not send action. New domain does not match current WP_HOME value.' );
				return;
			}

			do_action( 'update_option_home', $old_domain, $new_domain );
			WP_CLI::success( 'Sent the update_option_home action successfully.' );
		}

		/**
		 * This is a post transfer command that is called after a site is transferred.
		 *
		 * This is necessary for some plugins that need to perform certain actions after
		 * a site is transferred, such as WooCommerce Payments that needs to clear its cache.
		 *
		 * Note: This command should only be executed from WPCOM as part of a transfer.
		 *
		 * @subcommand post-transfer
		 */
		public function post_transfer( $args, $assoc_args = array() ) {
			do_action( 'wpcomsh_woa_post_transfer', $args, $assoc_args );

			WP_CLI::success( 'Post transfer completed successfully.' );
		}

		/**
		 * This is a post reset command that is called after a site is reset.
		 *
		 * This is necessary for some plugins that need to perform certain actions after
		 * a site is reset, such as WooCommerce Payments that needs to clear its cache.
		 *
		 * Note: This command should only be executed from WPCOM as part of a transfer.
		 *
		 * @subcommand post-reset
		 */
		public function post_reset( $args, $assoc_args = array() ) {
			do_action( 'wpcomsh_woa_post_reset', $args, $assoc_args );

			WP_CLI::success( 'Post reset completed successfully.' );
		}

		/**
		 * This is a post clone command that is called after a site is cloned.
		 *
		 * This is necessary for some plugins that need to perform certain actions after
		 * a site is cloned, such as WooCommerce Payments that needs to clear its cache.
		 *
		 * Note: This command should only be executed from WPCOM as part of a transfer.
		 *
		 * @subcommand post-clone
		 */
		public function post_clone( $args, $assoc_args = array() ) {
			do_action( 'wpcomsh_woa_post_clone', $args, $assoc_args );

			WP_CLI::success( 'Post clone completed successfully.' );
		}

		/**
		 * Proxies wp language plugin install --all using the active site language.
		 *
		 * After switching the site language, language packs for plugins are not automatically downloaded and the user
		 * has to manually check for and install updates, this command installs language packs for all plugins,
		 * using the active site language.
		 *
		 * @subcommand install-plugin-language-packs
		 */
		public function install_plugin_language_packs() {
			/*
			 * Query the database directly as we previously hooked into pre_option_WPLANG to always return en_US,
			 * but now we need the actual site language to figure out what language packs to install.
			 */
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$lang = $wpdb->get_var( 'SELECT option_value FROM ' . $wpdb->options . " WHERE option_name = 'WPLANG'" );
			if ( empty( $lang ) ) {
				$lang = 'en_US';
			}

			$command = new Plugin_Language_Command();
			$command->install(
				array( $lang ),
				array(
					'all' => true,
				)
			);
		}

		/**
		 * Retrieves an Atomic persistent data field.
		 *
		 * ## OPTIONS
		 *
		 * <name>
		 * : The name of the data field to retrieve
		 *
		 * [--format=<format>]
		 * : Render output in a particular format.
		 * ---
		 * default: list
		 * options:
		 *   - list
		 *   - json
		 * ---
		 *
		 * @subcommand persistent-data
		 */
		public function persistent_data( $args, $assoc_args ) {
			if ( empty( $args[0] ) ) {
				WP_CLI::error( 'Missing required field name.' );
			}

			$name            = $args[0];
			$persistent_data = new Atomic_Persistent_Data();

			$output = json_decode( $persistent_data->{ $name } );
			if ( null === $output ) {
				$output = $persistent_data->{ $name };
			}

			if ( 'json' === $assoc_args['format'] ) {
				$output = wp_json_encode( $output, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
			}

			WP_CLI::log( print_r( $output, true ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
		}

		/**
		 * Retrieves the WPCOM_PURCHASES field from Atomic Persistent Data.
		 *
		 * ## OPTIONS
		 *
		 * [--format=<format>]
		 * : Render output in a particular format.
		 * ---
		 * default: list
		 * options:
		 *   - list
		 *   - json
		 * ---
		 *
		 * @subcommand purchases
		 */
		public function purchases( $args, $assoc_args ) {
			WP_CLI::runcommand( 'wpcomsh persistent-data WPCOM_PURCHASES --format=' . $assoc_args['format'], array( 'launch' => false ) );
		}

		/**
		 * Apply terms and taxonomies from the current theme's annotation file.
		 *
		 * In the case of WooCommerce specific terms, they can only be applied
		 * after WooCommerce is installed, which might happen after a site's theme switch.
		 * So this is provided as a separate command which can be ran in a post-install job.
		 *
		 * @subcommand headstart-terms
		 */
		public function headstart_terms( $args, $assoc_args ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis
			$results            = wpcomsh_apply_headstart_terms();
			$missing_taxonomies = $results['missing_taxonomies'];
			$output             = wp_json_encode( array( 'missing_taxonomies' => $missing_taxonomies ), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT );
			WP_CLI::log( $output );
		}

		/**
		 * Import a backup .zip file.
		 *
		 * ## OPTIONS
		 *
		 * [--source]
		 * : Source zip file path.
		 *
		 * [--dest]
		 * : destination file path to extract to. (required)
		 *
		 * [--skip-clean-up]
		 * : Skip cleaning up the temprary files. Defaults to false.
		 *
		 * [--skip-unpack]
		 * : Skip unpacking the zip file. Defaults to false.
		 *
		 * [--actions]
		 * : A comma-separated list of actions to perform. Defaults to all actions.
		 *
		 * [--dry-run]
		 * : Run the importer in dry run mode. Defaults to true.
		 *
		 * @subcommand backup-import
		 */
		public function backup_import( $args, $assoc_args ) {
			$source        = WP_CLI\Utils\get_flag_value( $assoc_args, 'source', '' );
			$dest          = WP_CLI\Utils\get_flag_value( $assoc_args, 'dest' );
			$skip_clean_up = WP_CLI\Utils\get_flag_value( $assoc_args, 'skip-clean-up', false );
			$skip_unpack   = WP_CLI\Utils\get_flag_value( $assoc_args, 'skip-unpack', false );
			$actions       = WP_CLI\Utils\get_flag_value( $assoc_args, 'actions', '' );
			$dry_run       = WP_CLI\Utils\get_flag_value( $assoc_args, 'dry-run', true );

			$skip_unpack = filter_var( $skip_unpack, FILTER_VALIDATE_BOOLEAN );

			if ( ! $skip_unpack && empty( $source ) ) {
				WP_CLI::error( 'Missing file path passed to --source' );
			}

			if ( empty( $dest ) ) {
				WP_CLI::error( 'Missing file path passed to --dest' );
			}

			$options = array(
				'skip_clean_up' => filter_var( $skip_clean_up, FILTER_VALIDATE_BOOLEAN ),
				'skip_unpack'   => $skip_unpack,
				'actions'       => $actions ? explode( ',', $actions ) : array(),
				'dry_run'       => filter_var( $dry_run, FILTER_VALIDATE_BOOLEAN ),
			);

			$import_manager = new Imports\Backup_Import_Manager( $source, $dest, $options );
			$ret            = $import_manager->import();

			if ( is_wp_error( $ret ) ) {
				WP_CLI::error( $ret->get_error_message() );
			}

			WP_CLI::success( 'Import completed successfully.' );
		}

		/**
		 * Manage user's global styles.
		 *
		 * ## OPTIONS
		 *
		 * <action>
		 * : The action you want to run, e.g.: list, update, remove.
		 *
		 * [--field=<field>]
		 * : The path of the data field to retrieve or remove.
		 *
		 * [--value=<value>]
		 * : The value of the data field you want to set.
		 *
		 * [--dry-run]
		 * : Enable dry run mode
		 *
		 * @subcommand global-styles
		 */
		public function global_styles( $args, $assoc_args ) {
			if ( empty( $args[0] ) ) {
				WP_CLI::error( 'Missing the action.' );
			}

			$available_actions = array( 'list', 'update', 'remove' );
			$action            = $args[0];
			if ( ! in_array( $action, $available_actions, true ) ) {
				WP_CLI::error( 'The action is not supported yet' );
			}

			/**
			 * Get the global styles
			 */
			$active_global_styles_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
			$request                 = new \WP_REST_Request( 'GET', "/wp/v2/global-styles/$active_global_styles_id" );
			$request->set_query_params(
				array(
					'context' => 'edit',
					'id'      => $active_global_styles_id,
				)
			);

			$global_styles_controller = new WP_REST_Global_Styles_Controller();
			$response                 = $global_styles_controller->get_item( $request );
			if ( $response->is_error() ) {
				WP_CLI::error( $response->as_error() );
			}

			$global_styles = $response->get_data();
			$field         = $assoc_args['field'] ?? '';
			$field_path    = ! empty( $field ) ? explode( '.', $field ) : array();
			if ( $action === 'list' ) {
				$global_styles = $response->get_data();
				$global_styles = ! empty( $field_path ) ? _wp_array_get( $global_styles, $field_path ) : $global_styles;
				WP_CLI::log( wp_json_encode( $global_styles, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ) );
				return;
			}

			$dry_run = isset( $assoc_args['dry-run'] ) ? filter_var( $assoc_args['dry-run'], FILTER_VALIDATE_BOOLEAN ) : false;
			if ( $action === 'update' ) {
				if ( empty( $field_path ) ) {
					WP_CLI::error( 'Missing the data field you want to remove, e.g.: settings.typography.fontFamilies.theme' );
				}

				if ( ! isset( $assoc_args['value'] ) ) {
					WP_CLI::error( 'Missing the value you want to set.' );
				}

				$value               = json_decode( $assoc_args['value'], true );
				$json_decoding_error = json_last_error();
				if ( JSON_ERROR_NONE !== $json_decoding_error ) {
					WP_CLI::error( 'The provided value is invalid.' );
				}

				_wp_array_set( $global_styles, $field_path, $value );

				if ( $dry_run ) {
					WP_CLI::log( wp_json_encode( $global_styles, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ) );
				} else {
					$request = new \WP_REST_Request( 'POST', "/wp/v2/global-styles/$active_global_styles_id" );
					$request->set_query_params( $global_styles );
					$response = $global_styles_controller->update_item( $request );
					if ( $response->is_error() ) {
						WP_CLI::error( $response->as_error() );
					}

					WP_CLI::log( wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ) );
				}

				WP_CLI::success( "Update the data field `$field` successfully" );
			}

			if ( $action === 'remove' ) {
				if ( empty( $field_path ) ) {
					WP_CLI::error( 'Missing the data field you want to remove, e.g.: settings.typography.fontFamilies.theme' );
				}

				$length  = count( $field_path );
				$current = &$global_styles;
				for ( $i = 0; $i < $length - 1; ++$i ) {
					$path = $field_path[ $i ];
					if ( ! array_key_exists( $path, $current ) || ! is_array( $current[ $path ] ) ) {
						WP_CLI::error( "The data field `$field` doesn't exist" );
					}

					$current = &$current[ $path ];
				}

				unset( $current[ $field_path[ $i ] ] );

				if ( $dry_run ) {
					WP_CLI::log( wp_json_encode( $global_styles, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ) );
				} else {
					$request = new \WP_REST_Request( 'POST', "/wp/v2/global-styles/$active_global_styles_id" );
					$request->set_query_params( $global_styles );
					$response = $global_styles_controller->update_item( $request );
					if ( $response->is_error() ) {
						WP_CLI::error( $response->as_error() );
					}

					WP_CLI::log( wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ) );
				}

				WP_CLI::success( "Removing the data field `$field` successfully" );
			}
		}

		/**
		 * List incompatible plugins on the site.
		 *
		 * ## OPTIONS
		 *
		 * <action>
		 * : The action you want to run. Only `list` supported at present.
		 * ---
		 * options:
		 *  - list
		 * ---
		 *
		 * [--field=<field>]
		 * : Prints the value of a single field for each incompatible plugin.
		 *
		 * [--fields=<fields>]
		 * : The fields to include in the output.
		 *
		 * [--format=<format>]
		 * : The output format to use.
		 * ---
		 * default: table
		 * options:
		 *  - table
		 *  - csv
		 *  - json
		 * ---
		 *
		 * [--status=<status>]
		 * : Only return incompatible plugins with a specific status.
		 * ---
		 * options:
		 *  - active
		 *  - inactive
		 *  - active-network
		 *  - must-use
		 *
		 * ## AVAILABLE FIELDS
		 *
		 * These fields will be displayed by default for each plugin:
		 *
		 * * name
		 * * status
		 * * version
		 *
		 * These fields are optionally available:
		 *
		 * * message
		 * * title
		 * * description
		 * * file
		 * * author
		 *
		 * @subcommand incompatible-plugins
		 */
		public function incompatible_plugins( $args, $assoc_args ) {
			if ( empty( $args[0] ) ) {
				WP_CLI::error( 'No action specified.' );
			}

			$action = $args[0];

			$supported_actions = array( 'list' );

			if ( ! in_array( $action, $supported_actions, true ) ) {
				WP_CLI::error( "Unsupported action: '{$action}'. Must be one of: " . implode( '|', $supported_actions ) );
			}

			$jetpack_plugin_compatibility = Jetpack_Plugin_Compatibility::get_instance();

			$incompatible_plugins = $jetpack_plugin_compatibility->find_incompatible_plugins();

			$status_to_filter = \WP_CLI\Utils\get_flag_value( $assoc_args, 'status' );
			if ( ! empty( $status_to_filter ) ) {
				$incompatible_plugins = array_filter(
					$incompatible_plugins,
					function ( $incompatible_plugin_details ) use ( $status_to_filter ) {
						return $status_to_filter === ( $incompatible_plugin_details['status'] ?? null );
					}
				);
			}

			if ( empty( $incompatible_plugins ) ) {
				WP_CLI::success( 'No incompatible plugins found.' );
				return;
			}

			$refined_plugin_list = array();

			foreach ( $incompatible_plugins as $plugin_filename => $plugin_details ) {
				$refined_plugin_list[] = array(
					'name'        => \WP_CLI\Utils\get_plugin_name( $plugin_filename ),
					'status'      => $plugin_details['status'],
					'version'     => $plugin_details['details']['Version'] ?? '',
					'message'     => $plugin_details['message'],
					'title'       => $plugin_details['details']['Name'] ?? '',
					'description' => $plugin_details['details']['Description'] ?? '',
					'file'        => $plugin_filename,
					'author'      => $plugin_details['details']['Author'] ?? '',
				);
			}

			$formatter = new \WP_CLI\Formatter( $assoc_args, array( 'name', 'status', 'version' ), 'plugin' );

			$formatter->display_items( $refined_plugin_list );
		}

		/**
		 * Patch js_composer plugin to work with PHP 8.1.
		 *
		 * ## OPTIONS
		 *
		 * <plugin>
		 * : The plugin to patch.
		 *
		 * @subcommand php81-plugin-patch
		 */
		public function php_81_plugin_patch( $args, $assoc_args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			if ( 'js_composer' !== $args[0] ) {
				WP_CLI::error( 'Wrong plugin to patch.' );
			}

			$plugins = get_plugins();
			$folder  = 'js_composer/js_composer.php';

			if ( ! isset( $plugins[ $folder ] ) ) {
				WP_CLI::error( 'js_composer plugin is not installed.' );
			}

			$file = WP_PLUGIN_DIR . '/js_composer/include/classes/editors/class-vc-frontend-editor.php';

			if ( ! file_exists( $file ) ) {
				WP_CLI::error( 'File not found: ' . $file );
			}

			$search        = '$host = isset( $s[\'HTTP_X_FORWARDED_HOST\'] ) ? $s[\'HTTP_X_FORWARDED_HOST\'] : isset( $s[\'HTTP_HOST\'] ) ? $s[\'HTTP_HOST\'] : $s[\'SERVER_NAME\'];';
			$substitution  = "// The following line has been patched by wpcomsh to let this plugin work with PHP 8.1.\n";
			$substitution .= '		$host = isset( $s[\'HTTP_X_FORWARDED_HOST\'] ) ? $s[\'HTTP_X_FORWARDED_HOST\'] : ( isset($s[\'HTTP_HOST\'] ) ? $s[\'HTTP_HOST\'] : $s[\'SERVER_NAME\'] );';

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$file_content = file_get_contents( $file );

			if ( false === $file_content ) {
				WP_CLI::error( 'File not found: ' . $file );
			}

			$count        = 0;
			$file_content = str_replace( $search, $substitution, $file_content, $count );

			if ( ! $count ) {
				WP_CLI::error( 'String not found on ' . $file );
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			if ( ! file_put_contents( $file, $file_content ) ) {
				WP_CLI::error( 'Failed to write to ' . $file );
			}

			WP_CLI::success( 'Success' );
		}

		/**
		 * Patch definitions for the php83-plugin-patch subcommand.
		 *
		 * PHP 8.3 turned a repeated `static` declaration of the same variable in one
		 * function scope into a "Duplicate declaration of static variable" fatal
		 * error, which old plugin versions trip over. Each entry describes a minimal,
		 * behavior-preserving rename of the duplicate declaration (DOTCOM-17392).
		 *
		 * Shared keys:
		 * - folders:        plugin directory names to look for (vendors ship the same
		 *                   product under different folder slugs).
		 * - file:           the file to patch, relative to the plugin directory.
		 * - patched_marker: string that only exists after patching; makes re-runs a
		 *                   safe no-op.
		 * - strategy:       'split_rename' renames every occurrence of `search` after
		 *                   `split_marker`; 'replace_once' applies exact search/replace
		 *                   pairs that must each match exactly once.
		 *
		 * @return array<string,array> Patch definitions keyed by plugin slug.
		 */
		private static function php83_plugin_patches() {
			return array(

				/*
				 * The `mm_options_generator()` function declares `static $theme_option_file`
				 * in both the `file` and `background_image` cases of the same switch. This
				 * renames the copy in the `background_image` case so only a single
				 * declaration of `$theme_option_file` remains. Both cases merely enqueue
				 * the media uploader scripts, and `wp_enqueue_*` is idempotent, so behavior
				 * is unchanged. The same product ships as both `mega_main_menu` and
				 * `mega-main-menu`.
				 */
				'mega_main_menu'          => array(
					'folders'        => array( 'mega_main_menu', 'mega-main-menu' ),
					'file'           => 'framework/options_generator.php',
					'patched_marker' => '$theme_option_file_background',
					'strategy'       => 'split_rename',
					'split_marker'   => "case 'background_image':",
					'search'         => '$theme_option_file',
					'replace'        => '$theme_option_file_background',
				),

				/*
				 * `custom_columns()` in includes/Admin/CPT/Submission.php declares
				 * `static $fields` in both the fieldset-repeater branch and the
				 * numeric-column branch of the same function (unchanged 3.6.14–3.6.28).
				 * Both are per-column memo caches keyed by `$column`; renaming the
				 * numeric-branch copy just splits the cache in two, so behavior is
				 * unchanged.
				 */
				'ninja-forms'             => array(
					'folders'        => array( 'ninja-forms' ),
					'file'           => 'includes/Admin/CPT/Submission.php',
					'patched_marker' => '$fields_by_column',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"            static \$fields;\n"
							. "            if( ! isset( \$fields[ \$column ] ) ) {\n"
							. "                \$fields[\$column] = Ninja_Forms()->form( \$form_id )->get_field( \$column );\n"
							. "            }\n"
							. '            $field = $fields[$column];',
							"            // Renamed by wpcomsh to avoid a PHP 8.3+ \"Duplicate declaration of\n"
							. "            // static variable\" fatal: the repeater branch above also declares\n"
							. "            // `static \$fields`.\n"
							. "            static \$fields_by_column;\n"
							. "            if( ! isset( \$fields_by_column[ \$column ] ) ) {\n"
							. "                \$fields_by_column[\$column] = Ninja_Forms()->form( \$form_id )->get_field( \$column );\n"
							. "            }\n"
							. '            $field = $fields_by_column[$column];',
						),
					),
				),

				/*
				 * `theme_list()` in modules/theme_purchase.php declares
				 * `static $header_tags` twice — two identical, constant `wp_kses()`
				 * allowlists in different loops of the same function (unchanged
				 * 4.2.7–4.3.5). The second declaration is nested one level deeper, so
				 * its 5-tab indentation uniquely identifies it. Renaming a constant
				 * allowlist is behavior-neutral.
				 */
				'wiziapp-create-your-own-native-iphone-app' => array(
					'folders'        => array( 'wiziapp-create-your-own-native-iphone-app' ),
					'file'           => 'modules/theme_purchase.php',
					'patched_marker' => '$header_tags_title',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"\t\t\t\t\tstatic \$header_tags = array(",
							"\t\t\t\t\t// Renamed by wpcomsh to avoid a PHP 8.3+ \"Duplicate declaration\n"
							. "\t\t\t\t\t// of static variable\" fatal: theme_list() declares this allowlist twice.\n"
							. "\t\t\t\t\tstatic \$header_tags_title = array(",
						),
						array(
							"\t\t\t\t\t\$theme['title'] = wp_kses(\$theme['title'], \$header_tags);",
							"\t\t\t\t\t\$theme['title'] = wp_kses(\$theme['title'], \$header_tags_title);",
						),
					),
				),

				/*
				 * `initData()` in inc/classes/thegem-blocks.php declares
				 * `static $globalColors;` twice in the same declaration list, two lines
				 * apart — a plain copy/paste bug (verified on 1.0.2 and 1.1.x installs).
				 * Deleting the second declaration is behavior-neutral. The plugin ships
				 * as both `thegem-blocks-elementor` and `-thegem-blocks-elementor`.
				 */
				'thegem-blocks-elementor' => array(
					'folders'        => array( 'thegem-blocks-elementor', '-thegem-blocks-elementor' ),
					'file'           => 'inc/classes/thegem-blocks.php',
					'patched_marker' => 'removed a duplicate `static $globalColors;`',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"        static \$dummyListByUrl;\n        static \$globalColors;",
							'        static $dummyListByUrl; // wpcomsh: removed a duplicate `static $globalColors;` here (PHP 8.3+ fatal); it is declared two lines above.',
						),
					),
				),

				/*
				 * `deep_magazine_ele_ajax()` declares three static variables — the
				 * shared counters `$magazin_uniqid`, `$title_uniqid`, and `$uniqid` —
				 * once per magazine-type branch (three branches each). PHP stops
				 * compiling at the first duplicate, so the fatals surfaced one
				 * variable at a time; a full audit of the file shows all of them.
				 *
				 * `$magazin_uniqid` and `$title_uniqid` are hoisted to the top of the
				 * function (one shared slot, initial 0 — identical to the pre-8.3
				 * compile-time semantics) and the branch declarations become plain
				 * increments. `$uniqid` cannot be hoisted under its own name: the
				 * function assigns `$uniqid` from request input as a plain local
				 * before any branch declaration binds the static slot, so a hoisted
				 * binding would let that assignment clobber the counter. Instead a
				 * `$deep_loop_uniqid` slot is hoisted and each branch declaration
				 * becomes a reference binding (`$uniqid = &$deep_loop_uniqid;`),
				 * which reproduces the original bind-at-this-point behavior exactly.
				 *
				 * The vendor shipped the same 2.1.2 code with two line endings, so
				 * the patch carries a CRLF set (also handling files already carrying
				 * the first-round magazin-only hoist) and an LF set for pristine
				 * files.
				 */
				'deepcore'                => array(
					'folders'          => array( 'deepcore' ),
					'file'             => 'src/components/functions/functions-general.php',
					'patched_marker'   => '$deep_loop_uniqid',
					'strategy'         => 'replace_once',
					'replacement_sets' => array(
						// CRLF file that already has the first-round magazin hoist.
						array(
							array(
								"\t// wpcomsh: hoisted out of the type branches below (PHP 8.3+ duplicate-static fatal).\r\n\tstatic \$magazin_uniqid = 0;\r\n",
								"\t// wpcomsh: hoisted out of the type branches below (PHP 8.3+ duplicate-static fatal).\r\n\tstatic \$magazin_uniqid = 0;\r\n\tstatic \$title_uniqid = 0;\r\n\tstatic \$deep_loop_uniqid = 0;\r\n",
							),
							array(
								"\t\t<?php static \$title_uniqid = 0; \$title_uniqid++; ?>\r\n",
								"\t\t<?php \$title_uniqid++; ?>\r\n",
							),
							array(
								"\t\tstatic \$title_uniqid = 0;\r\n\t\t\$title_uniqid++;",
								"\t\t\$title_uniqid++;",
								2,
							),
							array(
								"\n\t\t\t\tstatic \$uniqid = 0;\r",
								"\n\t\t\t\t\$uniqid = &\$deep_loop_uniqid;\r",
							),
							array(
								"\n\t\t\t\t\tstatic \$uniqid = 0;\r",
								"\n\t\t\t\t\t\$uniqid = &\$deep_loop_uniqid;\r",
							),
							array(
								"\n\t\t\t\t\t\tstatic \$uniqid = 0;\r",
								"\n\t\t\t\t\t\t\$uniqid = &\$deep_loop_uniqid;\r",
							),
						),
						// Pristine LF file (same 2.1.2 code, normalized line endings).
						array(
							array(
								"function deep_magazine_ele_ajax() {\n",
								"function deep_magazine_ele_ajax() {\n\t// wpcomsh: hoisted out of the type branches below (PHP 8.3+ duplicate-static fatal).\n\tstatic \$magazin_uniqid = 0;\n\tstatic \$title_uniqid = 0;\n\tstatic \$deep_loop_uniqid = 0;\n",
							),
							array(
								"\t\tstatic \$magazin_uniqid = 0;\n\t\t\$magazin_uniqid++;",
								"\t\t\$magazin_uniqid++;",
								3,
							),
							array(
								"\t\t<?php static \$title_uniqid = 0; \$title_uniqid++; ?>\n",
								"\t\t<?php \$title_uniqid++; ?>\n",
							),
							array(
								"\t\tstatic \$title_uniqid = 0;\n\t\t\$title_uniqid++;",
								"\t\t\$title_uniqid++;",
								2,
							),
							array(
								"\n\t\t\t\tstatic \$uniqid = 0;\n",
								"\n\t\t\t\t\$uniqid = &\$deep_loop_uniqid;\n",
							),
							array(
								"\n\t\t\t\t\tstatic \$uniqid = 0;\n",
								"\n\t\t\t\t\t\$uniqid = &\$deep_loop_uniqid;\n",
							),
							array(
								"\n\t\t\t\t\t\tstatic \$uniqid = 0;\n",
								"\n\t\t\t\t\t\t\$uniqid = &\$deep_loop_uniqid;\n",
							),
						),
					),
				),

				/*
				 * `MalinaGridPosts()` in inc/shortcodes.php declares `static $i = 0;` in
				 * both the style_3 and style_7 branches (shared layout counter). Hoisted
				 * to the top of the function, branch declarations deleted. The file uses
				 * CRLF line endings; the searches are newline-anchored so the 5-tab
				 * declaration cannot match inside the 6-tab one.
				 */
				'malina-elements'         => array(
					'folders'        => array( 'malina-elements' ),
					'file'           => 'inc/shortcodes.php',
					'patched_marker' => 'wpcomsh: hoisted',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"\tfunction MalinaGridPosts(\$atts, \$content = null){\r\n",
							"\tfunction MalinaGridPosts(\$atts, \$content = null){\r\n\t\t// wpcomsh: hoisted out of the style branches below (PHP 8.3+ duplicate-static fatal).\r\n\t\tstatic \$i = 0;\r\n",
						),
						array(
							"\n\t\t\t\t\t\tstatic \$i = 0;\r",
							'',
						),
						array(
							"\n\t\t\t\t\tstatic \$i = 0;\r",
							'',
						),
					),
				),

				/*
				 * `admin_notice()` in includes/ld-autoupdate.php (LearnDash 3.2.x) was
				 * hand-edited on the site: a `static $notice_shown = true; # code by Tj`
				 * line sits directly below the stock `static $notice_shown = false;`
				 * declaration to suppress the license notice. Pre-8.3 the last
				 * initializer won (true); keeping the site's customized line and
				 * removing the stock one preserves that behavior exactly.
				 */
				'sfwd-lms'                => array(
					'folders'        => array( 'sfwd-lms' ),
					'file'           => 'includes/ld-autoupdate.php',
					'patched_marker' => 'wpcomsh: removed the duplicate',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"\t\t\tstatic \$notice_shown = false;\n\t\t\tstatic \$notice_shown = true; # code by Tj",
							"\t\t\t// wpcomsh: removed the duplicate stock declaration (PHP 8.3+ fatal); the site-customized line below is the effective initializer.\n\t\t\tstatic \$notice_shown = true; # code by Tj",
						),
					),
				),

				/*
				 * `ecoist_gallery_layouts_shortcode()` declares
				 * `static $image_counter_classic = 1;` in two gallery-layout branches
				 * (shared element counter). Hoisted to the top of the function, branch
				 * declarations deleted.
				 */
				'cp-addons-for-vc'        => array(
					'folders'        => array( 'cp-addons-for-vc' ),
					'file'           => 'modules/ecoist_gallery_layouts.php',
					'patched_marker' => 'wpcomsh: hoisted',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"\t\tfunction ecoist_gallery_layouts_shortcode( \$atts, \$content = null ) {",
							"\t\tfunction ecoist_gallery_layouts_shortcode( \$atts, \$content = null ) {\n\t\t\t// wpcomsh: hoisted out of the layout branches below (PHP 8.3+ duplicate-static fatal).\n\t\t\tstatic \$image_counter_classic = 1;",
						),
						array(
							"\n\t\t\t\t\t\t\t\t\t\t\t\t\tstatic \$image_counter_classic = 1;",
							'',
							2,
						),
					),
				),

				/*
				 * The Elementor widget's `render()` in
				 * elementor-widgets/widgets_classes/gallery_layouts.php declares
				 * `static $counter = 1;` in three gallery-layout branches (shared
				 * element counter; same vendored code family as cp-addons-for-vc).
				 * Hoisted to the top of render(), branch declarations deleted.
				 */
				'ingeniofy'               => array(
					'folders'        => array( 'ingeniofy' ),
					'file'           => 'elementor-widgets/widgets_classes/gallery_layouts.php',
					'patched_marker' => 'wpcomsh: hoisted',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							'  protected function render(){',
							"  protected function render(){\n    // wpcomsh: hoisted out of the layout branches below (PHP 8.3+ duplicate-static fatal).\n    static \$counter = 1;",
						),
						array(
							"\n\t\t\t\t\t\t\t\tstatic \$counter = 1;",
							'',
							3,
						),
					),
				),
			);
		}

		/**
		 * Patch a plugin to work with PHP 8.3+.
		 *
		 * Applies a minimal, behavior-preserving rename of a duplicate `static`
		 * variable declaration that fatals on PHP 8.3+ ("Duplicate declaration of
		 * static variable"). See php83_plugin_patches() for the per-plugin rationale.
		 *
		 * ## OPTIONS
		 *
		 * <plugin>
		 * : The plugin to patch. Any of the plugin's known folder slugs is accepted.
		 *
		 * [--force]
		 * : Patch even when an update for the plugin is pending. Only for cases
		 *   where the update exists but cannot be installed (dead license,
		 *   broken vendor download).
		 *
		 * @subcommand php83-plugin-patch
		 */
		public function php_83_plugin_patch( $args, $assoc_args ) {
			$patches = self::php83_plugin_patches();
			$slug    = $args[0];

			// Accept any of a patch's folder slugs as the argument: the error logs
			// that drive the patch jobs report whichever folder the vendor shipped.
			if ( ! isset( $patches[ $slug ] ) ) {
				foreach ( $patches as $key => $candidate ) {
					if ( in_array( $slug, $candidate['folders'], true ) ) {
						$slug = $key;
						break;
					}
				}
			}

			if ( ! isset( $patches[ $slug ] ) ) {
				WP_CLI::error( sprintf( 'No PHP 8.3 patch for %s. Available: %s.', $slug, implode( ', ', array_keys( $patches ) ) ) );
			}

			$patch = $patches[ $slug ];

			// Resolve which of the plugin's known folder slugs is installed.
			$plugin_file = null;
			foreach ( array_keys( get_plugins() ) as $file ) {
				$file = (string) $file;
				if ( in_array( dirname( $file ), $patch['folders'], true ) ) {
					$plugin_file = $file;
					break;
				}
			}

			if ( null === $plugin_file ) {
				WP_CLI::error( "$slug plugin is not installed." );
			}

			// Don't patch if an update is pending: the new version may already fix this,
			// and an update would overwrite the patched file anyway. Refresh the
			// transient first so the decision is based on current data.
			if ( ! \WP_CLI\Utils\get_flag_value( $assoc_args, 'force', false ) ) {
				wp_update_plugins();
				$update_plugins = get_site_transient( 'update_plugins' );

				if ( isset( $update_plugins->response[ $plugin_file ] ) ) {
					$new_version = $update_plugins->response[ $plugin_file ]->new_version ?? 'unknown';
					WP_CLI::error( "An update to $slug $new_version is available; update the plugin instead of patching, or re-run with --force if the update cannot be installed." );
				}
			}

			$file = WP_PLUGIN_DIR . '/' . dirname( (string) $plugin_file ) . '/' . $patch['file'];

			$this->apply_php83_patch( $file, $patch );
		}

		/**
		 * Patch definitions for the php83-theme-patch subcommand.
		 *
		 * Same duplicate-static-variable fatal as php83_plugin_patches(), for themes.
		 * Two vendor families cover every affected theme:
		 *
		 * - SecondLine podcast themes share inc/audio-functions.php, where
		 *   `secondline_powerpress_options()` declares `static $secondline_player_called;`
		 *   at the top and then `static $secondline_player_called = true;` inside a
		 *   branch. Pre-8.3, the branch initializer set the slot's compile-time initial
		 *   value (true); dropping the duplicate `static` keyword and keeping a plain
		 *   `= true` assignment in that branch reproduces the same values on every path.
		 *   These theme files use CRLF line endings.
		 *
		 * - Select-Themes themes share lib/functions/meta.php, where the theme-prefixed
		 *   `*_print_meta_box()` declares `static $muindex = 1;` in both the
		 *   `mediaupload` and `mediaupload_standard` switch cases. The counter feeds
		 *   unique uploader DOM ids shared across both cases, so it is hoisted to the
		 *   top of the function (one shared slot, initial 1 — identical to the pre-8.3
		 *   compile-time semantics) and the case declarations are deleted. `hazel1` is
		 *   a site-local copy of hazel and shares its function prefix.
		 *
		 * @return array<string,array> Patch definitions keyed by theme slug.
		 */
		private static function php83_theme_patches() {
			$patches = array();

			$secondline_replacement = array(
				array(
					"\t\t\tstatic \$secondline_player_called = true;\r\n",
					"\t\t\t\$secondline_player_called = true; // wpcomsh: dropped a duplicate `static` keyword (PHP 8.3+ fatal); the variable is declared static at the top of this function.\r\n",
				),
			);

			foreach ( array( 'tusant-secondline', 'gumbo-secondline', 'dixie-secondline', 'satchmo-secondline', 'bolden-secondline' ) as $slug ) {
				$patches[ $slug ] = array(
					'file'           => 'inc/audio-functions.php',
					'patched_marker' => 'wpcomsh: dropped a duplicate',
					'strategy'       => 'replace_once',
					'replacements'   => $secondline_replacement,
				);
			}

			$select_themes = array(
				'hazel'    => 'hazel',
				'hazel1'   => 'hazel',
				'alma'     => 'alma',
				'maple'    => 'maple',
				'rhythm'   => 'rhythm',
				'architek' => 'architek',
				'skudo'    => 'skudo',
				'larch-1'  => 'larch',
			);

			foreach ( $select_themes as $slug => $function_prefix ) {
				$patches[ $slug ] = array(
					'file'           => 'lib/functions/meta.php',
					'patched_marker' => 'wpcomsh: hoisted',
					'strategy'       => 'replace_once',
					'replacements'   => array(
						array(
							"function {$function_prefix}_print_meta_box(\$meta_box, \$post){",
							"function {$function_prefix}_print_meta_box(\$meta_box, \$post){\n\t// wpcomsh: hoisted out of the mediaupload cases below (PHP 8.3+ duplicate-static fatal).\n\tstatic \$muindex = 1;",
						),
						array(
							"\n\t\t\tstatic \$muindex = 1;",
							'',
							2,
						),
					),
				);
			}

			return $patches;
		}

		/**
		 * Patch a theme to work with PHP 8.3+.
		 *
		 * Applies a minimal, behavior-preserving fix for a duplicate `static`
		 * variable declaration that fatals on PHP 8.3+ ("Duplicate declaration of
		 * static variable"). See php83_theme_patches() for the per-theme rationale.
		 *
		 * ## OPTIONS
		 *
		 * <theme>
		 * : The theme to patch.
		 *
		 * [--force]
		 * : Patch even when an update for the theme is pending. Only for cases
		 *   where the update exists but cannot be installed (dead license,
		 *   broken vendor download).
		 *
		 * @subcommand php83-theme-patch
		 */
		public function php_83_theme_patch( $args, $assoc_args ) {
			$patches = self::php83_theme_patches();
			$slug    = $args[0];

			if ( ! isset( $patches[ $slug ] ) ) {
				WP_CLI::error( sprintf( 'No PHP 8.3 patch for %s. Available: %s.', $slug, implode( ', ', array_keys( $patches ) ) ) );
			}

			$patch = $patches[ $slug ];
			$theme = wp_get_theme( $slug );

			if ( ! $theme->exists() ) {
				WP_CLI::error( "$slug theme is not installed." );
			}

			// Don't patch if an update is pending: the new version may already fix this,
			// and an update would overwrite the patched file anyway. Refresh the
			// transient first so the decision is based on current data.
			if ( ! \WP_CLI\Utils\get_flag_value( $assoc_args, 'force', false ) ) {
				wp_update_themes();
				$update_themes = get_site_transient( 'update_themes' );

				if ( isset( $update_themes->response[ $slug ] ) ) {
					$new_version = $update_themes->response[ $slug ]['new_version'] ?? 'unknown';
					WP_CLI::error( "An update to $slug $new_version is available; update the theme instead of patching, or re-run with --force if the update cannot be installed." );
				}
			}

			$file = $theme->get_stylesheet_directory() . '/' . $patch['file'];

			$this->apply_php83_patch( $file, $patch );
		}

		/**
		 * Apply one php83 patch definition to a file on disk.
		 *
		 * Exits via WP_CLI::error() when the file or any patch target does not look
		 * exactly as expected — an unknown vendor version is a reason to stop, not
		 * to guess.
		 *
		 * @param string $file  Absolute path of the file to patch.
		 * @param array  $patch Patch definition (see php83_plugin_patches()).
		 */
		private function apply_php83_patch( $file, array $patch ) {
			if ( ! file_exists( $file ) ) {
				WP_CLI::error( 'File not found: ' . $file );
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$file_content = file_get_contents( $file );

			if ( false === $file_content ) {
				WP_CLI::error( 'File not readable: ' . $file );
			}

			// Already patched: re-running is a safe no-op.
			if ( false !== strpos( $file_content, $patch['patched_marker'] ) ) {
				WP_CLI::success( 'Already patched.' );
				return;
			}

			if ( 'split_rename' === $patch['strategy'] ) {
				// Rename every occurrence of `search` after `split_marker`, leaving the
				// original declaration before the marker untouched.
				$marker_pos = strpos( $file_content, $patch['split_marker'] );

				if ( false === $marker_pos ) {
					WP_CLI::error( 'Patch target not found in ' . $file );
				}

				$before = substr( $file_content, 0, $marker_pos );
				$after  = substr( $file_content, $marker_pos );

				$count = 0;
				$after = str_replace( $patch['search'], $patch['replace'], $after, $count );

				if ( ! $count ) {
					WP_CLI::error( 'String not found on ' . $file );
				}

				$file_content = $before . $after;
			} else {
				// replace_once: every pair must match exactly as many times as expected
				// (default 1), or the installed version differs from the one the patch
				// was written against. A patch may carry several 'replacement_sets'
				// (e.g. CRLF and LF variants of the same vendor file); the first set
				// whose first pair matches is applied in full.
				$sets = $patch['replacement_sets'] ?? array( $patch['replacements'] );
				$set  = null;

				foreach ( $sets as $candidate ) {
					if ( substr_count( $file_content, $candidate[0][0] ) === ( $candidate[0][2] ?? 1 ) ) {
						$set = $candidate;
						break;
					}
				}

				if ( null === $set ) {
					WP_CLI::error( sprintf( 'No replacement set matches %s — unknown vendor version?', $file ) );
				}

				foreach ( $set as $replacement ) {
					$search      = $replacement[0];
					$replace     = $replacement[1];
					$expected    = $replacement[2] ?? 1;
					$occurrences = substr_count( $file_content, $search );

					if ( $expected !== $occurrences ) {
						WP_CLI::error( sprintf( 'Expected exactly %d match(es) in %s, found %d — unknown vendor version?', $expected, $file, $occurrences ) );
					}

					$file_content = str_replace( $search, $replace, $file_content );
				}
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			if ( ! file_put_contents( $file, $file_content ) ) {
				WP_CLI::error( 'Failed to write to ' . $file );
			}

			WP_CLI::success( 'Success' );
		}

		/**
		 * Enable or disable fatal error emails.
		 *
		 * ## OPTIONS
		 *
		 * <command>
		 * : The subcommand
		 * ---
		 * options:
		 *  - get
		 *  - set
		 * ---
		 *
		 * [--value=<value>]
		 * : The value (when setting)
		 * ---
		 * default: 1
		 * options:
		 *  - 0
		 *  - 1
		 * ---
		 *
		 * @subcommand disable-fatal-error-emails
		 */
		public function fatal_error_emails_disable( $args, $assoc_args ) {
			$command = $args[0];
			$value   = (bool) $assoc_args['value'];

			switch ( $command ) {
				case 'get':
					$option = get_option( 'wpcomsh_disable_fatal_error_emails', false );
					WP_CLI::log( $option ? 'true' : 'false' );
					break;
				case 'set':
					update_option( 'wpcomsh_disable_fatal_error_emails', $value );
					WP_CLI::success( 'Success' );
					break;
				default:
					WP_CLI::error( 'Invalid command' );
			}
		}

		/**
		 * Check if the site is healthy after activating a plugin.
		 * This is a helper function for the plugin-dance command.
		 *
		 * @return bool
		 */
		private function do_plugin_dance_health_check() {
			$result = WP_CLI::runcommand(
				'--skip-themes= --skip-plugins= wpcomsh plugin-dance-health-check', // pass empty values to skip-themes and skip-plugins.
				array(
					'return'     => true,
					'launch'     => true, // must run in a new process to avoid false positives.
					'exit_error' => false,
				)
			);

			return (bool) strpos( $result, 'Healthy' );
		}

		/**
		 * Tries disabling all plugins & enabling them one by one to find the plugin causing the issue.
		 * Outputs a list of plugins that are disabled.
		 *
		 * ## OPTIONS
		 *
		 * [--strategy=<strategy>]
		 * : The strategy to use to find the breaking plugin. Defaults to 'one-by-one'.
		 * ---
		 * default: one-by-one
		 * options:
		 *  - one-by-one
		 *  - disable-all
		 *
		 * @subcommand plugin-dance
		 */
		public function plugin_dance( $args, $assoc_args ) {
			$healthy = $this->do_plugin_dance_health_check();
			if ( $healthy ) {
				WP_CLI::success( '✔ Site health check passed before doing anything.' );
				return;
			}

			$plugins = WP_CLI::runcommand(
				'--skip-plugins --skip-themes plugin list --status=active --format=json',
				array(
					'launch' => false,
					'return' => true,
				)
			);

			$plugins = json_decode( $plugins, true );

			// Filter out plugins we won't be touching. These won't be deactivated by deactivate-user-plugins.
			$plugins_to_reactivate = array_filter(
				$plugins,
				function ( $plugin ) {
					$plugin_name = $plugin['name'];
					if ( in_array( $plugin_name, WPCOMSH_CLI_DONT_DEACTIVATE_PLUGINS, true ) || in_array( $plugin_name, WPCOMSH_CLI_ECOMMERCE_PLAN_PLUGINS, true ) ) {
						WP_CLI::log( sprintf( 'ℹ️ Skipping %s.', $plugin_name ) );
						return false;
					}

					return true;
				}
			);

			$breaking_plugins = array();

			if ( 'one-by-one' === $assoc_args['strategy'] ) {
				while ( ! $healthy ) {
					$plugin_to_deactivate = array_pop( $plugins_to_reactivate );
					if ( empty( $plugin_to_deactivate ) ) {
						WP_CLI::error( '❌ Site health check failed after testing all plugins one by one.' );
						return;
					}

					WP_CLI::runcommand(
						sprintf( '--skip-themes plugin deactivate %s', $plugin_to_deactivate['name'] ),
						array(
							'launch' => false,
							'return' => true,
						)
					);

					$healthy = $this->do_plugin_dance_health_check();

					if ( ! $healthy ) {
						WP_CLI::log( sprintf( 'ℹ️ Site health check still failed after deactivating: %s. Reactivating.', $plugin_to_deactivate['name'] ) );
						$result = WP_CLI::runcommand(
							sprintf( '--skip-themes plugin activate %s', $plugin_to_deactivate['name'] ),
							array(
								'launch'     => true,  // needed for exit_error => false.
								'return'     => true,
								'exit_error' => false,
							)
						);

						if ( empty( $result ) ) {
							WP_CLI::log( sprintf( '❌ Plugin did not like being activated: %s (probably broken).', $plugin_to_deactivate['name'] ) );
							$breaking_plugins[] = array(
								'name'    => $plugin_to_deactivate['name'],
								'version' => $plugin_to_deactivate['version'],
							);
						}
					} else {
						WP_CLI::log( sprintf( '✔ Site health check passed after deactivating: %s.', $plugin_to_deactivate['name'] ) );
						$breaking_plugins[] = array(
							'name'    => $plugin_to_deactivate['name'],
							'version' => $plugin_to_deactivate['version'],
						);
					}
				}
			} elseif ( 'disable-all' === $assoc_args['strategy'] ) {
				WP_CLI::log( 'ℹ️ Deactivating all user plugins.' );

				// deactivate all active plugins.
				WP_CLI::runcommand(
					'--skip-plugins --skip-themes wpcomsh deactivate-user-plugins',
					array(
						'launch' => false,
					)
				);

				if ( ! $this->do_plugin_dance_health_check() ) {
					WP_CLI::log( '❌ Site health check failed after deactivating all plugins. Something non-plugin related is causing the issue. Trying to reactivate all plugins.' );

					WP_CLI::runcommand(
						'--skip-themes --skip-plugins wpcomsh reactivate-user-plugins',
						array()
					);
					return;
				}

				WP_CLI::log( sprintf( 'ℹ️ %d plugins will be reactivated one by one to find the breaking plugin.', count( $plugins_to_reactivate ) ) );

				// loop through each active plugin and activate one by one.
				foreach ( $plugins_to_reactivate as $plugin ) {
					$result = WP_CLI::runcommand(
						sprintf( '--skip-themes plugin activate %s', $plugin['name'] ),
						array(
							'launch'     => true, // needed for exit_error => false.
							'return'     => true,
							'exit_error' => false,
						)
					);
					if ( empty( $result ) ) {
						WP_CLI::log( sprintf( '❌ Plugin did not like being activated: %s (probably broken).', $plugin['name'] ) );
						$breaking_plugins[] = array(
							'name'    => $plugin['name'],
							'version' => $plugin['version'],
						);
						continue;
					}

					if ( ! $this->do_plugin_dance_health_check() ) {
						// deactivate the breaking plugin
						WP_CLI::runcommand(
							sprintf( '--skip-themes plugin deactivate %s', $plugin['name'] ),
							array(
								'launch' => false,
								'return' => true,
							)
						);
						WP_CLI::log( sprintf( '❌ Plugin activated, site health check failed and deactivated: %s.', $plugin['name'] ) );

						$breaking_plugins[] = array(
							'name'    => $plugin['name'],
							'version' => $plugin['version'],
						);
					} else {
						WP_CLI::log( sprintf( '✔ Plugin activated and site health check passed: %s.', $plugin['name'] ) );
					}
				}

				if ( empty( $breaking_plugins ) ) {
					WP_CLI::success( 'All plugins passed the site health check.' );
				}
			}

			if ( ! empty( $breaking_plugins ) ) {
				$formatter = new \WP_CLI\Formatter(
					$assoc_args,
					array( 'name', 'version' )
				);
				$formatter->display_items( $breaking_plugins );
			}
		}

		/**
		 * This just outputs healthy. If there are errors this doesn't get outputted at all
		 *
		 * @subcommand plugin-dance-health-check
		 */
		public function plugin_dance_health_check( $args, $assoc_args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			WP_CLI::success( 'Healthy' );
		}

		/**
		 * Runs comprehensive site diagnostics including Jetpack status, admin users, plugins, purchases, and PHP errors
		 *
		 * @subcommand diag
		 */
		public function diagnostic( $args, $assoc_args ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			WP_CLI::log( WP_CLI::colorize( '%B=== SITE DIAGNOSTICS ===%n' ) );
			WP_CLI::log( '' );

			// 1. Jetpack Status
			WP_CLI::log( WP_CLI::colorize( '%Y--- Jetpack Status ---%n' ) );
			$jetpack_result = WP_CLI::runcommand(
				'jetpack status full',
				array(
					'launch'     => false,
					'return'     => 'all',
					'exit_error' => false,
				)
			);

			if ( 0 === $jetpack_result->return_code ) {
				WP_CLI::log( $jetpack_result->stdout );
			} else {
				WP_CLI::log( WP_CLI::colorize( '%RJetpack status command failed:%n' ) );
				WP_CLI::log( $jetpack_result->stderr );
			}

			WP_CLI::log( '' );

			// 2. Admin Users
			WP_CLI::log( WP_CLI::colorize( '%Y--- Administrator Users ---%n' ) );
			$admin_users_result = WP_CLI::runcommand(
				'user list --role=administrator',
				array(
					'launch'     => false,
					'return'     => 'all',
					'exit_error' => false,
				)
			);

			if ( 0 === $admin_users_result->return_code ) {
				WP_CLI::log( $admin_users_result->stdout );
			} else {
				WP_CLI::log( WP_CLI::colorize( '%RAdmin users command failed:%n' ) );
				WP_CLI::log( $admin_users_result->stderr );
			}

			WP_CLI::log( '' );

			// 3. Plugin Status
			WP_CLI::log( WP_CLI::colorize( '%Y--- Plugin Status ---%n' ) );
			$plugin_status_result = WP_CLI::runcommand(
				'plugin status',
				array(
					'launch'     => false,
					'return'     => 'all',
					'exit_error' => false,
				)
			);

			if ( 0 === $plugin_status_result->return_code ) {
				WP_CLI::log( $plugin_status_result->stdout );
			} else {
				WP_CLI::log( WP_CLI::colorize( '%RPlugin status command failed:%n' ) );
				WP_CLI::log( $plugin_status_result->stderr );
			}

			WP_CLI::log( '' );

			// 4. Theme Status
			WP_CLI::log( WP_CLI::colorize( '%Y--- Theme Status ---%n' ) );
			$theme_status_result = WP_CLI::runcommand(
				'theme status',
				array(
					'launch'     => false,
					'return'     => 'all',
					'exit_error' => false,
				)
			);

			if ( 0 === $theme_status_result->return_code ) {
				WP_CLI::log( $theme_status_result->stdout );
			} else {
				WP_CLI::log( WP_CLI::colorize( '%RTheme status command failed:%n' ) );
				WP_CLI::log( $theme_status_result->stderr );
			}

			WP_CLI::log( '' );

			// 5. WPCOMSH Purchases (formatted as table)
			WP_CLI::log( WP_CLI::colorize( '%Y--- Site Purchases ---%n' ) );
			$purchases_result = WP_CLI::runcommand(
				'wpcomsh purchases --format=json',
				array(
					'launch'     => false,
					'return'     => 'all',
					'exit_error' => false,
				)
			);

			if ( 0 === $purchases_result->return_code ) {
				$purchases_data = json_decode( $purchases_result->stdout, true );
				if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
					$formatted_purchases = array();
					foreach ( $purchases_data as $purchase ) {
						$formatted_purchases[] = array(
							'product'    => $purchase['product_slug'] ?? 'N/A',
							'type'       => $purchase['product_type'] ?? 'N/A',
							'subscribed' => isset( $purchase['subscribed_date'] ) ? gmdate( 'Y-m-d', strtotime( $purchase['subscribed_date'] ) ) : 'N/A',
							'expires'    => isset( $purchase['expiry_date'] ) ? gmdate( 'Y-m-d', strtotime( $purchase['expiry_date'] ) ) : 'N/A',
							'auto_renew' => isset( $purchase['auto_renew'] ) ? ( $purchase['auto_renew'] ? 'Yes' : 'No' ) : 'N/A',
						);
					}

					$table_args = array( 'format' => 'table' );
					$formatter  = new \WP_CLI\Formatter(
						$table_args,
						array( 'product', 'type', 'subscribed', 'expires', 'auto_renew' )
					);
					$formatter->display_items( $formatted_purchases );
				} else {
					WP_CLI::log( 'No purchases found.' );
				}
			} else {
				WP_CLI::log( WP_CLI::colorize( '%RPurchases command failed:%n' ) );
				WP_CLI::log( $purchases_result->stderr );
			}

			WP_CLI::log( '' );

			// 6. PHP Errors (filtered to critical errors)
			WP_CLI::log( WP_CLI::colorize( '%Y--- Critical PHP Errors ---%n' ) );
			$error_log_file = '/tmp/php-errors';

			if ( file_exists( $error_log_file ) ) {
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_shell_exec
				$output = shell_exec( "grep -E 'Fatal error|PHP Fatal error|Parse error|Uncaught Error|Uncaught Exception|TypeError|ArgumentCountError|Compile error' " . escapeshellarg( $error_log_file ) . ' | tail -n 100' );

				if ( ! empty( trim( (string) $output ) ) ) {
					WP_CLI::log( trim( (string) $output ) );
				} else {
					WP_CLI::log( WP_CLI::colorize( '%GNo critical PHP errors found.%n' ) );
				}
			} else {
				WP_CLI::log( WP_CLI::colorize( '%RPHP errors file not found:%n /tmp/php-errors' ) );
			}

			WP_CLI::log( '' );
			WP_CLI::log( WP_CLI::colorize( '%B=== DIAGNOSTICS COMPLETE ===%n' ) );
		}
	}
}

if ( class_exists( 'Checksum_Plugin_Command' ) ) {
	/**
	 * This works just like plugin verify-checksums except it filters language translation files.
	 * Language files are not part of WordPress.org's checksums so they are listed as added and
	 * they obfuscate the output. This makes it hard to spot actual checksum verification errors.
	 */
	class Checksum_Plugin_Command_WPCOMSH extends Checksum_Plugin_Command { // phpcs:ignore Generic
		/**
		 * Filters the passed file path.
		 *
		 * @param string $filepath File path.
		 *
		 * @return bool
		 */
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
 *
 * [--remove-unmanaged]
 * : Deprecated. If there is an unmanaged directory in the way, remove it without asking.
 *
 * [--remove-existing]
 * : If there is an existing directory or different symlink in the way, remove it without asking.
 *
 * [--activate]
 * : Indicates that the symlinked plugin should be activated
 *
 * @return never
 */
function wpcomsh_cli_plugin_symlink( $args, $assoc_args = array() ) {
	WP_CLI::warning( 'This command is deprecated. Please use the `wpcomsh plugin use-managed` command instead.' );

	$plugin_to_symlink = $args[0];

	if ( 'wpcomsh' === $plugin_to_symlink ) {
		// wpcomsh is in the managed plugins directory, but it should not be symlinked into the plugins directory.
		WP_CLI::error( 'Cannot symlink wpcomsh' );
	}

	if ( ! chdir( WP_PLUGIN_DIR ) ) {
		WP_CLI::error( "Cannot switch to plugins directory '" . WP_PLUGIN_DIR . "'" );
	}

	$managed_plugin_relative_path = "../../../../wordpress/plugins/$plugin_to_symlink/latest";
	if ( false === realpath( $managed_plugin_relative_path ) ) {
		WP_CLI::error( "'$plugin_to_symlink' is not a managed plugin" );
	}

	$already_symlinked = false;
	if ( realpath( $plugin_to_symlink ) === realpath( $managed_plugin_relative_path ) ) {
		$already_symlinked = true;
	} elseif ( is_dir( $plugin_to_symlink ) ) {
		$permission_to_remove = false;
		if ( WP_CLI\Utils\get_flag_value( $assoc_args, 'remove-existing', false ) ) {
			$permission_to_remove = true;
		} elseif ( WP_CLI\Utils\get_flag_value( $assoc_args, 'remove-unmanaged', false ) ) {
			$permission_to_remove = true;
		} elseif ( wpcomsh_cli_confirm( "Plugin '$plugin_to_symlink' exists. Delete it and replace with symlink to managed plugin?" ) ) {
			$permission_to_remove = true;
		}
		if ( ! $permission_to_remove ) {
			exit( -1 );
		}

		if ( is_link( $plugin_to_symlink ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			if ( ! unlink( $plugin_to_symlink ) ) {
				WP_CLI::error( "Failed to remove conflicting symlink '$plugin_to_symlink'" );
				exit( -1 );
			}
		} else {
			WP_CLI::runcommand(
				"--skip-plugins --skip-themes plugin delete '$plugin_to_symlink'",
				array(
					'launch'     => false,
					'exit_error' => true,
				)
			);
		}
	}

	if ( $already_symlinked ) {
		WP_CLI::success( "Plugin '$plugin_to_symlink' is already symlinked" );
	} elseif ( symlink( $managed_plugin_relative_path, $plugin_to_symlink ) ) {
		WP_CLI::success( "Symlinked '$plugin_to_symlink' plugin" );
	} else {
		WP_CLI::error( "Failed to symlink '$plugin_to_symlink' plugin" );
		exit( -1 );
	}

	$activate = WP_CLI\Utils\get_flag_value( $assoc_args, 'activate', false );
	if ( $activate ) {

		// Invalidate cache so that the plugins can be read from the fs again.
		if ( ! $already_symlinked ) {
			wp_cache_delete( 'plugins', 'plugins' );
		}

		WP_CLI::runcommand(
			"--skip-plugins --skip-themes plugin activate '$plugin_to_symlink'",
			array(
				'launch'     => false,
				'exit_error' => true,
			)
		);
	}

	exit( 0 );
}

/**
 * Symlinks a managed theme into the site's themes directory.
 *
 * ## OPTIONS
 *
 * <theme>
 * : The managed theme to symlink.
 *
 * [--remove-unmanaged]
 * : Deprecated. If there is an unmanaged directory in the way, remove it without asking.
 *
 * [--remove-existing]
 * : If there is an existing directory or different symlink in the way, remove it without asking.
 *
 * [--activate]
 * : Indicates that the symlinked theme should be activated
 *
 * @return never
 */
function wpcomsh_cli_theme_symlink( $args, $assoc_args = array() ) {
	WP_CLI::warning( 'This command is deprecated. Please use the `wpcomsh theme use-managed` command instead.' );

	$theme_to_symlink = $args[0];

	$themes_dir = get_theme_root();
	if ( ! chdir( $themes_dir ) ) {
		WP_CLI::error( "Cannot switch to themes directory '$themes_dir'" );
	}

	$candidate_managed_theme_paths = array(
		// NOTE: pub and premium themes don't have nested `latest`and version directories.
		"../../../../wordpress/themes/pub/$theme_to_symlink",
		"../../../../wordpress/themes/premium/$theme_to_symlink",
		// Consider root themes dir last because we want to favor WPCOM-managed things on WPCOM
		// See p9o2xV-1LC-p2#comment-5417
		"../../../../wordpress/themes/$theme_to_symlink/latest",
	);

	$managed_theme_path = false;
	foreach ( $candidate_managed_theme_paths as $candidate_path ) {
		if ( false !== realpath( $candidate_path ) ) {
			$managed_theme_path = $candidate_path;
			break;
		}
	}

	if ( false === $managed_theme_path ) {
		WP_CLI::error( "'$theme_to_symlink' is not a managed theme" );
	}

	$already_symlinked = false;
	if ( realpath( $theme_to_symlink ) === realpath( $managed_theme_path ) ) {
		$already_symlinked = true;
	} elseif ( is_dir( $theme_to_symlink ) ) {
		$permission_to_remove = false;
		if ( WP_CLI\Utils\get_flag_value( $assoc_args, 'remove-existing', false ) ) {
			$permission_to_remove = true;
		} elseif ( WP_CLI\Utils\get_flag_value( $assoc_args, 'remove-unmanaged', false ) ) {
			$permission_to_remove = true;
		} elseif ( wpcomsh_cli_confirm( "Theme '$theme_to_symlink' exists. Delete it and replace with symlink to managed theme?" ) ) {
			$permission_to_remove = true;
		}
		if ( ! $permission_to_remove ) {
			exit( -1 );
		}

		if ( is_link( $theme_to_symlink ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			if ( ! unlink( $theme_to_symlink ) ) {
				WP_CLI::error( "Failed to remove conflicting symlink '$theme_to_symlink'" );
				exit( -1 );
			}
		} else {
			WP_CLI::runcommand(
				"--skip-plugins --skip-themes theme delete '$theme_to_symlink'",
				array(
					'launch'     => false,
					'exit_error' => true,
				)
			);
		}
	}

	if ( $already_symlinked ) {
		WP_CLI::success( "Theme '$theme_to_symlink' is already symlinked" );
	} elseif ( symlink( $managed_theme_path, $theme_to_symlink ) ) {
		WP_CLI::success( "Symlinked '$theme_to_symlink' theme" );
	} else {
		WP_CLI::error( "Failed to symlink '$theme_to_symlink' theme" );
		exit( -1 );
	}

	$activate = WP_CLI\Utils\get_flag_value( $assoc_args, 'activate', false );
	if ( $activate ) {
		WP_CLI::runcommand(
			"--skip-plugins --skip-themes theme activate '$theme_to_symlink'",
			array(
				'launch'     => false,
				'exit_error' => true,
			)
		);
	}

	exit( 0 );
}

/**
 * Makes the site live to the public.
 */
function wpcomsh_cli_launch_site() {
	WP_CLI::success( "If you're reading this, you should visit automattic.com/jobs and apply to join the fun, mention this command." );
}

// Cleanup via WP-Cron event.
add_action( WPCOMSH_CLI_DEACTIVATED_PLUGIN_RECORD_CLEANUP_JOB, 'wpcomsh_cli_remove_expired_from_deactivation_record' );

if ( ! defined( 'WP_CLI' ) || true !== WP_CLI ) {
	// We aren't running in a WP-CLI context, so there is nothing more to do.
	return;
}

// Force WordPress to always output English at the command line.
WP_CLI::add_wp_hook(
	'pre_option_WPLANG',
	function () {
		return 'en_US';
	}
);

// Maintain a record of deactivated plugins so that they can be reactivated by the reactivate-user-plugins command.
add_action( 'deactivated_plugin', 'wpcomsh_cli_remember_plugin_deactivation' );
add_action( 'activated_plugin', 'wpcomsh_cli_forget_plugin_deactivation' );

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
WP_CLI::add_command( 'wpcomsh plugin verify-checksums', 'Checksum_Plugin_Command_WPCOMSH' );
WP_CLI::add_command( 'plugin symlink', 'wpcomsh_cli_plugin_symlink' );
WP_CLI::add_command( 'theme symlink', 'wpcomsh_cli_theme_symlink' );
WP_CLI::add_command( 'launch-site', 'wpcomsh_cli_launch_site' );

add_action(
	'plugins_loaded',
	function () {
		if ( class_exists( 'Atomic_Platform_Managed_Software_Commands' ) ) {
			WP_CLI::add_command(
				'wpcomsh plugin use-managed',
				array( 'Atomic_Platform_Managed_Software_Commands', 'use_managed_plugin' )
			);
			WP_CLI::add_command(
				'wpcomsh plugin use-unmanaged',
				array( 'Atomic_Platform_Managed_Software_Commands', 'use_unmanaged_plugin' )
			);
			WP_CLI::add_command(
				'wpcomsh theme use-managed',
				array( 'Atomic_Platform_Managed_Software_Commands', 'use_managed_theme' )
			);
			WP_CLI::add_command(
				'wpcomsh theme use-unmanaged',
				array( 'Atomic_Platform_Managed_Software_Commands', 'use_unmanaged_theme' )
			);
		}
	}
);
