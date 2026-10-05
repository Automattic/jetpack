<?php
/**
 * The WooCommerce section of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use function Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance;
use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the WooCommerce section and its default layout.
 *
 * The package decides nothing about who gets the section: the Jetpack plugin calls `init()`
 * outside the WordPress.com platform, jetpack-mu-wpcom calls the registrant on Simple and Atomic.
 * The section registers when the dashboard's registry hydrates. Its widgets still belong to the
 * dashboard package.
 *
 * @since 0.1.0-alpha
 */
class Analytics_Dashboard {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Namespaced section identifier. Its slug, `store`, keys the section's URL and stored layouts.
	 */
	const SECTION_ID = 'woocommerce-analytics/store';

	/**
	 * Registry action of the dashboard package.
	 */
	const REGISTER_SECTIONS_ACTION = 'jetpack_premium_analytics_register_dashboard_sections';

	/**
	 * Hook the registrant on the dashboard's section registry.
	 *
	 * Priority 20, after the dashboard package's own registrant: an older package that still
	 * registers the section itself is found by slug and left alone.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( self::REGISTER_SECTIONS_ACTION, array( __CLASS__, 'register_section' ), 20 );
	}

	/**
	 * Register the WooCommerce section unless another owner already holds the `store` slug.
	 *
	 * Also skipped when the dashboard's widget contract moved past this build.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return void
	 */
	public static function register_section( $registry ) {
		if ( self::widget_contract_moved_on() || self::dashboard_has_section_slug( $registry, DASHBOARD_NAME, 'store' ) ) {
			return;
		}

		$is_available = function_exists( 'Automattic\\Jetpack\\PremiumAnalytics\\is_store_dashboard_section_available' )
			? 'Automattic\\Jetpack\\PremiumAnalytics\\is_store_dashboard_section_available'
			: '__return_false';

		register_dashboard_section(
			DASHBOARD_NAME,
			self::SECTION_ID,
			array(
				'label'          => __( 'WooCommerce', 'jetpack-woocommerce-stats-pkg' ),
				'order'          => 40,
				'is_available'   => $is_available,
				// Nothing backfills historical orders to WordPress.com but the analytics full sync.
				'requires_sync'  => true,
				'default_layout' => array( __CLASS__, 'get_default_layout' ),
			)
		);
	}

	/**
	 * The default layout of the WooCommerce section.
	 *
	 * Every instance still names a type the dashboard package builds.
	 *
	 * @return array[] Widget instances, as `get_dashboard_default_widget_instance()` builds them.
	 */
	public static function get_default_layout() {
		return array(
			get_dashboard_default_widget_instance( 'default-store-performance-widget-instance', 'jpa/store-performance', 0, 2, 1 ),
			get_dashboard_default_widget_instance( 'default-total-sales-over-time-widget-instance', 'jpa/total-sales-over-time', 1, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-conversion-rate-widget-instance', 'jpa/conversion-rate', 2, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-orders-over-time-widget-instance', 'jpa/orders-over-time', 3, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-average-order-value-widget-instance', 'jpa/average-order-value', 4, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-top-performing-products-widget-instance', 'jpa/top-performing-products', 5, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-new-vs-returning-customer-widget-instance', 'jpa/new-vs-returning-customer', 6, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-payment-status-widget-instance', 'jpa/payment-status', 7, 1, 1 ),
			get_dashboard_default_widget_instance( 'default-orders-fulfillment-widget-instance', 'jpa/orders-fulfillment', 8, 1, 1 ),
		);
	}

	/**
	 * Whether the dashboard's widget contract moved to a major this package was not built against.
	 *
	 * Undefined is not a mismatch: the sections REST route hydrates the section registry before
	 * the dashboard loads the file that defines the version.
	 *
	 * @return bool
	 */
	private static function widget_contract_moved_on() {
		return defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' )
			&& version_compare( \Automattic\Jetpack\PremiumAnalytics\WIDGET_API_VERSION, '2', '>=' );
	}

	/**
	 * Whether a section with the slug is registered on the dashboard.
	 *
	 * Reads the registry through the slug lookup when the package offers it, and through the full
	 * list otherwise: the package and this one ship on different cadences.
	 *
	 * @param object $registry       The registry being hydrated.
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $slug           Section slug.
	 * @return bool
	 */
	private static function dashboard_has_section_slug( $registry, $dashboard_name, $slug ) {
		if ( method_exists( $registry, 'get_registered_by_slug' ) ) {
			return null !== $registry->get_registered_by_slug( $dashboard_name, $slug );
		}

		foreach ( $registry->get_all_registered( $dashboard_name ) as $section ) {
			if ( $section->slug === $slug ) {
				return true;
			}
		}

		return false;
	}
}
