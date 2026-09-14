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
 * declares its gate at registration and this resolves it from the same product class its
 * My Jetpack card reads.
 */
class Menu_Visibility {

	/**
	 * Gates already resolved this registration pass, keyed by type and slug.
	 *
	 * @var array<string, bool|null>
	 */
	private static $resolved = array();

	/**
	 * Registers this class as Admin_Menu's visibility resolver.
	 *
	 * @return void
	 */
	public static function init() {
		Admin_Menu::set_visibility_resolver( array( __CLASS__, 'resolve' ) );

		// Memoized answers last one registration pass, which is as long as they can stay true.
		add_action( 'admin_menu', array( __CLASS__, 'forget_resolved_gates' ), 0 );
		add_action( 'network_admin_menu', array( __CLASS__, 'forget_resolved_gates' ), 0 );
	}

	/**
	 * Drops the gates resolved during the previous registration pass.
	 *
	 * @return void
	 */
	public static function forget_resolved_gates() {
		self::$resolved = array();
	}

	/**
	 * Answers whether a menu item's declared gate is satisfied.
	 *
	 * Answers are memoized for one registration pass: resolving a product rebuilds the product
	 * class map and rescans the installed plugins, and the sidebar asks once per gated item.
	 *
	 * @param array $args The item's visibility declaration, as passed to Admin_Menu::add_menu().
	 * @return bool|null True or false, or null when the gate cannot be resolved here.
	 */
	public static function resolve( $args ) {
		if ( ! empty( $args['product'] ) ) {
			$key = 'product:' . $args['product'];

			if ( ! array_key_exists( $key, self::$resolved ) ) {
				self::$resolved[ $key ] = self::is_product_activated( $args['product'] );
			}

			return self::$resolved[ $key ];
		}

		if ( ! empty( $args['module'] ) ) {
			/*
			 * A module counts as active only while it is also available, which off the Jetpack
			 * plugin means a standalone plugin declaring it through
			 * `jetpack_get_available_standalone_modules`. Matches Product::is_module_active(),
			 * so the two gate types cannot disagree about the same module.
			 */
			$key = 'module:' . $args['module'];

			if ( ! array_key_exists( $key, self::$resolved ) ) {
				self::$resolved[ $key ] = ( new Modules() )->is_active( $args['module'] );
			}

			return self::$resolved[ $key ];
		}

		return null;
	}

	/**
	 * Whether the site has switched a My Jetpack product on.
	 *
	 * Reads is_activated(), not is_active(): a lapsed plan is not "off", and resolving plans
	 * costs WordPress.com requests on every admin page load. No connection check is added.
	 *
	 * @param string $product_slug A My Jetpack product slug.
	 * @return bool|null Null when no product class is registered under that slug.
	 */
	private static function is_product_activated( $product_slug ) {
		$product_class = Products::get_product_class( $product_slug );

		if ( ! $product_class ) {
			return null;
		}

		return (bool) $product_class::is_activated();
	}
}
