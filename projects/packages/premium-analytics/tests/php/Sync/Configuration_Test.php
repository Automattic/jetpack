<?php
/**
 * Tests for the Sync Configuration class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack\Sync\Modules\Meta;
use Automattic\Jetpack\Sync\Modules\Options;
use Automattic\Jetpack\Sync\Modules\Posts;
use Automattic\Jetpack\Sync\Modules\Term_Relationships;
use Automattic\Jetpack\Sync\Modules\Terms;
use Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
		$this->assertFalse( has_filter( 'jetpack_full_sync_config', array( $configuration, 'expand_full_sync_config' ) ) );
		$this->assertFalse( has_filter( 'jetpack_sync_post_meta_whitelist', array( $configuration, 'add_meta_to_sync_post_meta_whitelist' ) ) );
	}

	/**
	 * With WooCommerce active, the Sync hooks and data settings register, and module
	 * arbitration waits for plugins_loaded priority 89 so Woo AI's filter exists first.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_configure_sync_with_woocommerce_registers_sync_hooks() {
		require_once __DIR__ . '/../mocks/woocommerce-active-mock.php';
		$this->assertTrue( class_exists( 'WooCommerce' ) );

		$configuration    = new Configuration();
		$modules_filter   = array( $configuration, 'add_woocommerce_analytics_module' );
		$during_bootstrap = null;

		add_action(
			'plugins_loaded',
			static function () use ( $configuration, $modules_filter, &$during_bootstrap ) {
				$configuration->configure_sync();
				$during_bootstrap = has_filter( 'jetpack_sync_modules', $modules_filter );
			},
			1
		);
		do_action( 'plugins_loaded' );

		$this->assertFalse( $during_bootstrap );
		$this->assertSame( PHP_INT_MAX, has_filter( 'jetpack_sync_modules', $modules_filter ) );
		$this->assertSame( 10, has_filter( 'jetpack_full_sync_config', array( $configuration, 'expand_full_sync_config' ) ) );
		$this->assertSame( 10, has_filter( 'jetpack_sync_post_meta_whitelist', array( $configuration, 'add_meta_to_sync_post_meta_whitelist' ) ) );

		$data_settings = ( new Data_Settings() )->get_data_settings();
		$this->assertContains( WooCommerce_Analytics::class, $data_settings['jetpack_sync_modules'] );
		$this->assertContains( Options::class, $data_settings['jetpack_sync_modules'] );
		foreach ( array( 'woocommerce_custom_orders_table_enabled', 'woocommerce_excluded_report_order_statuses', 'woocommerce_date_type', 'blogname' ) as $option ) {
			$this->assertContains( $option, $data_settings['jetpack_sync_options_whitelist'] );
		}
		// A default-only option proves the must-sync list is in effect rather than the full defaults.
		$this->assertNotContains( 'wordads_cmp_enabled', $data_settings['jetpack_sync_options_whitelist'] );
	}

	/**
	 * JETPACK_PREMIUM_ANALYTICS__VERSION must be whitelisted so syncing it triggers WPCom provisioning.
	 */
	public function test_sync_config_whitelists_premium_analytics_version() {
		$config = $this->call_private( 'get_jetpack_sync_config' );

		$this->assertContains( 'JETPACK_PREMIUM_ANALYTICS__VERSION', $config['jetpack_sync_constants_whitelist'] );
		// WC_ANALYTICS_VERSION is the standalone plugin's constant; PA must not whitelist it.
		$this->assertNotContains( 'WC_ANALYTICS_VERSION', $config['jetpack_sync_constants_whitelist'] );
		$this->assertSame(
			array_merge(
				Data_Settings::MUST_SYNC_DATA_SETTINGS['jetpack_sync_modules'],
				array(
					WooCommerce_Analytics::class,
					Meta::class,
					Posts::class,
					Terms::class,
					Term_Relationships::class,
				)
			),
			$config['jetpack_sync_modules']
		);
	}

	/**
	 * Every must-sync setting is retained, so Data_Settings never falls back to the full defaults.
	 */
	public function test_sync_config_merges_must_sync_settings_with_analytics_options() {
		$config = $this->call_private( 'get_jetpack_sync_config' );

		foreach ( Data_Settings::MUST_SYNC_DATA_SETTINGS as $filter => $required ) {
			$this->assertArrayHasKey( $filter, $config );
			foreach ( $required as $value ) {
				$this->assertContains( $value, $config[ $filter ] );
			}
		}

		$this->assertSame(
			array(
				'woocommerce_custom_orders_table_enabled',
				'woocommerce_excluded_report_order_statuses',
				'woocommerce_date_type',
			),
			array_values( array_diff( $config['jetpack_sync_options_whitelist'], Data_Settings::MUST_SYNC_DATA_SETTINGS['jetpack_sync_options_whitelist'] ) )
		);
	}

	/**
	 * The shared module is added exactly once when no legacy implementation exists.
	 */
	public function test_add_woocommerce_analytics_module_adds_shared_module_once() {
		$configuration = new Configuration();
		$modules       = $configuration->add_woocommerce_analytics_module( array() );

		$this->assertSame( array( WooCommerce_Analytics::class ), $modules );
		$this->assertSame( $modules, $configuration->add_woocommerce_analytics_module( $modules ) );
	}

	/**
	 * Woo AI remains authoritative when it has registered its Analytics module.
	 */
	public function test_add_woocommerce_analytics_module_defers_to_woo_ai() {
		$configuration = new Configuration();
		$modules       = array(
			WooCommerce_Analytics::class,
			Configuration::WOO_AI_MODULE_FQCN,
		);

		$this->assertSame(
			array( Configuration::WOO_AI_MODULE_FQCN ),
			$configuration->add_woocommerce_analytics_module( $modules )
		);
	}

	/**
	 * Premium Analytics arbitrates after Woo AI when both use the final filter priority.
	 */
	public function test_registered_module_filter_defers_to_woo_ai() {
		$configuration = new Configuration();
		$woo_ai_filter = static function ( $modules ) {
			$modules[] = Configuration::WOO_AI_MODULE_FQCN;
			return $modules;
		};

		add_filter( 'jetpack_sync_modules', $woo_ai_filter, PHP_INT_MAX );
		$configuration->register_module_filter();

		try {
			$this->assertSame(
				array( Configuration::WOO_AI_MODULE_FQCN ),
				apply_filters( 'jetpack_sync_modules', array( WooCommerce_Analytics::class ) )
			);
		} finally {
			remove_filter( 'jetpack_sync_modules', $woo_ai_filter, PHP_INT_MAX );
			remove_filter( 'jetpack_sync_modules', array( $configuration, 'add_woocommerce_analytics_module' ), PHP_INT_MAX );
		}
	}

	/**
	 * The standalone Analytics plugin remains authoritative during migration.
	 */
	public function test_add_woocommerce_analytics_module_defers_to_standalone_plugin() {
		$configuration = new Configuration();
		$modules       = array(
			Configuration::ANALYTICS_PLUGIN_MODULE_FQCN,
			WooCommerce_Analytics::class,
		);

		$this->assertSame(
			array( Configuration::ANALYTICS_PLUGIN_MODULE_FQCN ),
			$configuration->add_woocommerce_analytics_module( $modules )
		);
	}

	/**
	 * An interim module bundled by another active plugin remains authoritative.
	 */
	public function test_add_woocommerce_analytics_module_defers_to_interim_premium_analytics() {
		$configuration = new Configuration();
		$modules       = array(
			WooCommerce_Analytics::class,
			Configuration::PREMIUM_ANALYTICS_MODULE_FQCN,
		);

		$this->assertSame(
			array( Configuration::PREMIUM_ANALYTICS_MODULE_FQCN ),
			$configuration->add_woocommerce_analytics_module( $modules )
		);
	}

	/**
	 * Full sync includes Analytics and keeps Posts after the taxonomy modules.
	 */
	public function test_expand_full_sync_config_adds_analytics_when_order_sync_is_allowed() {
		$configuration = new class() extends Configuration {
			protected function can_site_sync_orders(): bool {
				return true;
			}
		};

		$this->assertSame(
			array(
				'woocommerce_analytics' => 1,
				'terms'                 => 1,
				'posts'                 => 1,
			),
			$configuration->expand_full_sync_config(
				array(
					'posts' => 1,
					'terms' => 1,
				)
			)
		);
	}

	/**
	 * Full sync remains unchanged when the site cannot sync orders.
	 */
	public function test_expand_full_sync_config_is_no_op_when_order_sync_is_not_allowed() {
		$configuration = new class() extends Configuration {
			protected function can_site_sync_orders(): bool {
				return false;
			}
		};
		$config        = array( 'posts' => 1 );

		$this->assertSame( $config, $configuration->expand_full_sync_config( $config ) );
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
