<?php
/**
 * Opt-in registration for the WooCommerce Analytics sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Modules\Meta as Meta_Module;
use Automattic\Jetpack\Sync\Modules\Posts as Posts_Module;
use Automattic\Jetpack\Sync\Modules\Term_Relationships as Term_Relationships_Module;
use Automattic\Jetpack\Sync\Modules\Terms as Terms_Module;
use Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics as WooCommerce_Analytics_Module;
use Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics_Utilities;

/**
 * Registers the WooCommerce Analytics sync module and its supporting filters.
 *
 * The `woocommerce_analytics` module is intentionally NOT part of the default
 * module list: it syncs high-volume order/lookup-table data that most sites do
 * not need. Consumer packages (Premium Analytics, WooCommerce AI, ...) opt in by
 * calling {@see register()} during bootstrap and, once WooCommerce is loaded,
 * passing {@see get_data_settings()} into their own
 * `Config::ensure( 'sync', ... )` call.
 */
class WooCommerce_Analytics_Settings {

	use WooCommerce_Analytics_Utilities;

	/**
	 * FQCN of the Analytics sync module shipped by the standalone
	 * `woocommerce-analytics` plugin. Both that class and the package module return
	 * `name() === 'woocommerce_analytics'`. Jetpack Sync deduplicates initialized
	 * modules by that public name, keeping the last contribution. When the
	 * standalone plugin has already contributed its module we stand down so the
	 * legacy implementation remains authoritative during migration.
	 *
	 * Kept as a string literal (rather than `::class`) so this file can be reasoned
	 * about without the standalone plugin being loaded.
	 *
	 * @var string
	 */
	const ANALYTICS_PLUGIN_MODULE_FQCN = 'Automattic\\WooCommerce\\Analytics\\Internal\\Jetpack\\Sync\\Modules\\Analytics';

	/**
	 * FQCN of the Analytics sync module shipped by WooCommerce AI.
	 *
	 * @var string
	 */
	const WOO_AI_MODULE_FQCN = 'WooCommerce\\AI\\Sync\\Modules\\Analytics';

	/**
	 * FQCN of the interim Analytics sync module shipped by Premium Analytics.
	 *
	 * @var string
	 */
	const PREMIUM_ANALYTICS_MODULE_FQCN = 'Automattic\\Jetpack\\PremiumAnalytics\\Sync\\WooCommerce_Analytics_Module';

	/**
	 * Legacy implementations that expose the same `woocommerce_analytics` module.
	 *
	 * @var string[]
	 */
	const LEGACY_MODULE_FQCNS = array(
		self::ANALYTICS_PLUGIN_MODULE_FQCN,
		self::WOO_AI_MODULE_FQCN,
		self::PREMIUM_ANALYTICS_MODULE_FQCN,
	);

	/**
	 * Options the module needs synced to WPCOM.
	 *
	 * @var array
	 */
	const OPTIONS_TO_SYNC = array(
		'woocommerce_custom_orders_table_enabled', // Required for HPOS checksums.
		'woocommerce_excluded_report_order_statuses', // Required for generating analytics reports.
		'woocommerce_date_type', // Date used to determine the date range for analytics reports.
	);

	/**
	 * Whether register() has already scheduled the hookups.
	 *
	 * @var bool
	 */
	private static $registered = false;

	/**
	 * Opt in to the WooCommerce Analytics sync module. Idempotent.
	 *
	 * Schedules the Sync hookups on plugins_loaded; the actual registration is a
	 * no-op unless WooCommerce is active (see {@see configure()}).
	 *
	 * @return void
	 */
	public static function register(): void {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		$instance = new self();

		// Defer the WooCommerce-active guard and all hookups to plugins_loaded so they
		// run after every plugin (including WooCommerce) has loaded, regardless of
		// plugin load order. Priority 1 lets a consumer-constructed Jetpack Config run
		// its own on_plugins_loaded (priority 2) handler in the same cycle.
		if ( did_action( 'plugins_loaded' ) ) {
			$instance->configure();
		} else {
			add_action( 'plugins_loaded', array( $instance, 'configure' ), 1 );
		}
	}

	/**
	 * Whether WooCommerce is active in the current request.
	 *
	 * Public so consumers (e.g. sync milestone trackers) can decide which full sync
	 * matters: the `woocommerce_analytics` module when WooCommerce is active, or the
	 * generic initial full sync when it is not.
	 *
	 * @return bool
	 */
	public static function is_woocommerce_active(): bool {
		return class_exists( 'WooCommerce' ) || function_exists( 'WC' );
	}

	/**
	 * Register the Jetpack Sync filters, when WooCommerce is active.
	 *
	 * No-op unless WooCommerce is active, since the module relies on WooCommerce
	 * runtime symbols (WC_Order, the wc_order_stats table, OrderUtil, etc.).
	 *
	 * @return void
	 */
	public function configure(): void {
		if ( ! self::is_woocommerce_active() ) {
			return;
		}

		// PHP_INT_MAX so we observe the fully-built module list (in particular, any
		// contribution by the standalone `woocommerce-analytics` plugin) before
		// deciding whether to register the package module.
		add_filter( 'jetpack_sync_modules', array( $this, 'add_woocommerce_analytics_module' ), PHP_INT_MAX );
		add_filter( 'jetpack_full_sync_config', array( $this, 'expand_full_sync_config' ) );
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'add_order_stats_to_checksum' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_meta_to_sync_post_meta_whitelist' ) );
		add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_options_to_sync_options_whitelist' ) );
	}

	/**
	 * Sync data settings for the WooCommerce Analytics module.
	 *
	 * Consumers merge this into their `Config::ensure( 'sync', ... )` call. The sync
	 * package intentionally does not call `Config::ensure()` itself: connection
	 * bootstrap (and the jetpack-config dependency) belongs to the consumer.
	 * Call this after confirming WooCommerce is active.
	 *
	 * @return array Jetpack Sync data settings.
	 */
	public static function get_data_settings(): array {
		return array_merge_recursive(
			Data_Settings::MUST_SYNC_DATA_SETTINGS,
			array(
				'jetpack_sync_modules'           => array(
					WooCommerce_Analytics_Module::class,
					Meta_Module::class,
					Posts_Module::class,
					Terms_Module::class,
					Term_Relationships_Module::class,
				),
				'jetpack_sync_options_whitelist' => self::OPTIONS_TO_SYNC,
			)
		);
	}

	/**
	 * Add the WooCommerce Analytics module to the list of Jetpack Sync modules.
	 *
	 * Additive: appends to whatever module list is already configured rather than
	 * replacing it. When a legacy consumer has already contributed its own module,
	 * removes the shared class that Config data settings may have added earlier.
	 *
	 * @param array|mixed $modules The current list of sync module class names.
	 * @return array|mixed
	 */
	public function add_woocommerce_analytics_module( $modules ) {
		if ( ! is_array( $modules ) ) {
			return $modules;
		}

		if ( array_intersect( self::LEGACY_MODULE_FQCNS, $modules ) ) {
			return array_values( array_diff( $modules, array( WooCommerce_Analytics_Module::class ) ) );
		}

		if ( ! in_array( WooCommerce_Analytics_Module::class, $modules, true ) ) {
			$modules[] = WooCommerce_Analytics_Module::class;
		}

		return $modules;
	}

	/**
	 * Expand full sync config with modules required by WooCommerce Analytics if not already present.
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
	 * Adds the order stats and lookup tables to the checksum allowed tables.
	 *
	 * @param array $tables The current checksum allowed tables.
	 * @return array The modified checksum allowed tables.
	 */
	public function add_order_stats_to_checksum( array $tables ): array {
		if ( ! $this->can_site_sync_orders() ) {
			return $tables;
		}

		global $wpdb;
		$is_table_enabled = function () {
			return false !== Modules::get_module( 'woocommerce_analytics' );
		};

		$order_stats_checksum_tables = array(
			'wc_order_stats'          => array(
				'table'                     => "{$wpdb->prefix}wc_order_stats",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id' ),
				'checksum_fields'           => array( 'date_paid', 'date_completed', 'total_sales' ),
				'checksum_text_fields'      => array( 'status' ),
				'is_table_enabled_callback' => $is_table_enabled,
			),
			'wc_order_product_lookup' => array(
				'table'                     => "{$wpdb->prefix}wc_order_product_lookup",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id', 'order_item_id' ),
				'checksum_fields'           => array( 'product_id', 'variation_id', 'product_qty', 'product_net_revenue', 'date_created' ),
				'is_table_enabled_callback' => $is_table_enabled,
			),
			'wc_order_coupon_lookup'  => array(
				'table'                     => "{$wpdb->prefix}wc_order_coupon_lookup",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id', 'coupon_id' ),
				'checksum_fields'           => array( 'discount_amount', 'date_created' ),
				'is_table_enabled_callback' => $is_table_enabled,
			),
			'wc_order_tax_lookup'     => array(
				'table'                     => "{$wpdb->prefix}wc_order_tax_lookup",
				'range_field'               => 'order_id',
				'key_fields'                => array( 'order_id', 'tax_rate_id' ),
				'checksum_fields'           => array( 'order_tax', 'total_tax', 'shipping_tax', 'date_created' ),
				'is_table_enabled_callback' => $is_table_enabled,
			),
		);

		return array_merge( $tables, $order_stats_checksum_tables );
	}

	/**
	 * Add the options needed by WooCommerce Analytics to Sync's options whitelist.
	 *
	 * Also covered by {@see get_data_settings()} for consumers using Config::ensure();
	 * the filter keeps filter-only consumers (whose host handles the ensure) working.
	 *
	 * @param array $whitelist Existing options whitelist.
	 * @return array Updated options whitelist.
	 */
	public function add_options_to_sync_options_whitelist( array $whitelist ): array {
		return array_values( array_unique( array_merge( $whitelist, self::OPTIONS_TO_SYNC ) ) );
	}

	/**
	 * Add the product meta needed by WooCommerce Analytics reports to Sync's post meta whitelist.
	 *
	 * @param array $whitelist Existing post meta whitelist.
	 * @return array Updated post meta whitelist.
	 */
	public function add_meta_to_sync_post_meta_whitelist( array $whitelist ): array {
		return array_merge(
			array(
				'_stock',
				'_stock_quantity',
				'_cogs_total_value',
				'_global_unique_id',
			),
			$whitelist
		);
	}
}
