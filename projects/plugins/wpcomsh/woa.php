<?php
/**
 * WPCOMSH functions file.
 *
 * @package wpcomsh
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

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
			"wp theme mod set custom_css_post_id {$safecss_post_id}",
			array(
				'launch'     => false,
				'exit_error' => false,
			)
		);
	}

	WP_CLI::log( 'safecss posts updated to custom_css' );
}
add_action( 'wpcomsh_woa_post_transfer', 'wpcomsh_woa_post_transfer_update_safecss_to_custom_css', 10, 2 );
add_action( 'wpcomsh_woa_post_reset', 'wpcomsh_woa_post_transfer_update_safecss_to_custom_css', 10, 2 );
