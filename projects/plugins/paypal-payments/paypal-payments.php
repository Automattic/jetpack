<?php
/**
 *
 * Plugin Name: PayPal Payments
 * Plugin URI: TBD
 * Description: PayPal No-Code Payment Solution block lets users embed a PayPal button to sell products on their site.
 * Version: 0.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: paypal-payments
 *
 * @package automattic/paypal-payments
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'PAYPAL_PAYMENTS_DIR', plugin_dir_path( __FILE__ ) );
define( 'PAYPAL_PAYMENTS_ROOT_FILE', __FILE__ );
define( 'PAYPAL_PAYMENTS_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'PAYPAL_PAYMENTS_SLUG', 'paypal-payments' );
define( 'PAYPAL_PAYMENTS_NAME', 'PayPal Payments' );
define( 'PAYPAL_PAYMENTS_URI', 'https://jetpack.com/paypal-payments' ); // TODO: Update this.
define( 'PAYPAL_PAYMENTS_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = PAYPAL_PAYMENTS_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for PayPal Payments plugin', 'paypal-payments' )
		);
	}

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			$message = __( 'There was an error loading the plugin\'s autoloader file', 'paypal-payments' );
			wp_admin_notice(
				$message,
				array(
					'type'        => 'error',
					'dismissible' => true,
				)
			);
		}
	);

	return;
}

register_deactivation_hook( __FILE__, array( 'PayPal_Payments', 'plugin_deactivation' ) );

// Main plugin class.
new PayPal_Payments();
