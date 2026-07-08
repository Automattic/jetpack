<?php
/**
 * Feature Catalog registration for the "WooCommerce Analytics" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'woocommerce-analytics',
	array(
		'title'           => __( 'WooCommerce Analytics', 'jetpack' ),
		'description'     => __( 'Get actionable insights on your store’s orders, revenue, and customers.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'site',
		'module'          => 'woocommerce-analytics',
		'available_since' => array( 'jetpack' => '8.4' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-woocommerce-analytics' ),
	)
);
