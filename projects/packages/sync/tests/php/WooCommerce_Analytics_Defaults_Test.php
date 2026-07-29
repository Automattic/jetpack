<?php
/**
 * Test file for WooCommerce Analytics Sync defaults.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Tests the side-effect-free defaults exposed to consumers.
 */
#[CoversClass( WooCommerce_Analytics_Defaults::class )]
class WooCommerce_Analytics_Defaults_Test extends BaseTestCase {

	/**
	 * Consumers receive the canonical options baseline.
	 */
	public function test_get_options_whitelist() {
		$this->assertSame(
			array(
				'woocommerce_custom_orders_table_enabled',
				'woocommerce_excluded_report_order_statuses',
				'woocommerce_date_type',
			),
			WooCommerce_Analytics_Defaults::get_options_whitelist()
		);
	}

	/**
	 * Consumers receive the canonical post meta baseline.
	 */
	public function test_get_post_meta_whitelist() {
		$this->assertSame(
			array(
				'_stock',
				'_stock_quantity',
				'_cogs_total_value',
				'_global_unique_id',
			),
			WooCommerce_Analytics_Defaults::get_post_meta_whitelist()
		);
	}

	/**
	 * Consumers can modify a returned list without changing later calls.
	 */
	public function test_returned_whitelists_can_be_modified_independently() {
		$options   = WooCommerce_Analytics_Defaults::get_options_whitelist();
		$options[] = 'consumer_option';

		$post_meta   = WooCommerce_Analytics_Defaults::get_post_meta_whitelist();
		$post_meta[] = '_consumer_meta';

		$this->assertNotContains( 'consumer_option', WooCommerce_Analytics_Defaults::get_options_whitelist() );
		$this->assertNotContains( '_consumer_meta', WooCommerce_Analytics_Defaults::get_post_meta_whitelist() );
	}
}
