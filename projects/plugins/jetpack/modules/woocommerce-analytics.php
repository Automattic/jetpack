<?php
/**
 * Module Name: WooCommerce Analytics
 * Module Description: Get actionable insights on your store’s orders, revenue, and customers.
 * Sort Order: 13
 * First Introduced: 8.4
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Other, Recommended
 * Feature: Engagement
 * Additional Search Queries: woocommerce, analytics, stats, statistics, tracking, analytics, views
 *
 * @package automattic/jetpack
 */

use Automattic\Woocommerce_Analytics;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Load module functionality from the package only if
 * WC_ANALYTICS constant is not defined by WooCommerce
 *
 * When WC_ANALYTICS constant is defined it means WooCommerce_Analytics package is being
 * loaded by WooCommerce core instead of Jetpack.
 *
 * We maintain for now the initialization here for compatibility reasons.
 */
if ( ! defined( 'WC_ANALYTICS' ) ) {
	Woocommerce_Analytics::init();
}
