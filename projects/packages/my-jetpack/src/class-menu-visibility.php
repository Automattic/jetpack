<?php
/**
 * Resolves whether a Jetpack admin menu item's feature is active.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use WP_Error;

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
		// An older admin-ui, loaded first by another plugin, may predate the resolver; items then stay visible.
		if ( ! method_exists( Admin_Menu::class, 'set_visibility_resolver' ) ) {
			return;
		}

		Admin_Menu::set_visibility_resolver( array( __CLASS__, 'resolve' ) );
		if ( method_exists( Admin_Menu::class, 'set_feature_activator' ) ) {
			Admin_Menu::set_feature_activator( array( __CLASS__, 'activate' ), array( __CLASS__, 'offers' ) );
		}

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
			$key = 'module:' . $args['module'];

			if ( ! array_key_exists( $key, self::$resolved ) ) {
				self::$resolved[ $key ] = self::is_module_activated( $args['module'] );
			}

			return self::$resolved[ $key ];
		}

		return null;
	}

	/**
	 * Switch a gated feature on the way the Features tab does: its module, when Jetpack runs one, before its plugin.
	 *
	 * Never installs a plugin; a feature that needs one is set up from My Jetpack.
	 *
	 * @param array $args The item's visibility declaration.
	 * @return true|WP_Error
	 */
	public static function activate( $args ) {
		list( $product_class, $module ) = self::get_targets( $args );

		// Else the product fallback below would install a plugin for a module the site filtered away or holds off.
		if ( ! self::can_offer( $args ) ) {
			return new WP_Error( 'not_available', __( 'This feature is not available on this site.', 'jetpack-my-jetpack' ) );
		}

		if ( self::is_module_on_offer( $module ) ) {
			if ( isset( Products\Protect::get_protect_page_module_urls()[ $module ] ) ) {
				return REST_Main_Features::managed_in_protect_error();
			}
			$result = REST_Main_Features::switch_module( $module, true );
			// A product whose standalone plugin is off stays off with its module on: activate the plugin below.
			if ( is_wp_error( $result ) || ! $product_class || $product_class::is_activated() ) {
				self::forget_resolved_gates();
				return $result;
			}
		}

		if ( ! $product_class ) {
			return new WP_Error( 'not_found', __( 'That feature was not found.', 'jetpack-my-jetpack' ) );
		}
		// Not is_plugin_installed(): a hybrid product counts the Jetpack plugin, and activation would install its own.
		if ( ! $product_class::get_installed_plugin_filename() ) {
			return new WP_Error( 'not_available', __( 'This feature needs a plugin installed from My Jetpack.', 'jetpack-my-jetpack' ) );
		}
		if ( ! REST_Products::edit_permissions_callback() ) {
			return new WP_Error( 'not_allowed', __( 'Your account can’t activate plugins on this site.', 'jetpack-my-jetpack' ) );
		}

		$result = $product_class::activate();
		self::forget_resolved_gates();

		return is_wp_error( $result ) ? $result : true;
	}

	/**
	 * Whether the current user has the capabilities activate() needs for this gate.
	 *
	 * @param array $args The item's visibility declaration.
	 * @return bool
	 */
	public static function can_activate( $args ) {
		list( $product_class, $module ) = self::get_targets( $args );
		$module_on_offer                = self::is_module_on_offer( $module );

		if ( $module_on_offer && ! current_user_can( 'jetpack_manage_modules' ) ) {
			return false;
		}
		// activate() goes on to the plugin when Jetpack runs no module for it, or the plugin is off.
		if ( $product_class && ( ! $module_on_offer || ! $product_class::is_plugin_active() ) ) {
			return REST_Products::edit_permissions_callback();
		}

		return $module_on_offer;
	}

	/**
	 * The product class and module a gate switches.
	 *
	 * @param array $args The item's visibility declaration.
	 * @return array{0: class-string<Product>|null, 1: string|null}
	 */
	private static function get_targets( $args ) {
		$product_class = empty( $args['product'] ) ? null : Products::get_product_class( $args['product'] );
		$module        = empty( $args['module'] ) ? ( $product_class ? $product_class::get_module_name() : null ) : $args['module'];

		return array( $product_class, $module ? $module : null );
	}

	/**
	 * Whether this site runs the module, so switching it on needs no plugin.
	 *
	 * @param string|null $module_name A Jetpack module name.
	 * @return bool
	 */
	private static function is_module_on_offer( $module_name ) {
		return $module_name && in_array( $module_name, ( new Modules() )->get_available(), true );
	}

	/**
	 * Whether a Jetpack module gating an item is switched on.
	 *
	 * A name this site has no module for is unanswerable rather than off, so a typo in a gate
	 * fails open like an unknown product slug does instead of silently removing the item. Off
	 * the Jetpack plugin that covers any module a standalone plugin did not declare through
	 * `jetpack_get_available_standalone_modules`.
	 *
	 * @param string $module_name A Jetpack module name.
	 * @return bool|null Null when this site has no such module.
	 */
	private static function is_module_activated( $module_name ) {
		$modules = new Modules();

		if ( ! in_array( $module_name, $modules->get_available(), true ) ) {
			return null;
		}

		return $modules->is_active( $module_name );
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

		// Simple runs Jetpack from mu-plugins, outside the plugin list is_activated() reads, and keeps every module on.
		if ( ( new Host() )->is_wpcom_simple() ) {
			return ! $product_class::is_held_off();
		}

		return (bool) $product_class::is_activated();
	}

	/**
	 * Whether activate() can switch a gate's feature on: it needs no install, and nothing removed its module or holds it off.
	 *
	 * Separate from resolve(), which also decides the sidebar: a feature held off is still off there.
	 *
	 * @param array $args The item's visibility declaration.
	 * @return bool
	 */
	public static function can_offer( $args ) {
		list( $product_class, $module ) = self::get_targets( $args );

		// A site without the plugin never had the feature on, say Stats on a Boost-only site.
		if ( ! self::is_module_on_offer( $module ) && ! ( $product_class && $product_class::get_installed_plugin_filename() ) ) {
			return false;
		}

		return ! self::is_module_removed( $module )
			&& ! self::is_module_held_off( $module )
			&& ! ( $product_class && $product_class::is_held_off() );
	}

	/**
	 * Whether the admin shell should offer to turn a gate's feature on: it can, and the Features tab lists it, so My Jetpack has its card.
	 *
	 * A page with no card keeps its own way to turn its feature back on.
	 *
	 * @param array $args The item's visibility declaration.
	 * @return bool
	 */
	public static function offers( $args ) {
		$listed = false;
		foreach ( Main_Features::get_feature_definitions() as $definition ) {
			if ( ( ! empty( $args['product'] ) && ( $definition['product'] ?? '' ) === $args['product'] )
				|| ( empty( $args['product'] ) && ! empty( $args['module'] ) && ( $definition['module'] ?? '' ) === $args['module'] ) ) {
				$listed = true;
				break;
			}
		}

		return $listed && self::can_offer( $args );
	}

	/**
	 * Whether a `jetpack_active_modules` callback, such as a host's, would keep this module off once it is saved on.
	 *
	 * @param string|null $module_name A Jetpack module name.
	 * @return bool
	 */
	private static function is_module_held_off( $module_name ) {
		if ( ! self::is_module_on_offer( $module_name ) ) {
			return false;
		}
		$active = ( new Modules() )->get_active();
		if ( in_array( $module_name, $active, true ) ) {
			return false;
		}

		/** This filter is documented in projects/packages/status/src/class-modules.php */
		return ! in_array( $module_name, (array) apply_filters( 'jetpack_active_modules', array_merge( $active, array( $module_name ) ) ), true );
	}

	/**
	 * Whether the Jetpack plugin ships this module but no longer offers it, as when a
	 * `jetpack_get_available_modules` filter removes it.
	 *
	 * Bundles and Scan name modules Jetpack has no file for, which are not removed.
	 *
	 * @param string|null $module_name A Jetpack module name.
	 * @return bool
	 */
	private static function is_module_removed( $module_name ) {
		if ( ! $module_name || ! class_exists( 'Jetpack' ) ) {
			return false;
		}
		$modules = new Modules();
		$path    = $modules->get_path( $module_name );

		return $path && file_exists( $path ) && ! in_array( $module_name, $modules->get_available(), true );
	}
}
