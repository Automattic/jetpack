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
 * Enables the WordAds Jetpack module if required.
 *
 * @param array $args Arguments.
 * @param array $assoc_args Associated arguments.
 *
 * @return void
 */
function wpcomsh_woa_post_process_maybe_enable_wordads( $args, $assoc_args ) {

	$wordads_enabled = WP_CLI\Utils\get_flag_value( $assoc_args, 'wordads-enabled', false );
	if ( ! $wordads_enabled ) {
		return;
	}

	WP_CLI::runcommand(
		'jetpack module activate wordads',
		array(
			'launch'     => false,
			'exit_error' => false,
		)
	);
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_process_maybe_enable_wordads', 10, 2 );
