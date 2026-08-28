<?php
/**
 * TEMPORARY: interim port for WOOA7S-1550 — remove when the shared sync-modules composer package lands.
 *
 * Plain replacement for woocommerce-analytics' src/Internal/Jetpack/Sync/Configuration.php, invoked
 * from {@see \Automattic\Jetpack\PremiumAnalytics\Analytics::init()} since this package has no PHP-DI
 * container to wire it through like upstream. Omits upstream's connection bootstrap and admin-script enqueue.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack\Sync\Modules as JetpackSyncModules;
use Automattic\Jetpack\Sync\Modules\Meta as Meta_Module;
use Automattic\Jetpack\Sync\Modules\Posts as Posts_Module;
use Automattic\Jetpack\Sync\Modules\Term_Relationships as Term_Relationships_Module;
use Automattic\Jetpack\Sync\Modules\Terms as Terms_Module;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the WooCommerce Analytics Jetpack Sync module and its supporting filters.
 */
class Configuration {

	use Utilities;

	/**
	 * List of post meta to add to Sync's post meta whitelist.
	 * Any changes to these meta will be synced to WordPress.com.
	 *
	 * @static
	 * @var array
	 */
	private static $postmeta_to_sync = array(
		// Products.
		'_stock',
		'_stock_quantity',
		'_cogs_total_value',
		'_global_unique_id',
		// Bookings.
		'_booking_parent_id',
		'_booking_duplicate_of',
		'_booking_product_id',
		'_booking_resource_id',
		'_booking_order_id',
		'_booking_order_item_id',
		'_booking_customer_id',
		'_booking_start',
		'_booking_end',
		'_booking_all_day',
		'_booking_persons',
		'_booking_cost',
		'_booking_date_cancelled',
		'_booking_attendance_status',
	);

	/**
	 * Entry point called from Analytics::init(). Schedules the Sync hookups on plugins_loaded;
	 * the actual registration is a no-op unless WooCommerce is active (see {@see configure_sync()}).
	 *
	 * @return void
	 */
	public static function register(): void {
		$instance = new self();

		// Defer to plugins_loaded so the WooCommerce-active guard runs after every plugin loads; priority 1
		// also lets the Jetpack Config constructed below run its on_plugins_loaded (priority 2) handler in the same cycle.
		if ( did_action( 'plugins_loaded' ) ) {
			$instance->configure_sync();
		} else {
			add_action( 'plugins_loaded', array( $instance, 'configure_sync' ), 1 );
		}
	}

	/**
	 * Whether WooCommerce is active in the current request.
	 *
	 * @return bool
	 */
	private static function is_woocommerce_active(): bool {
		return class_exists( 'WooCommerce' ) || function_exists( 'WC' );
	}

	/**
	 * Register the Jetpack Sync filters and ensure the Sync feature, when WooCommerce is active.
	 *
	 * No-op unless WooCommerce is active, since the module relies on WooCommerce runtime symbols
	 * (WC_Order, the wc_order_stats table, OrderUtil, etc.).
	 *
	 * @return void
	 */
	public function configure_sync(): void {
		if ( ! self::is_woocommerce_active() ) {
			return;
		}

		add_filter( 'jetpack_sync_modules', array( $this, 'add_woocommerce_analytics_module' ) );
		add_filter( 'jetpack_full_sync_config', array( $this, 'expand_full_sync_config' ) );
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'add_order_stats_to_checksum' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_meta_to_sync_post_meta_whitelist' ) );

		( new Config() )->ensure( 'sync', $this->get_jetpack_sync_config() );
	}

	/**
	 * Add the WooCommerce Analytics module to the list of Jetpack Sync modules.
	 *
	 * @param array $modules The current list of sync module class names.
	 * @return array
	 */
	public function add_woocommerce_analytics_module( $modules ) {
		if ( is_array( $modules ) && ! in_array( WooCommerce_Analytics_Module::class, $modules, true ) ) {
			$modules[] = WooCommerce_Analytics_Module::class;
		}

		return $modules;
	}

	/**
	 * Jetpack Sync module configuration.
	 *
	 * @return array Jetpack Sync config array.
	 */
	private function get_jetpack_sync_config(): array {
		$jetpack_sync_modules = array_keys(
			array_filter(
				array(
					WooCommerce_Analytics_Module::class => true,
					Meta_Module::class                  => true,
					Posts_Module::class                 => true,
					Terms_Module::class                 => true,
					Term_Relationships_Module::class    => true,
				)
			)
		);

		return array_merge_recursive(
			Data_Settings::MUST_SYNC_DATA_SETTINGS,
			array(
				'jetpack_sync_modules'             => $jetpack_sync_modules,
				'jetpack_sync_options_whitelist'   => array(
					'woocommerce_custom_orders_table_enabled', // Required for HPOS checksums.
					'woocommerce_excluded_report_order_statuses', // Required for generating analytics reports.
					'woocommerce_date_type', // Date used to determine the date range for analytics reports.
				),
				'jetpack_sync_constants_whitelist' => array(
					// Syncing this triggers WPCom to provision the WC Analytics tables (WOOA7S-1643).
					// WC_ANALYTICS_VERSION is omitted: only woocommerce-analytics defines it, so a PA-only store would sync null.
					'JETPACK_PREMIUM_ANALYTICS__VERSION',
				),
			)
		);
	}

	/**
	 * Expand full sync config with module required by WooCommerce Analytics if not already present.
	 *
	 * @param array $config The current full sync configuration.
	 * @return array The modified full sync configuration.
	 */
	public function expand_full_sync_config( array $config ): array {
		if ( ! $this->can_site_sync_orders() ) {
			return $config;
		}

		// Let's ensure Terms and Term_Relationships will always get synced before Posts during Full Sync.
		if ( isset( $config['posts'] ) ) {
			unset( $config['posts'] );
			$config += array( 'posts' => 1 );
		}

		if ( ! isset( $config['woocommerce_analytics'] ) ) {
			$config = array( 'woocommerce_analytics' => 1 ) + $config;
		}

		return $config;
	}

	/**
	 * Adds the order stats table to the checksum allowed tables.
	 *
	 * @param array $tables The current checksum allowed tables.
	 * @return array The modified checksum allowed tables.
	 */
	public function add_order_stats_to_checksum( array $tables ): array {
		if ( ! $this->can_site_sync_orders() ) {
			return $tables;
		}

		global $wpdb;
		$order_stats_checksum_table = array(
			'wc_order_stats'          => array(
				'table'                     => "{$wpdb->prefix}wc_order_stats",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id' ),
				'checksum_fields'           => array( 'date_paid', 'date_completed', 'total_sales' ),
				'checksum_text_fields'      => array( 'status' ),
				'is_table_enabled_callback' => function () {
					return false !== JetpackSyncModules::get_module( 'woocommerce_analytics' );
				},
			),
			'wc_order_product_lookup' => array(
				'table'                     => "{$wpdb->prefix}wc_order_product_lookup",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id', 'order_item_id' ),
				'checksum_fields'           => array( 'product_id', 'variation_id', 'product_qty', 'product_net_revenue', 'date_created' ),
				'is_table_enabled_callback' => function () {
					return false !== JetpackSyncModules::get_module( 'woocommerce_analytics' );
				},
			),
			'wc_order_coupon_lookup'  => array(
				'table'                     => "{$wpdb->prefix}wc_order_coupon_lookup",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id', 'coupon_id' ),
				'checksum_fields'           => array( 'discount_amount', 'date_created' ),
				'is_table_enabled_callback' => function () {
					return false !== JetpackSyncModules::get_module( 'woocommerce_analytics' );
				},
			),
			'wc_order_tax_lookup'     => array(
				'table'                     => "{$wpdb->prefix}wc_order_tax_lookup",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id', 'tax_rate_id' ),
				'checksum_fields'           => array( 'order_tax', 'total_tax', 'shipping_tax', 'date_created' ),
				'is_table_enabled_callback' => function () {
					return false !== JetpackSyncModules::get_module( 'woocommerce_analytics' );
				},
			),
		);
		return array_merge( $tables, $order_stats_checksum_table );
	}

	/**
	 * Add WC Analytics post meta to Sync's post meta whitelist.
	 * Any changes to these meta will be synced to WordPress.com.
	 *
	 * @param array $whitelist Existing post meta whitelist.
	 * @return array Updated post meta whitelist.
	 */
	public function add_meta_to_sync_post_meta_whitelist( array $whitelist ): array {
		return array_merge( self::$postmeta_to_sync, $whitelist );
	}
}
