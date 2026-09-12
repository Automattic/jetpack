<?php
/**
 * Resolves whether a Jetpack admin menu item's feature is active.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Modules;

/**
 * The activation half of the sidebar visibility contract.
 *
 * Admin_Menu owns when the question is asked and what a host may do with the answer; this
 * class owns the answer itself, because the product classes it reads live here. A menu item
 * declares its gate at registration and this resolves it, so a product's sidebar entry and
 * its My Jetpack card cannot disagree about whether the product is on.
 */
class Menu_Visibility {

	/**
	 * Registers this class as Admin_Menu's visibility resolver.
	 *
	 * @return void
	 */
	public static function init() {
		Admin_Menu::set_visibility_resolver( array( __CLASS__, 'resolve' ) );
	}

	/**
	 * Answers whether a menu item's declared gate is satisfied.
	 *
	 * @param array $args The item's visibility declaration, as passed to Admin_Menu::add_menu().
	 * @return bool|null True or false, or null when the gate cannot be resolved here.
	 */
	public static function resolve( $args ) {
		if ( ! empty( $args['product'] ) ) {
			return self::is_product_active( $args['product'] );
		}

		if ( ! empty( $args['module'] ) ) {
			/*
			 * A module counts as active only while it is also available, which off the Jetpack
			 * plugin means a standalone plugin declaring it through
			 * `jetpack_get_available_standalone_modules`. Matches Product::is_module_active(),
			 * so the two gate types cannot disagree about the same module.
			 */
			return ( new Modules() )->is_active( $args['module'] );
		}

		return null;
	}

	/**
	 * Whether a My Jetpack product is active on this site.
	 *
	 * The product classes already span both gate types the sidebar needs: Module_Product::is_active()
	 * checks the module and Hybrid_Product::is_active() checks the standalone plugin. Menu visibility
	 * reads them rather than growing a second source of truth beside them.
	 *
	 * No connection check is applied here. Whatever a product already derives from connection
	 * state still applies through its own plan lookup; this adds nothing on top, which is what
	 * makes disconnected behavior uniform instead of depending on where a menu item registers.
	 *
	 * @param string $product_slug A My Jetpack product slug.
	 * @return bool|null Null when no product class is registered under that slug.
	 */
	private static function is_product_active( $product_slug ) {
		$product_class = Products::get_product_class( $product_slug );

		if ( ! $product_class ) {
			return null;
		}

		return (bool) $product_class::is_active();
	}
}
