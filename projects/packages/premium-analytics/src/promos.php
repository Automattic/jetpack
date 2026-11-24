<?php
/**
 * Promo Slot API: the registry helpers and the gates a registered promo passes before it shows.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

require_once __DIR__ . '/class-promo.php';
require_once __DIR__ . '/class-promo-registry.php';

const PROMO_API_VERSION = '1.0.0';

const PROMO_PLACEMENTS = Promo_Registry::PLACEMENTS;

const PROMO_FLAG = 'jetpack-stats-promos';

/**
 * Registers a promo.
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
	if ( ! Feature_Flags::is_enabled( PROMO_FLAG ) ) {
		return array();
	}

	/**
	 * Filters whether promotions show at all.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $show_promotions Whether promotions show. Default true.
	 */
	if ( ! apply_filters( 'jetpack_show_promotions', true ) ) {
		return array();
	}

	$promos = array_filter(
		Promo_Registry::get_instance()->get_all_registered(),
		static function ( Promo $promo ) {
			return $promo->is_available();
		}
	);

	/**
	 * Filters the promos that passed the flag, the promotions switch and their own rule.
	 *
	 * @since $$next-version$$
	 *
	 * @param Promo[] $promos Available promos, as `$slug => $promo` pairs.
	 */
	$filtered = apply_filters( 'jetpack_premium_analytics_promos', $promos );

	// A closure here would take the hook docblock's @param with it (PhanCommentParamWithoutRealParam).
	$promos = array();
	if ( is_array( $filtered ) ) {
		foreach ( $filtered as $candidate ) {
			if ( $candidate instanceof Promo ) {
				$promos[] = $candidate;
			}
		}
	}

	usort(
		$promos,
		static function ( Promo $a, Promo $b ) {
			return array( $a->order, $a->slug ) <=> array( $b->order, $b->slug );
		}
	);

	return $promos;
}

/**
 * Registers the promo flag, off by default, and the hooks that publish promos to the dashboard.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_promos() {
	Feature_Flags::register(
		PROMO_FLAG,
		array(
			'default'     => false,
			'description' => 'Show promotional cards that other packages register into the Stats v2 dashboard, menu and Settings.',
			'owner'       => 'jetpack-stats',
		)
	);

	if ( file_exists( __DIR__ . '/promo-fixture.php' ) ) {
		require_once __DIR__ . '/promo-fixture.php';
		configure_promo_fixtures();
	}

	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_promos_script_data', 20 );
	add_filter( 'jetpack-premium-analytics-wp-admin_boot_dependencies', __NAMESPACE__ . '\\add_promo_modules_to_boot_deps' );
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

/**
 * Adds the available promos' render modules to the page import map as dynamic dependencies.
 *
 * @since $$next-version$$
 *
 * @param array $boot_dependencies Boot dependencies for the page.
 * @return array Updated boot dependencies.
 */
function add_promo_modules_to_boot_deps( $boot_dependencies ) {
	foreach ( get_available_promos() as $promo ) {
		if ( ! empty( $promo->render_module ) ) {
			$boot_dependencies[] = array(
				'import' => 'dynamic',
				'id'     => $promo->render_module,
			);
		}
	}

	return $boot_dependencies;
}
