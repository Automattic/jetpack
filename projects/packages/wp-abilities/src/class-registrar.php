<?php
/**
 * Abstract base class for registering a category and its abilities with the
 * WordPress Abilities API.
 *
 * @package automattic/jetpack-wp-abilities
 */

// @phan-file-suppress PhanUndeclaredFunction @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9. We guard with function_exists() checks so the package is safe on older WP. @todo Remove this line when the minimum supported WordPress version is 6.9.
// @phan-file-suppress PhanAbstractStaticMethodCallInStatic -- static:: dispatches to the concrete subclass for the three abstract getters; callers must not instantiate Registrar itself.

namespace Automattic\Jetpack\WP_Abilities;

/**
 * Abstract base class that owns the boilerplate every Jetpack abilities
 * registrar needs: hooking into the Abilities API lifecycle actions (or
 * calling the registration methods directly when those actions have already
 * fired), and guarding the Abilities API function calls so the class is safe
 * to load on WP < 6.9.
 *
 * Consumers extend this class and override `get_category_slug()`,
 * `get_category_definition()`, and `get_abilities()`.
 */
abstract class Registrar {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Action fired by the Abilities API when ability categories should register.
	 */
	const CATEGORIES_INIT_ACTION = 'wp_abilities_api_categories_init';

	/**
	 * Action fired by the Abilities API when abilities should register.
	 */
	const ABILITIES_INIT_ACTION = 'wp_abilities_api_init';

	/**
	 * Return the category slug this registrar owns (e.g. "jetpack-forms").
	 *
	 * @return string
	 */
	abstract public static function get_category_slug(): string;

	/**
	 * Return the category definition passed to `wp_register_ability_category()`.
	 *
	 * Expected shape: [ 'label' => string, 'description' => string ].
	 *
	 * @return array
	 */
	abstract public static function get_category_definition(): array;

	/**
	 * Return the abilities this registrar owns as a `[ slug => spec ]` map.
	 *
	 * Each spec is passed as-is to `wp_register_ability()`. If a spec omits
	 * `category`, the registrar auto-injects `get_category_slug()`. If the spec
	 * sets `category` explicitly, it is preserved unchanged.
	 *
	 * @return array<string, array>
	 */
	abstract public static function get_abilities(): array;

	/**
	 * Wire up the Abilities API registrations.
	 *
	 * For each of the two Abilities API lifecycle actions we either hook our
	 * registration method or — if the action has already fired — dispatch
	 * immediately, so late-loading plugins still register on time.
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( self::CATEGORIES_INIT_ACTION ) ) {
			static::register_category();
		} else {
			add_action( self::CATEGORIES_INIT_ACTION, array( static::class, 'register_category' ) );
		}

		if ( did_action( self::ABILITIES_INIT_ACTION ) ) {
			static::register_abilities();
		} else {
			add_action( self::ABILITIES_INIT_ACTION, array( static::class, 'register_abilities' ) );
		}
	}

	/**
	 * Register the category with the WordPress Abilities API.
	 *
	 * Safe to call directly or as a hook callback.
	 *
	 * @return void
	 */
	public static function register_category() {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category( static::get_category_slug(), static::get_category_definition() );
	}

	/**
	 * Register every ability returned by `get_abilities()`.
	 *
	 * Safe to call directly or as a hook callback.
	 *
	 * @return void
	 */
	public static function register_abilities() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		$category_slug = static::get_category_slug();

		foreach ( static::get_abilities() as $slug => $spec ) {
			if ( ! isset( $spec['category'] ) ) {
				$spec['category'] = $category_slug;
			}
			wp_register_ability( $slug, $spec );
		}
	}
}
