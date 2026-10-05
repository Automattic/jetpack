<?php
/**
 * The WooCommerce section of the Premium Analytics dashboard.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use function Automattic\Jetpack\PremiumAnalytics\register_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

/**
 * Registers the WooCommerce section.
 *
 * The package decides nothing about who gets the section: the Jetpack plugin calls `init()`
 * outside the WordPress.com platform, jetpack-mu-wpcom calls the registrant on Simple and Atomic.
 * The section registers when the dashboard's registry hydrates.
 *
 * @since 0.1.0-alpha
 */
class Analytics_Dashboard {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Namespaced section identifier. Its slug, `woocommerce`, keys the section's URL and stored layouts.
	 */
	const SECTION_ID = 'woocommerce-analytics/woocommerce';

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
	 * Register the WooCommerce section unless `woocommerce` or the older `store` slug is taken.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return void
	 */
	public static function register_section( $registry ) {
		if ( self::section_slug_is_taken( $registry ) ) {
			return;
		}

		$is_available = function_exists( 'Automattic\\Jetpack\\PremiumAnalytics\\is_store_dashboard_section_available' )
			? 'Automattic\\Jetpack\\PremiumAnalytics\\is_store_dashboard_section_available'
			: '__return_false';

		register_dashboard_section(
			DASHBOARD_NAME,
			self::SECTION_ID,
			array(
				'label'         => __( 'WooCommerce', 'jetpack-woocommerce-stats-pkg' ),
				'order'         => 40,
				'is_available'  => $is_available,
				// Nothing backfills historical orders to WordPress.com but the analytics full sync.
				'requires_sync' => true,
			)
		);
	}

	/**
	 * Whether this tab's slug, or the `store` slug an older package still registers, is taken.
	 *
	 * @param object $registry The section registry being hydrated.
	 * @return bool
	 */
	private static function section_slug_is_taken( $registry ) {
		foreach ( array( 'woocommerce', 'store' ) as $slug ) {
			if ( self::dashboard_has_section_slug( $registry, DASHBOARD_NAME, $slug ) ) {
				return true;
			}
		}

		return false;
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
