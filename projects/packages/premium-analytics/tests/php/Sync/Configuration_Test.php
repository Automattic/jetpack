<?php
/**
 * Tests for the Sync Configuration class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Sync\Configuration
 */
#[CoversClass( Configuration::class )]
class Configuration_Test extends TestCase {

	/**
	 * Invoke a private method on a Configuration instance.
	 *
	 * @param string $method Method name.
	 * @return mixed
	 */
	private function call_private( string $method ) {
		$ref = new ReflectionMethod( Configuration::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invoke( new Configuration() );
	}

	/**
	 * WooCommerce-specific Sync hooks remain disabled without WooCommerce.
	 */
	public function test_configure_sync_without_woocommerce_is_a_no_op() {
		$this->assertFalse( class_exists( 'WooCommerce' ) );
		$this->assertFalse( function_exists( 'WC' ) );

		$configuration = new Configuration();
		$configuration->configure_sync();

		$this->assertFalse( has_filter( 'jetpack_sync_modules', array( $configuration, 'add_woocommerce_analytics_module' ) ) );
	}

	/**
	 * JETPACK_PREMIUM_ANALYTICS__VERSION must be whitelisted so syncing it triggers WPCom provisioning.
	 */
	public function test_sync_config_whitelists_premium_analytics_version() {
		$config = $this->call_private( 'get_jetpack_sync_config' );

		$this->assertContains( 'JETPACK_PREMIUM_ANALYTICS__VERSION', $config['jetpack_sync_constants_whitelist'] );
		// WC_ANALYTICS_VERSION is the standalone plugin's constant; PA must not whitelist it.
		$this->assertNotContains( 'WC_ANALYTICS_VERSION', $config['jetpack_sync_constants_whitelist'] );
	}

	/**
	 * WPCOM mirrors this checksum table config field-for-field in
	 * `jetpack_wpcom_sync_checksum_allowed_tables()` (wpcom:
	 * `wp-content/mu-plugins/jetpack/sync/class.jetpack-sync-shadow-replicastore.php`),
	 * and pins its side against the same map in JetpackSyncChecksumTableParityTest.
	 * The two sides hash the same rows over their own field lists, so any drift makes
	 * the affected table permanently fail its checksum audit for every syncing store.
	 *
	 * If this test fails because you changed the config: the change must ship together
	 * with the matching WPCOM change, then update the pin here.
	 *
	 * The `table` values pin the suffix but not where the prefix comes from: the
	 * expectation is built from the same `$wpdb->prefix` as the code under test, and
	 * single-site test environments cannot tell `prefix` from `base_prefix`, so a swap
	 * to `base_prefix` would pass here and only surface on multisite.
	 */
	public function test_checksum_table_config_matches_the_wpcom_pin() {
		$configuration = new class() extends Configuration {
			/**
			 * The real guard needs WooCommerce runtime symbols unavailable in this suite.
			 */
			protected function can_site_sync_orders(): bool {
				return true;
			}
		};

		$tables = $configuration->add_order_stats_to_checksum( array() );

		foreach ( $tables as $name => $config ) {
			$this->assertIsCallable(
				$config['is_table_enabled_callback'] ?? null,
				"Table '{$name}' must gate on an is_table_enabled_callback."
			);
			unset( $tables[ $name ]['is_table_enabled_callback'] );
			// Key order carries no meaning in these config maps; normalize it so a
			// pure reorder does not read as drift.
			ksort( $tables[ $name ] );
		}
		ksort( $tables );

		global $wpdb;
		$expected = array(
			'wc_order_stats'          => array(
				'table'                => "{$wpdb->prefix}wc_order_stats",
				'range_field'          => 'order_id',
				'key_fields'           => array( 'order_id' ),
				'checksum_fields'      => array( 'date_paid', 'date_completed', 'total_sales' ),
				'checksum_text_fields' => array( 'status' ),
			),
			'wc_order_product_lookup' => array(
				'table'           => "{$wpdb->prefix}wc_order_product_lookup",
				'range_field'     => 'order_id',
				'key_fields'      => array( 'order_id', 'order_item_id' ),
				'checksum_fields' => array( 'product_id', 'variation_id', 'product_qty', 'product_net_revenue', 'date_created' ),
			),
			'wc_order_coupon_lookup'  => array(
				'table'           => "{$wpdb->prefix}wc_order_coupon_lookup",
				'range_field'     => 'order_id',
				'key_fields'      => array( 'order_id', 'coupon_id' ),
				'checksum_fields' => array( 'discount_amount', 'date_created' ),
			),
			'wc_order_tax_lookup'     => array(
				'table'           => "{$wpdb->prefix}wc_order_tax_lookup",
				'range_field'     => 'order_id',
				'key_fields'      => array( 'order_id', 'tax_rate_id' ),
				'checksum_fields' => array( 'order_tax', 'total_tax', 'shipping_tax', 'date_created' ),
			),
		);
		foreach ( $expected as &$config ) {
			ksort( $config );
		}
		unset( $config );
		ksort( $expected );

		$this->assertSame(
			$expected,
			$tables,
			'The checksum table config changed. WPCOM mirrors it field-for-field; ship the matching ' .
			'WPCOM change first (jetpack_wpcom_sync_checksum_allowed_tables), then update this pin.'
		);
	}
}
