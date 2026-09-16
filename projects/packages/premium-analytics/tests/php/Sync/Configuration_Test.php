<?php
/**
 * Tests for the Sync Configuration class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack\Sync\Modules;
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
	 * A Configuration whose order-sync gate is forced open or closed.
	 *
	 * @param bool $can_sync Gate value.
	 * @return Configuration
	 */
	private static function with_order_sync( bool $can_sync ): Configuration {
		return new class( $can_sync ) extends Configuration {
			/**
			 * Forced gate value.
			 *
			 * @var bool
			 */
			private $can_sync;

			/**
			 * @param bool $can_sync Gate value.
			 */
			public function __construct( bool $can_sync ) {
				$this->can_sync = $can_sync;
			}

			protected function can_site_sync_orders(): bool {
				return $this->can_sync;
			}
		};
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
	 * With WooCommerce active and order attribution on, the Sync hooks and data settings
	 * register, and the module filter runs last so another plugin's module is already listed.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_configure_sync_with_woocommerce_registers_sync_hooks() {
		require_once __DIR__ . '/../mocks/woocommerce-active-mock.php';
		require_once __DIR__ . '/../mocks/woocommerce-features-mock.php';
		$GLOBALS['jpa_test_wc_features'] = array( 'order_attribution' => true );
		$this->assertTrue( class_exists( 'WooCommerce' ) );

		$configuration = new Configuration();
		$configuration->configure_sync();

		$this->assertSame( PHP_INT_MAX, has_filter( 'jetpack_sync_modules', array( $configuration, 'add_woocommerce_analytics_module' ) ) );
		$this->assertSame( 10, has_filter( 'jetpack_full_sync_config', array( $configuration, 'expand_full_sync_config' ) ) );
		$this->assertSame( 10, has_filter( 'jetpack_sync_post_meta_whitelist', array( $configuration, 'add_meta_to_sync_post_meta_whitelist' ) ) );
		$this->assertSame( 10, has_action( 'update_option_woocommerce_feature_order_attribution_enabled', array( $configuration, 'schedule_backfill_on_attribution_enabled' ) ) );
		$this->assertSame( 10, has_action( Configuration::BACKFILL_ACTION, array( $configuration, 'backfill_analytics' ) ) );

		$data_settings = ( new Data_Settings() )->get_data_settings();
		$this->assertContains( WooCommerce_Analytics::class, $data_settings['jetpack_sync_modules'] );
		$this->assertContains( Options::class, $data_settings['jetpack_sync_modules'] );
		foreach ( array( 'woocommerce_custom_orders_table_enabled', 'woocommerce_excluded_report_order_statuses', 'woocommerce_date_type', 'blogname' ) as $option ) {
			$this->assertContains( $option, $data_settings['jetpack_sync_options_whitelist'] );
		}
		// A default-only option proves the must-sync list is in effect rather than the full defaults.
		$this->assertNotContains( 'wordads_cmp_enabled', $data_settings['jetpack_sync_options_whitelist'] );

		// Through the real filter chain (Data_Settings at 10, then this class last).
		$modules = apply_filters( 'jetpack_sync_modules', Modules::DEFAULT_SYNC_MODULES );
		$this->assertCount( 1, array_keys( $modules, WooCommerce_Analytics::class, true ) );

		$modules = apply_filters( 'jetpack_sync_modules', array( Configuration::ANALYTICS_PLUGIN_MODULE_FQCN ) );
		$this->assertContains( Configuration::ANALYTICS_PLUGIN_MODULE_FQCN, $modules );
		$this->assertNotContains( WooCommerce_Analytics::class, $modules );
	}

	/**
	 * With WooCommerce active but order attribution off, the module is stripped from the
	 * list Data_Settings builds, so nothing analytics-related syncs.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_configure_sync_without_order_sync_drops_the_module() {
		require_once __DIR__ . '/../mocks/woocommerce-active-mock.php';
		$this->assertFalse( class_exists( 'Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) );

		( new Configuration() )->configure_sync();

		$modules = apply_filters( 'jetpack_sync_modules', Modules::DEFAULT_SYNC_MODULES );
		$this->assertContains( Options::class, $modules );
		$this->assertNotContains( WooCommerce_Analytics::class, $modules );
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
	 * The shared module is added exactly once when the site can sync orders and no other plugin provides one.
	 */
	public function test_add_woocommerce_analytics_module_adds_shared_module_once() {
		$configuration = self::with_order_sync( true );
		$modules       = $configuration->add_woocommerce_analytics_module( array( Posts::class ) );

		$this->assertSame( array( Posts::class, WooCommerce_Analytics::class ), $modules );
		$this->assertSame( $modules, $configuration->add_woocommerce_analytics_module( $modules ) );
	}

	/**
	 * The shared module is removed, even when Data_Settings listed it, while the site cannot sync orders.
	 */
	public function test_add_woocommerce_analytics_module_drops_shared_module_when_order_sync_is_not_allowed() {
		$this->assertSame(
			array( Posts::class ),
			self::with_order_sync( false )->add_woocommerce_analytics_module( array( Posts::class, WooCommerce_Analytics::class ) )
		);
	}

	/**
	 * The real gate stays closed when WooCommerce's feature utilities are unavailable.
	 */
	public function test_add_woocommerce_analytics_module_is_gated_without_woocommerce_features() {
		$this->assertFalse( class_exists( 'Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) );
		$this->assertSame( array( Posts::class ), ( new Configuration() )->add_woocommerce_analytics_module( array( Posts::class ) ) );
	}

	/**
	 * An emptied module list is a kill switch and stays empty.
	 */
	public function test_add_woocommerce_analytics_module_leaves_an_emptied_list_alone() {
		$this->assertSame( array(), ( new Configuration() )->add_woocommerce_analytics_module( array() ) );
	}

	/**
	 * The standalone Analytics plugin remains authoritative during migration.
	 */
	public function test_add_woocommerce_analytics_module_defers_to_standalone_plugin() {
		$configuration = self::with_order_sync( true );
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
	 * Expanding an already expanded config changes nothing.
	 */
	public function test_expand_full_sync_config_is_idempotent() {
		$configuration = new class() extends Configuration {
			protected function can_site_sync_orders(): bool {
				return true;
			}
		};
		$config        = array(
			'woocommerce_analytics' => 1,
			'terms'                 => 1,
			'term_relationships'    => 1,
			'posts'                 => 1,
		);

		$this->assertSame( $config, $configuration->expand_full_sync_config( $config ) );
	}

	/**
	 * The real order-attribution gate closes when WooCommerce's feature utilities are unavailable.
	 */
	public function test_full_sync_config_is_unchanged_without_woocommerce_features() {
		$this->assertFalse( class_exists( 'Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) );
		$config = array( 'posts' => 1 );

		$this->assertSame( $config, ( new Configuration() )->expand_full_sync_config( $config ) );
	}

	/**
	 * Turning order attribution on schedules one backfill run.
	 */
	public function test_backfill_is_scheduled_when_order_attribution_turns_on() {
		$configuration = new Configuration();
		wp_clear_scheduled_hook( Configuration::BACKFILL_ACTION );

		$configuration->schedule_backfill_on_attribution_enabled( 'no', 'yes' );
		$this->assertNotFalse( wp_next_scheduled( Configuration::BACKFILL_ACTION ) );

		// A second flip while one is pending does not queue another run.
		$configuration->schedule_backfill_on_attribution_enabled( 'no', 'yes' );
		$this->assertCount(
			1,
			array_filter(
				_get_cron_array(),
				static function ( $hooks ) {
					return isset( $hooks[ Configuration::BACKFILL_ACTION ] );
				}
			)
		);

		wp_clear_scheduled_hook( Configuration::BACKFILL_ACTION );
	}

	/**
	 * Other option transitions schedule nothing.
	 */
	public function test_backfill_is_not_scheduled_unless_attribution_turns_on() {
		$configuration = new Configuration();
		wp_clear_scheduled_hook( Configuration::BACKFILL_ACTION );

		$configuration->schedule_backfill_on_attribution_enabled( 'yes', 'yes' );
		$configuration->schedule_backfill_on_attribution_enabled( 'yes', 'no' );
		$configuration->schedule_backfill_on_attribution_enabled( 'no', 'no' );

		$this->assertFalse( wp_next_scheduled( Configuration::BACKFILL_ACTION ) );
	}

	/**
	 * The backfill does nothing while the module is not registered.
	 */
	public function test_backfill_is_a_no_op_without_the_module() {
		$this->assertFalse( Modules::get_module( 'woocommerce_analytics' ) );
		$this->assertFalse( ( new Configuration() )->backfill_analytics() );
	}

	/**
	 * Bookings post meta is prepended to the whitelist without dropping existing keys.
	 */
	public function test_add_meta_to_sync_post_meta_whitelist_prepends_bookings_meta() {
		$whitelist = ( new Configuration() )->add_meta_to_sync_post_meta_whitelist( array( '_existing' ) );

		$this->assertSame( '_existing', end( $whitelist ) );
		foreach ( array( '_booking_start', '_booking_end', '_booking_cost', '_booking_order_id' ) as $key ) {
			$this->assertContains( $key, $whitelist );
		}
	}
}
