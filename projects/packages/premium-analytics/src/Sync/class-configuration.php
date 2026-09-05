<?php
/**
 * Premium Analytics glue for the shared WooCommerce Analytics sync module.
 *
 * The `woocommerce_analytics` module, its helpers, checksum tables, and minimum
 * data requirements live in the jetpack-sync package. This class owns the
 * consumer-specific registration, full-sync policy, Config bootstrap, package
 * version signal, legacy-module arbitration, and Bookings post meta whitelist.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack\Sync\Modules\Meta as Meta_Module;
use Automattic\Jetpack\Sync\Modules\Posts as Posts_Module;
use Automattic\Jetpack\Sync\Modules\Term_Relationships as Term_Relationships_Module;
use Automattic\Jetpack\Sync\Modules\Terms as Terms_Module;
use Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics as WooCommerce_Analytics_Module;
use Automattic\WooCommerce\Utilities\FeaturesUtil;

defined( 'ABSPATH' ) || exit;

/**
 * Opts in to the shared WooCommerce Analytics sync module and registers the
 * Premium Analytics-specific sync configuration.
 */
class Configuration {

	/**
	 * Register after plugin bootstrap and before Jetpack Sync initializes modules.
	 *
	 * @var int
	 */
	const MODULE_FILTER_REGISTRATION_PRIORITY = 89;

	/**
	 * FQCN of the Analytics module shipped by the standalone plugin.
	 *
	 * @var string
	 */
	const ANALYTICS_PLUGIN_MODULE_FQCN = 'Automattic\\WooCommerce\\Analytics\\Internal\\Jetpack\\Sync\\Modules\\Analytics';

	/**
	 * FQCN of the Analytics module shipped by WooCommerce AI.
	 *
	 * @var string
	 */
	const WOO_AI_MODULE_FQCN = 'WooCommerce\\AI\\Sync\\Modules\\Analytics';

	/**
	 * FQCN of the interim Analytics module from older Premium Analytics versions.
	 *
	 * @var string
	 */
	const PREMIUM_ANALYTICS_MODULE_FQCN = 'Automattic\\Jetpack\\PremiumAnalytics\\Sync\\WooCommerce_Analytics_Module';

	/**
	 * Existing implementations that remain authoritative when present.
	 *
	 * @var string[]
	 */
	const LEGACY_MODULE_FQCNS = array(
		self::ANALYTICS_PLUGIN_MODULE_FQCN,
		self::WOO_AI_MODULE_FQCN,
		self::PREMIUM_ANALYTICS_MODULE_FQCN,
	);

	/**
	 * Bookings post meta to add to Sync's post meta whitelist. Bookings are synced
	 * via the Posts + Meta modules; there is no dedicated bookings sync module.
	 *
	 * Product meta needed by analytics reports is whitelisted by the shared module.
	 *
	 * @static
	 * @var array
	 */
	private static $postmeta_to_sync = array(
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
	 * Entry point called from Analytics::init(). Schedules the Sync hookups on
	 * plugins_loaded; the actual registration is a no-op unless WooCommerce is active
	 * (see {@see configure_sync()}).
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
	 * Register the Jetpack Sync filters and ensure the Sync feature when WooCommerce
	 * is active.
	 *
	 * @return void
	 */
	public function configure_sync(): void {
		if ( ! self::is_woocommerce_active() ) {
			return;
		}

		// Woo AI registers its module filter during plugins_loaded at priority 10.
		// Register ours later so its PHP_INT_MAX callback can arbitrate the complete list.
		if ( doing_action( 'plugins_loaded' ) ) {
			add_action( 'plugins_loaded', array( $this, 'register_module_filter' ), self::MODULE_FILTER_REGISTRATION_PRIORITY );
		} else {
			$this->register_module_filter();
		}

		add_filter( 'jetpack_full_sync_config', array( $this, 'expand_full_sync_config' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_meta_to_sync_post_meta_whitelist' ) );

		( new Config() )->ensure( 'sync', $this->get_jetpack_sync_config() );
	}

	/**
	 * Register the final module-list arbitration callback.
	 *
	 * @return void
	 */
	public function register_module_filter(): void {
		add_filter( 'jetpack_sync_modules', array( $this, 'add_woocommerce_analytics_module' ), PHP_INT_MAX );
	}

	/**
	 * Jetpack Sync module configuration.
	 *
	 * Merging MUST_SYNC_DATA_SETTINGS keeps the narrow option and callable whitelists on
	 * sites where Premium Analytics is the only Sync consumer; for any filter left out here,
	 * Data_Settings falls back to the full default whitelist instead.
	 *
	 * @return array Jetpack Sync config array.
	 */
	private function get_jetpack_sync_config(): array {
		return array_merge_recursive(
			Data_Settings::MUST_SYNC_DATA_SETTINGS,
			array(
				'jetpack_sync_modules'             => array(
					WooCommerce_Analytics_Module::class,
					Meta_Module::class,
					Posts_Module::class,
					Terms_Module::class,
					Term_Relationships_Module::class,
				),
				// The shared and WooCommerce modules also append these; listing them keeps the
				// contract explicit and independent of module load order.
				'jetpack_sync_options_whitelist'   => array(
					'woocommerce_custom_orders_table_enabled', // Required for HPOS checksums.
					'woocommerce_excluded_report_order_statuses', // Required for generating analytics reports.
					'woocommerce_date_type', // Date used to determine the date range for analytics reports.
				),
				'jetpack_sync_constants_whitelist' => array(
					// Syncing this triggers WPCom to provision the WC Analytics tables. Defined by the
					// plugin at load (double underscore, per the JETPACK__VERSION convention). (WOOA7S-1643)
					// WC_ANALYTICS_VERSION is intentionally omitted: it is defined and whitelisted by the
					// standalone woocommerce-analytics plugin, and on a PA-only store would only sync null.
					'JETPACK_PREMIUM_ANALYTICS__VERSION',
				),
			)
		);
	}

	/**
	 * Add the shared module unless another Analytics implementation is present.
	 *
	 * @param array|mixed $modules Current Sync module class names.
	 * @return array|mixed Updated Sync module class names.
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
	 * Add the Analytics module to full sync when the site can sync orders.
	 *
	 * @param array $config Current full-sync configuration.
	 * @return array Updated full-sync configuration.
	 */
	public function expand_full_sync_config( array $config ): array {
		if ( ! $this->can_site_sync_orders() ) {
			return $config;
		}

		// Terms and term relationships must be synced before posts.
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
	 * Whether the site may sync WooCommerce order data.
	 *
	 * @return bool
	 */
	protected function can_site_sync_orders(): bool {
		return $this->is_order_attribution_enabled();
	}

	/**
	 * Whether WooCommerce order attribution is enabled.
	 *
	 * @return bool
	 */
	private function is_order_attribution_enabled(): bool {
		// @phan-suppress-next-line PhanUndeclaredClassReference -- Missing from older WooCommerce stubs.
		if ( ! class_exists( FeaturesUtil::class ) ) {
			return false;
		}

		try {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Missing from older WooCommerce stubs.
			$is_enabled = FeaturesUtil::feature_is_enabled( 'order_attribution' );

			// Account for a feature-settings form submission before WooCommerce updates
			// the value returned by feature_is_enabled().
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			if ( isset( $_GET['section'] ) && 'features' === $_GET['section'] ) {
				// phpcs:disable WordPress.Security.NonceVerification.Missing
				if ( isset( $_POST['woocommerce_feature_order_attribution_enabled'] ) ) {
					$posted_order_attribution = wc_clean( sanitize_text_field( wp_unslash( $_POST['woocommerce_feature_order_attribution_enabled'] ) ) );
					$is_enabled               = wc_string_to_bool( $posted_order_attribution );
				} elseif ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] ) {
					$is_enabled = false;
				}
				// phpcs:enable WordPress.Security.NonceVerification.Missing
			}
			// phpcs:enable WordPress.Security.NonceVerification.Recommended

			return $is_enabled;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Add Bookings post meta to Sync's post meta whitelist.
	 * Any changes to these meta will be synced to WordPress.com.
	 *
	 * @param array $whitelist Existing post meta whitelist.
	 * @return array Updated post meta whitelist.
	 */
	public function add_meta_to_sync_post_meta_whitelist( array $whitelist ): array {
		return array_merge( self::$postmeta_to_sync, $whitelist );
	}
}
