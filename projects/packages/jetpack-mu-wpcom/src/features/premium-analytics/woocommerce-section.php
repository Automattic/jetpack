<?php
/**
 * The WooCommerce section of the Premium Analytics dashboard on the WordPress.com platform.
 *
 * Simple runs no Jetpack plugin, so the plugin registrant skips the platform and this file
 * registers for both. Availability stays on the section. The section and its widgets come from
 * the jetpack-woocommerce-stats package, which the Jetpack plugin bundles: WordPress.com loads
 * that copy, so this package does not.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard;

/**
 * Register the WooCommerce section when the package that owns it is loaded.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_woocommerce_section( $registry ) {
	if ( ! class_exists( Analytics_Dashboard::class ) ) {
		return;
	}

	Analytics_Dashboard::register_section( $registry );
}

/**
 * Register the WooCommerce widget types when the package that owns them is loaded.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_woocommerce_widget_types( $registry ) {
	if ( ! class_exists( Analytics_Dashboard::class ) ) {
		return;
	}

	Analytics_Dashboard::register_widget_types( $registry );
}

// After the package's own registrants (priority 10), so an existing `store` slug is found and left alone.
add_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_woocommerce_section', 20 );
add_action( 'jetpack_premium_analytics_register_widget_types', 'wpcom_premium_analytics_register_woocommerce_widget_types', 20 );
