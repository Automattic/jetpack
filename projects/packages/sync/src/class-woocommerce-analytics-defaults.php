<?php
/**
 * Suggested data settings for consumers of WooCommerce Analytics Sync.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Provides side-effect-free default whitelists for WooCommerce Analytics Sync.
 *
 * Consumers own registration and configuration. They may use these values as-is,
 * extend them, or replace them before passing their settings to Jetpack Config.
 */
final class WooCommerce_Analytics_Defaults {

	/**
	 * Get the options used by WooCommerce Analytics reports.
	 *
	 * @return string[] Suggested options whitelist.
	 */
	public static function get_options_whitelist(): array {
		return array(
			'woocommerce_custom_orders_table_enabled',
			'woocommerce_excluded_report_order_statuses',
			'woocommerce_date_type',
		);
	}

	/**
	 * Get the product meta used by WooCommerce Analytics reports.
	 *
	 * @return string[] Suggested post meta whitelist.
	 */
	public static function get_post_meta_whitelist(): array {
		return array(
			'_stock',
			'_stock_quantity',
			'_cogs_total_value',
			'_global_unique_id',
		);
	}
}
