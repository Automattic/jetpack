<?php
/**
 * Tests for the table checksum registry.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Replicastore;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests first-party WooCommerce Analytics checksum schemas.
 */
#[CoversClass( Table_Checksum::class )]
class Table_Checksum_Test extends BaseTestCase {

	/**
	 * Analytics checksum table configurations.
	 *
	 * @return array<string,array{0:string,1:string[],2:string[],3:string[]}>
	 */
	public static function analytics_table_provider() {
		return array(
			'order stats'    => array(
				'wc_order_stats',
				array( 'order_id' ),
				array( 'date_paid', 'date_completed', 'total_sales' ),
				array( 'status' ),
			),
			'product lookup' => array(
				'wc_order_product_lookup',
				array( 'order_id', 'order_item_id' ),
				array( 'product_id', 'variation_id', 'product_qty', 'product_net_revenue', 'date_created' ),
				array(),
			),
			'coupon lookup'  => array(
				'wc_order_coupon_lookup',
				array( 'order_id', 'coupon_id' ),
				array( 'discount_amount', 'date_created' ),
				array(),
			),
			'tax lookup'     => array(
				'wc_order_tax_lookup',
				array( 'order_id', 'tax_rate_id' ),
				array( 'order_tax', 'total_tax', 'shipping_tax', 'date_created' ),
				array(),
			),
		);
	}

	/**
	 * Analytics checksum schemas are registered centrally and use the shared gate.
	 *
	 * @param string   $table_name           Checksum table key.
	 * @param string[] $key_fields           Expected key fields.
	 * @param string[] $checksum_fields      Expected checksum fields.
	 * @param string[] $checksum_text_fields Expected checksum text fields.
	 *
	 * @dataProvider analytics_table_provider
	 */
	#[DataProvider( 'analytics_table_provider' )]
	public function test_analytics_table_schema( $table_name, $key_fields, $checksum_fields, $checksum_text_fields ) {
		global $wpdb;

		$tables = Table_Checksum::get_allowed_tables();
		$table  = $tables[ $table_name ];

		$this->assertSame( "{$wpdb->prefix}{$table_name}", $table['table'] );
		$this->assertSame( 'order_id', $table['range_field'] );
		$this->assertSame( $key_fields, $table['key_fields'] );
		$this->assertSame( $checksum_fields, $table['checksum_fields'] );
		$this->assertSame( $checksum_text_fields, $table['checksum_text_fields'] ?? array() );
		$this->assertSame(
			'Automattic\Jetpack\Sync\Replicastore\Table_Checksum::enable_woocommerce_analytics_tables',
			$table['is_table_enabled_callback']
		);
	}

	/**
	 * Analytics tables remain disabled when their Sync module is not active.
	 */
	public function test_analytics_tables_are_disabled_without_module() {
		$this->assertFalse( Table_Checksum::enable_woocommerce_analytics_tables() );
	}

	/**
	 * Analytics tables can be force-enabled where WooCommerce runtime state is unavailable.
	 */
	public function test_analytics_tables_can_be_force_enabled() {
		add_filter( 'jetpack_table_checksum_force_enable_woocommerce_analytics', '__return_true' );

		try {
			$this->assertTrue( Table_Checksum::enable_woocommerce_analytics_tables() );
		} finally {
			remove_filter( 'jetpack_table_checksum_force_enable_woocommerce_analytics', '__return_true' );
		}
	}
}
