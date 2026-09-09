<?php
/**
 * Premium Analytics glue for the shared WooCommerce Analytics sync module.
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
	 * FQCN of the Analytics module shipped by the standalone WooCommerce Analytics plugin.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	const ANALYTICS_PLUGIN_MODULE_FQCN = 'Automattic\\WooCommerce\\Analytics\\Internal\\Jetpack\\Sync\\Modules\\Analytics';

	/**
	 * Checksum tables the shared module registers; audited only once the site can sync orders.
	 *
	 * @var string[]
	 */
	private const ANALYTICS_CHECKSUM_TABLES = array(
		'wc_order_stats',
		'wc_order_product_lookup',
		'wc_order_coupon_lookup',
		'wc_order_tax_lookup',
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

		// plugins_loaded priority 1: every plugin has loaded for the WooCommerce guard, and the
		// Config constructed in configure_sync() still gets its priority 2 handler in this cycle.
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

		// Runs last so another plugin's Analytics module, when present, is already in the list.
		add_filter( 'jetpack_sync_modules', array( $this, 'add_woocommerce_analytics_module' ), PHP_INT_MAX );
		add_filter( 'jetpack_full_sync_config', array( $this, 'expand_full_sync_config' ) );
		add_filter( 'jetpack_sync_checksum_allowed_tables', array( $this, 'gate_analytics_checksum_tables' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_meta_to_sync_post_meta_whitelist' ) );

		( new Config() )->ensure( 'sync', $this->get_jetpack_sync_config() );
	}

	/**
	 * Jetpack Sync module configuration.
	 *
	 * MUST_SYNC_DATA_SETTINGS is merged in because Data_Settings falls back to the full default
	 * whitelist for any filter a consumer leaves out, which would widen standalone sites.
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
				// Listed explicitly so the contract does not depend on which other Sync modules load.
				'jetpack_sync_options_whitelist'   => array(
					'woocommerce_custom_orders_table_enabled', // Required for HPOS checksums.
					'woocommerce_excluded_report_order_statuses', // Required for generating analytics reports.
					'woocommerce_date_type', // Date used to determine the date range for analytics reports.
				),
				'jetpack_sync_constants_whitelist' => array(
					// Syncing it makes WPCOM provision the WC Analytics tables (WOOA7S-1643). WC_ANALYTICS_VERSION
					// belongs to the standalone plugin and would only sync null on a PA-only store.
					'JETPACK_PREMIUM_ANALYTICS__VERSION',
				),
			)
		);
	}

	/**
	 * Add the shared module unless the standalone plugin's module is present.
	 *
	 * @param array|mixed $modules Current Sync module class names.
	 * @return array|mixed Updated Sync module class names.
	 */
	public function add_woocommerce_analytics_module( $modules ) {
		// An emptied list is a kill switch (Jetpack's uninstaller uses one); leave it alone.
		if ( ! is_array( $modules ) || empty( $modules ) ) {
			return $modules;
		}

		if ( in_array( self::ANALYTICS_PLUGIN_MODULE_FQCN, $modules, true ) ) {
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
	 * Keep the Analytics checksum tables out of audits until the site can sync orders.
	 *
	 * @param array $tables Current checksum table configuration.
	 * @return array Updated checksum table configuration.
	 */
	public function gate_analytics_checksum_tables( array $tables ): array {
		if ( $this->can_site_sync_orders() ) {
			return $tables;
		}

		return array_diff_key( $tables, array_flip( self::ANALYTICS_CHECKSUM_TABLES ) );
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
