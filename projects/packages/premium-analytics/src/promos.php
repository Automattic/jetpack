<?php
/**
 * Promos: the registry helpers and the gates a registered promo passes before it shows.
 *
 * Internal to this package. The dashboard renders what is registered here, so there is no
 * versioned contract to hold.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/class-promo.php';
require_once __DIR__ . '/class-promo-registry.php';

/**
 * Registers a promo.
 *
 * @internal
 *
 * @since $$next-version$$
 *
 * @param string $slug Promo identifier, namespaced like `acme/offer`.
 * @param array  $args Optional. Promo arguments.
 * @return Promo|false The registered promo on success, or false on failure.
 */
function register_promo( $slug, $args = array() ) {
	return Promo_Registry::get_instance()->register( $slug, $args );
}

/**
 * Retrieves the promos to show, ordered by `order` and then `slug`.
 *
 * @since $$next-version$$
 *
 * @return Promo[] Ordered list of available promos.
 */
function get_available_promos() {
	return Promo_Registry::get_instance()->remember_available( __NAMESPACE__ . '\\compute_available_promos' );
}

/**
 * Applies the gates to the registered promos. Call `get_available_promos()` instead, which keeps
 * the result for the rest of the request so no promo's rule runs twice.
 *
 * @since $$next-version$$
 *
 * @return Promo[] Ordered list of available promos.
 */
function compute_available_promos() {
	/** This filter is documented in projects/plugins/jetpack/_inc/lib/admin-pages/class-jetpack-redux-state-helper.php */
	if ( ! apply_filters( 'jetpack_show_promotions', true ) ) {
		return array();
	}

	$promos = array_values(
		array_filter(
			Promo_Registry::get_instance()->get_all_registered(),
			static function ( Promo $promo ) {
				// The Stats roles setting can let an editor or an author open the dashboard, and an
				// upgrade is not theirs to buy.
				return current_user_can( $promo->capability ) && $promo->is_available();
			}
		)
	);

	usort(
		$promos,
		static function ( Promo $a, Promo $b ) {
			return array( $a->order, $a->slug ) <=> array( $b->order, $b->slug );
		}
	);

	return $promos;
}

/**
 * Configures the promos. The flag registers earlier, at package boot.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_promos() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_promos_script_data', 20 );
}

/**
 * Publishes the available promos as `premium_analytics.promos` in the script data.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_promos_script_data( array $data ): array {
	if ( ! Analytics::renders_dashboard() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['promos'] = array_map(
		static function ( Promo $promo ) {
			return $promo->to_array();
		},
		get_available_promos()
	);

	return $data;
}
