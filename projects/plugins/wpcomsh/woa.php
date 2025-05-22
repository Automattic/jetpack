<?php
/**
 * WPCOMSH functions file.
 *
 * @package wpcomsh
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

/**
 * Clear cache after other post process actions are complete.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_process_job_cache_flush( $args, $assoc_args ) {
	WP_CLI::runcommand(
		'cache flush',
		array(
			'launch'     => false,
			'exit_error' => false,
		)
	);
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_process_job_cache_flush', 99, 2 );
add_action( 'wpcomsh_woa_post_clone', 'wpcomsh_woa_post_process_job_cache_flush', 99, 2 );
add_action( 'wpcomsh_woa_post_reset', 'wpcomsh_woa_post_process_job_cache_flush', 99, 2 );

/**
 * Clear WooCommerce plugin cache post clone.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_clone_woocommerce( $args, $assoc_args ) {
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
}
add_action( 'wpcomsh_woa_post_clone', 'wpcomsh_woa_post_clone_woocommerce', 10, 2 );

/**
 * Convert `safecss` WPCOM-specific post type to `custom_css`.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_transfer_update_safecss_to_custom_css( $args, $assoc_args ) {
	$safecss_posts = get_posts(
		array(
			'numberposts' => 1,
			'post_type'   => 'safecss',
		)
	);

	foreach ( $safecss_posts as $safecss_post ) {
		$safecss_post_id = $safecss_post->ID;

		wp_update_post(
			(object) array(
				'ID'        => $safecss_post_id,
				'post_type' => 'custom_css',
			)
		);

		WP_CLI::runcommand(
			"theme mod set custom_css_post_id {$safecss_post_id}",
			array(
				'launch'     => false,
				'exit_error' => false,
			)
		);
	}

	WP_CLI::success( 'safecss posts updated to custom_css' );
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_transfer_update_safecss_to_custom_css', 10, 2 );
add_action( 'wpcomsh_woa_post_reset', 'wpcomsh_woa_post_transfer_update_safecss_to_custom_css', 10, 2 );

/**
 * Debug and error logging for the post-transfer action to enable HPOS.
 *
 * @param string $message Message to log.
 */
function wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos_log( $message ) {
	$message = sprintf( 'maybe_enable_woocommerce_hpos: %s', $message );

	// The error_log call can be uncommented for debugging.
	// error_log( $message );
	WPCOMSH_Log::unsafe_direct_log( $message );
}

/**
 * Enable HPOS for WooCommerce sites that don't already have it enabled.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos( $args, $assoc_args ) {
	// This flag is only set for sites with ECOMMERCE_MANAGED_PLUGINS. Sites without this feature are skipped.
	$enable_woocommerce_hpos = WP_CLI\Utils\get_flag_value( $assoc_args, 'enable_woocommerce_hpos', false );
	if ( ! $enable_woocommerce_hpos ) {
		return;
	}

	// Verify WooCommerce is installed and active.
	$woocommerce_is_active = is_plugin_active( 'woocommerce/woocommerce.php' );

	if ( false === $woocommerce_is_active ) {
		wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos_log( 'WooCommerce not active' );
		return;
	}

	// Verify HPOS isn't already enabled
	$option_value = get_option( 'woocommerce_custom_orders_table_enabled', false );

	if ( 'yes' === $option_value ) {
		wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos_log( 'HPOS is already enabled' );
		return;
	}

	// Enable HPOS
	$result = WP_CLI::runcommand(
		'wc hpos enable',
		array(
			'return'     => 'all',
			'launch'     => false,
			'exit_error' => false,
		)
	);
	if ( 0 !== $result->return_code ) {
		wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos_log( sprintf( 'Error enabling HPOS: %s', $result->stderr ) );
		return;
	}

	wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos_log( 'Successfully enabled HPOS' );
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_transfer_maybe_enable_woocommerce_hpos', 10, 2 );

/**
 * Woo Express: Free Trial - deactivate simple site activated plugins.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_transfer_woo_express_trial_deactivate_plugins( $args, $assoc_args ) {
	$deactivate_plugins = WP_CLI\Utils\get_flag_value( $assoc_args, 'woo-express-trial-deactivate-plugins', false );
	if ( ! $deactivate_plugins ) {
		return;
	}

	WP_CLI::runcommand(
		'--skip-plugins --skip-themes plugin deactivate crowdsignal-forms polldaddy',
		array(
			'launch'     => false,
			'exit_error' => false,
		)
	);

	WP_CLI::success( 'Woo Express plugins deactivated' );
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_transfer_woo_express_trial_deactivate_plugins', 10, 2 );

/**
 * Sets the environment type for the site.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_clone_set_staging_environment_type( $args, $assoc_args ) {
	$set_staging_environment = WP_CLI\Utils\get_flag_value( $assoc_args, 'set-staging-environment-type', false );
	if ( ! $set_staging_environment ) {
		return;
	}

	WP_CLI::runcommand(
		'config set WP_ENVIRONMENT_TYPE staging --type=constant',
		array(
			'launch'     => false,
			'exit_error' => false,
		)
	);

	WP_CLI::success( 'Staging environment set' );
}
add_action( 'wpcomsh_woa_post_clone', 'wpcomsh_woa_post_clone_set_staging_environment_type', 10, 2 );

/**
 * Install marketplace software after a site transfer.
 *
 * @param array $args       Arguments.
 * @param array $assoc_args Associated arguments.
 */
function wpcomsh_woa_post_transfer_install_marketplace_software( $args, $assoc_args ) {
	$install_marketplace_software = WP_CLI\Utils\get_flag_value( $assoc_args, 'install-marketplace-software', false );
	if ( ! $install_marketplace_software ) {
		return;
	}

	$result = ( new Marketplace_Software_Manager() )->install_marketplace_software();
	if ( is_wp_error( $result ) ) {
		WP_CLI::error( $result->get_error_message() );
		WPCOMSH_Log::unsafe_direct_log( $result->get_error_message() );
	}
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_transfer_install_marketplace_software', 10, 2 );

/**
 * Sets WordAds options and enables the WordAds Jetpack module if required.
 *
 * @param array $args Arguments.
 * @param array $assoc_args Associated arguments.
 *
 * @return void
 */
function wpcomsh_woa_post_process_maybe_enable_wordads( $args, $assoc_args ) {

	// wordads-options is expected to be a JSON object with option name=>value pairs.
	$wordads_options = WP_CLI\Utils\get_flag_value( $assoc_args, 'wordads-options', false );

	if ( false === $wordads_options ) {
		return;
	}

	$options_decoded = json_decode( $wordads_options, true );

	if ( ! is_array( $options_decoded ) ) {
		return;
	}

	// Set WordAds options.
	foreach ( $options_decoded as $option => $value ) {
		// Convert boolean options to string first to work around update_option not setting the option if the value is false.
		// This sets the option to either '1' if true or '' if false.
		update_option( $option, is_bool( $value ) ? (string) $value : $value );
	}

	// Activate the WordAds module.
	WP_CLI::runcommand(
		'jetpack module activate wordads',
		array(
			'launch'     => false,
			'exit_error' => false,
		)
	);

	WP_CLI::success( 'WordAds options transferred and module activated' );
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_process_maybe_enable_wordads', 10, 2 );

/**
 * Checks for WooCommerce connection details, validates them, and stores them in the database.
 *
 * @param array $args       Positional arguments.
 * @param array $assoc_args Named arguments.
 */
function wpcomsh_woa_post_process_store_woocommerce_connection_details( $args, $assoc_args ) {
	$woocommerce_connection_details = WP_CLI\Utils\get_flag_value( $assoc_args, 'store-woocommerce-connection-details', false );
	if ( ! $woocommerce_connection_details ) {
		return;
	}

	// Validate that we have a valid JSON object.
	$woocommerce_connection_details_decoded = json_decode( $woocommerce_connection_details, true );
	if ( ! is_array( $woocommerce_connection_details_decoded ) ) {
		WP_CLI::warning( 'Invalid WooCommerce connection details provided: ' . $woocommerce_connection_details );

		WPCOMSH_Log::unsafe_direct_log( 'wp wpcomsh: Invalid WooCommerce connection details provided', array( 'woocommerce_connection_details' => $woocommerce_connection_details ) );

		return;
	}

	$valid_keys = array(
		'auth'           => array(
			'access_token',
			'access_token_secret',
			'site_id',
			'user_id',
			'updated',
		),
		'auth_user_data' => array(
			'email',
		),
	);

	$required_root_keys = array( 'auth' );

	foreach ( $required_root_keys as $required_root_key ) {
		if ( ! isset( $woocommerce_connection_details_decoded[ $required_root_key ] ) ) {
			WP_CLI::warning( 'Invalid WooCommerce connection details provided. Missing ' . $required_root_key );

			WPCOMSH_Log::unsafe_direct_log(
				'wp wpcomsh: Invalid WooCommerce connection details provided. Missing ' . $required_root_key,
				array( 'woocommerce_connection_details' => $woocommerce_connection_details_decoded )
			);
			return;
		}
	}

	$unexpected_root_keys = array_diff( array_keys( $woocommerce_connection_details_decoded ), array_keys( $valid_keys ) );
	if ( ! empty( $unexpected_root_keys ) ) {
		WP_CLI::warning( 'Unexpected WooCommerce connection details provided. Ignoring the following root key(s): ' . implode( ', ', $unexpected_root_keys ) );
		WPCOMSH_Log::unsafe_direct_log(
			'wp wpcomsh: Unexpected additional WooCommerce connection details',
			array(
				'extra_keys'                     => $unexpected_root_keys,
				'woocommerce_connection_details' => $woocommerce_connection_details_decoded,
			)
		);
		// Keep processing the valid data, so avoid returning early..
	}

	$option_data = array();

	foreach ( $valid_keys as $valid_key => $required_key_fields ) {
		if ( ! isset( $woocommerce_connection_details_decoded[ $valid_key ] ) ) {
			// If the data isn't present, keep going - we validate presence for required keys above.
			continue;
		}

		if ( ! is_array( $woocommerce_connection_details_decoded[ $valid_key ] ) ) {
			WP_CLI::warning( 'Invalid WooCommerce connection details provided. Missing ' . $valid_key );
			WPCOMSH_Log::unsafe_direct_log(
				'wp wpcomsh: Invalid WooCommerce connection details provided. Missing ' . $valid_key,
				array( 'woocommerce_connection_details' => $woocommerce_connection_details_decoded )
			);
			return;
		}

		if ( count( $required_key_fields ) !== count( $woocommerce_connection_details_decoded[ $valid_key ] ) ) {
			WP_CLI::warning( 'Missing or extra WooCommerce connection details provided. Mismatch in ' . $valid_key );
			// Keep processing the valid data - we may have new fields that the code isn't ready for.
		}

		foreach ( $required_key_fields as $required_key_field ) {
			if ( ! isset( $woocommerce_connection_details_decoded[ $valid_key ][ $required_key_field ] ) ) {
				WP_CLI::warning( 'Invalid WooCommerce connection details provided. Missing ' . $valid_key . ' => ' . $required_key_field );
				WPCOMSH_Log::unsafe_direct_log(
					'wp wpcomsh: Invalid WooCommerce connection details provided. Missing required field',
					array(
						'missing_path'                   => "$valid_key => $required_key_field",
						'woocommerce_connection_details' => $woocommerce_connection_details_decoded,
					)
				);
				return;
			}

			$option_data[ $valid_key ][ $required_key_field ] = $woocommerce_connection_details_decoded[ $valid_key ][ $required_key_field ];
		}
	}

	if ( empty( $option_data ) ) {
		WP_CLI::warning( 'No WooCommerce connection details to update' );
		WPCOMSH_Log::unsafe_direct_log(
			'wp wpcomsh: No WooCommerce connection details to update',
			array( 'woocommerce_connection_details' => $woocommerce_connection_details_decoded )
		);
		return;
	}

	update_option( 'woocommerce_helper_data', $option_data );

	WP_CLI::success( 'WooCommerce connection details stored' );

	if ( class_exists( 'WC_Helper' ) && method_exists( 'WC_Helper', 'refresh_helper_subscriptions' ) ) {
		WC_Helper::refresh_helper_subscriptions();

		WP_CLI::success( 'Cleared WooCommerce Helper cache' );
	}
}
add_action( 'wpcomsh_woa_post_clone', 'wpcomsh_woa_post_process_store_woocommerce_connection_details', 10, 2 );
add_action( 'wpcomsh_woa_post_reset', 'wpcomsh_woa_post_process_store_woocommerce_connection_details', 10, 2 );
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_process_store_woocommerce_connection_details', 10, 2 );
