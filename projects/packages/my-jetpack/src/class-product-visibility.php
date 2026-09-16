<?php
/**
 * Resolves which My Jetpack products a site lists, and which of those a host has pinned.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

/**
 * The Products page half of the host visibility contract.
 *
 * Admin_Menu answers the same question for the wp-admin sidebar; this answers it for the
 * My Jetpack Products page. The two surfaces list different sets — Settings and Modules have
 * no card, and the bundles have cards but no menu item — so they take separate filters and
 * share the state vocabulary rather than the map.
 */
class Product_Visibility {

	/**
	 * Visibility state: list the product, and take the site owner's control of it away.
	 *
	 * @var string
	 */
	const STATE_PINNED = 'pinned';

	/**
	 * Builds the product => state map and hands it to hosts to amend.
	 *
	 * @return array Map of My Jetpack product slug to state.
	 */
	public static function get_states() {
		$states = array();

		foreach ( array_keys( Products::get_products_classes() ) as $product_slug ) {
			$states[ $product_slug ] = Admin_Menu::VISIBILITY_DEFAULT;
		}

		/**
		 * Filters which Jetpack products appear on the My Jetpack Products page.
		 *
		 * Each product resolves to one of three states: 'default' lists it, 'hidden' keeps it
		 * off the page, and 'pinned' lists it and refuses any attempt to deactivate it.
		 *
		 * The whole map is passed at once so that two mu-plugins setting different keys merge
		 * rather than clobber each other. A host names only the products it cares about.
		 *
		 * The sidebar's 'visible' has no counterpart yet: My Jetpack's own listing rules still
		 * live in the JS that renders the page, so there is nothing here for it to override.
		 * See JETPACK-2382.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $states Map of My Jetpack product slug to state.
		 */
		$states = apply_filters( 'jetpack_my_jetpack_product_visibility', $states );

		return is_array( $states ) ? $states : array();
	}

	/**
	 * Whether a product should appear on the Products page.
	 *
	 * @param string $product_slug A My Jetpack product slug.
	 * @return bool
	 */
	public static function is_listed( $product_slug ) {
		return Admin_Menu::VISIBILITY_HIDDEN !== self::get_state( $product_slug );
	}

	/**
	 * Whether a host has taken the site owner's control of a product's activation away.
	 *
	 * @param string $product_slug A My Jetpack product slug.
	 * @return bool
	 */
	public static function is_pinned( $product_slug ) {
		return self::STATE_PINNED === self::get_state( $product_slug );
	}

	/**
	 * Reads one product's state, defaulting to My Jetpack's own rules.
	 *
	 * @param string $product_slug A My Jetpack product slug.
	 * @return string
	 */
	private static function get_state( $product_slug ) {
		$states = self::get_states();

		return $states[ $product_slug ] ?? Admin_Menu::VISIBILITY_DEFAULT;
	}
}
