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
		public function deactivate_user_installed_plugins( $args, $assoc_args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
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
		public function reactivate_user_installed_plugins( $args, $assoc_args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
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
		public function domain_name_changed( $args, $assoc_args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
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
		 * This is a post clone command that is called after a site is cloned.
		 *
		 * This is necessary for some plugins that need to perform certain actions after
		 * a site is cloned, such as WooCommerce Payments that needs to clear its cache.
		 *
		 * Note: This command should only be executed from WPCOM as part of an atomic transfer.
		 *
		 * @subcommand post-clone
		 */
		public function post_clone( $args, $assoc_args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis
				$plugins = array(
					'woocommerce-payments' => function () {
						$account = \WC_Payments::get_account_service();
						$account->clear_cache();
					},
				);

				foreach ( $plugins as $plugin => $callback ) {
					$result = WP_CLI::runcommand(
						sprintf( '--skip-plugins --skip-themes plugin is-active %s', $plugin ),
						array(
							'launch'     => false,
							'return'     => 'all',
							'exit_error' => false,
						)
					);
					if ( 0 !== $result->return_code ) {
						WP_CLI::log( sprintf( 'Skipping inactive plugin: %s', $plugin ) );
						continue;
					}

					$callback();
					WP_CLI::log( sprintf( 'Callback executed for %s', $plugin ) );
				}
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
				$output = wp_json_encode( $output, JSON_PRETTY_PRINT );
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
		public function purchases( $args, $assoc_args ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
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
			$output             = wp_json_encode( array( 'missing_taxonomies' => $missing_taxonomies ), JSON_PRETTY_PRINT );
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
				WP_CLI::log( wp_json_encode( $global_styles, JSON_PRETTY_PRINT ) );
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
					WP_CLI::log( wp_json_encode( $global_styles, JSON_PRETTY_PRINT ) );
				} else {
					$request = new \WP_REST_Request( 'POST', "/wp/v2/global-styles/$active_global_styles_id" );
					$request->set_query_params( $global_styles );
					$response = $global_styles_controller->update_item( $request );
					if ( $response->is_error() ) {
						WP_CLI::error( $response->as_error() );
					}

					WP_CLI::log( wp_json_encode( $response->get_data(), JSON_PRETTY_PRINT ) );
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
					WP_CLI::log( wp_json_encode( $global_styles, JSON_PRETTY_PRINT ) );
				} else {
					$request = new \WP_REST_Request( 'POST', "/wp/v2/global-styles/$active_global_styles_id" );
					$request->set_query_params( $global_styles );
					$response = $global_styles_controller->update_item( $request );
					if ( $response->is_error() ) {
						WP_CLI::error( $response->as_error() );
					}

					WP_CLI::log( wp_json_encode( $response->get_data(), JSON_PRETTY_PRINT ) );
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
