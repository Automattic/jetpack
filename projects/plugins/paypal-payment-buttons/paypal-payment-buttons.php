<?php
/**
 *
 * Plugin Name: PayPal Payment Buttons
 * Plugin URI: https://wordpress.org/plugins/paypal-payment-buttons
 * Description: Add PayPal payment buttons to your WordPress site with ease.
 * Version: 0.3.1
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: paypal-payment-buttons
 *
 * @package automattic/paypal-payment-buttons
 */

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'PAYPAL_PAYMENT_BUTTONS_DIR', plugin_dir_path( __FILE__ ) );
define( 'PAYPAL_PAYMENT_BUTTONS_ROOT_FILE', __FILE__ );
define( 'PAYPAL_PAYMENT_BUTTONS_ROOT_FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'PAYPAL_PAYMENT_BUTTONS_SLUG', 'paypal-payment-buttons' );
define( 'PAYPAL_PAYMENT_BUTTONS_NAME', 'PayPal Payment Buttons' );
define( 'PAYPAL_PAYMENT_BUTTONS_URI', 'https://jetpack.com/paypal-payment-buttons' );
define( 'PAYPAL_PAYMENT_BUTTONS_FOLDER', dirname( plugin_basename( __FILE__ ) ) );

// Jetpack Autoloader.
$jetpack_autoloader = PAYPAL_PAYMENT_BUTTONS_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require_once $jetpack_autoloader;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( PAYPAL_PAYMENT_BUTTONS_DIR . 'jetpack_vendor/i18n-map.php' );
	}
} else { // Something very unexpected. Error out gently with an admin_notice and exit loading.
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			__( 'Error loading autoloader file for PayPal Payment Buttons plugin', 'paypal-payment-buttons' )
		);
	}

	// Add a red bubble notification to My Jetpack if the installation is bad.
	add_filter(
		'my_jetpack_red_bubble_notification_slugs',
		function ( $slugs ) {
			$slugs['paypal-payment-buttons-bad-installation'] = array(
				'data' => array(
					'plugin' => 'PayPal Payment Buttons',
				),
			);

			return $slugs;
		}
	);

	add_action(
		'admin_notices',
		function () {
			if ( get_current_screen()->id !== 'plugins' ) {
				return;
			}

			$message = sprintf(
				wp_kses(
					/* translators: Placeholder is a link to a support document. */
					__( 'Your installation of PayPal Payment Buttons is incomplete. If you installed PayPal Payment Buttons from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. PayPal Payment Buttons must have Composer dependencies installed and built via the build command.', 'paypal-payment-buttons' ),
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
							'rel'    => array(),
						),
					)
				),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project'
			);
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

register_deactivation_hook( __FILE__, array( 'PayPal_Payment_Buttons', 'plugin_deactivation' ) );

// Initialize plugin.
PayPal_Payment_Buttons::init();
