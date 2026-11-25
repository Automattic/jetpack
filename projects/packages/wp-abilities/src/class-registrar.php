<?php
/**
 * Abstract base class for registering a category and its abilities with the
 * WordPress Abilities API.
 *
 * @package automattic/jetpack-wp-abilities
 */

// @phan-file-suppress PhanAbstractStaticMethodCallInStatic -- static:: dispatches to the concrete subclass for the three abstract getters; callers must not instantiate Registrar itself.

namespace Automattic\Jetpack\WP_Abilities;

/**
 * Abstract base class that owns the boilerplate every Jetpack abilities
 * registrar needs: hooking into the Abilities API lifecycle actions (or
 * registering right away when `init()` runs inside one of them), and guarding
 * the Abilities API function calls so the class is safe to load on WP < 6.9.
 *
 * Consumers extend this class and override `get_category_slug()`,
 * `get_category_definition()`, and `get_abilities()`.
 */
abstract class Registrar {

	const PACKAGE_VERSION = '0.3.0';

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
	 * Gated behind the `jetpack_wp_abilities_enabled` filter, whose default
	 * comes from `enabled_by_default()`. Return `false` from it to turn
	 * registration off for a site or a single request.
	 *
	 * When the filter returns `true`, each registration method runs inside its
	 * lifecycle action: right away if `init()` is called while that action
	 * runs, otherwise from a hook. WordPress rejects registrations outside
	 * those actions, so a call after they fired, such as from a module
	 * switched on mid-request, registers nothing until the next request.
	 *
	 * @return void
	 */
	public static function init() {
		/**
		 * Filters whether Jetpack Abilities API registration should run.
		 *
		 * Return `false` to skip registration for this request, for
		 * example to turn Jetpack's abilities off on a site.
		 *
		 * @since 0.1.0
		 * @since 0.3.0 Defaults to the registrar's `enabled_by_default()`.
		 *
		 * @param bool $enabled Whether to register abilities. Default is the registrar's `enabled_by_default()`.
		 */
		if ( ! apply_filters( 'jetpack_wp_abilities_enabled', static::enabled_by_default() ) ) {
			return;
		}

		if ( doing_action( self::CATEGORIES_INIT_ACTION ) ) {
			static::register_category();
		} else {
			add_action( self::CATEGORIES_INIT_ACTION, array( static::class, 'register_category' ) );
		}

		if ( doing_action( self::ABILITIES_INIT_ACTION ) ) {
			static::register_abilities();
		} else {
			add_action( self::ABILITIES_INIT_ACTION, array( static::class, 'register_abilities' ) );
		}
	}

	/**
	 * Whether this registrar's abilities register when nothing filters `jetpack_wp_abilities_enabled`.
	 *
	 * The newest copy of this class loads for every plugin on a site, so the
	 * default belongs to each registrar: a registrar from an older plugin
	 * release doesn't override this and stays off.
	 *
	 * @return bool
	 */
	protected static function enabled_by_default(): bool {
		return false;
	}

	/**
	 * Register the category with the WordPress Abilities API.
	 *
	 * `init()` runs it during `wp_abilities_api_categories_init`, the only
	 * time WordPress accepts a category. Passes the category slug through
	 * the `jetpack_wp_abilities_should_register` filter so consumers can gate
	 * registration per-site, per-user, or per-feature-flag.
	 *
	 * @return void
	 */
	public static function register_category() {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		$slug = static::get_category_slug();
		if ( ! self::should_register( 'category', $slug ) ) {
			return;
		}

		wp_register_ability_category( $slug, static::get_category_definition() );
	}

	/**
	 * Register every ability returned by `get_abilities()`.
	 *
	 * `init()` runs it during `wp_abilities_api_init`, the only time
	 * WordPress accepts an ability. Each ability slug is passed through the
	 * `jetpack_wp_abilities_should_register` filter individually, so
	 * consumers can enable a subset of abilities on a subset of sites or
	 * users. An ability whose category isn't registered
	 * is skipped, since WordPress would reject it.
	 *
	 * @return void
	 */
	public static function register_abilities() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		$category_slug = static::get_category_slug();

		foreach ( static::get_abilities() as $slug => $spec ) {
			if ( ! self::should_register( 'ability', $slug ) ) {
				continue;
			}
			if ( ! array_key_exists( 'category', $spec ) ) {
				$spec['category'] = $category_slug;
			}
			// For example a category the should-register filter blocked, or `site` in core's own tests, which unhook it.
			if ( function_exists( 'wp_has_ability_category' ) && ! wp_has_ability_category( $spec['category'] ) ) {
				continue;
			}
			wp_register_ability( $slug, $spec );
		}
	}

	/**
	 * Apply the shared registration filter.
	 *
	 * @param string $type One of 'category' or 'ability'.
	 * @param string $slug The slug being registered.
	 * @return bool True when registration should proceed, false to skip.
	 */
	private static function should_register( string $type, string $slug ): bool {
		/**
		 * Filters whether an Abilities API category or ability should be registered.
		 *
		 * Returning false from any filter callback skips the registration,
		 * which is how consumers gate rollout per-site, per-user, or per
		 * feature flag. The filter fires once per category and once per
		 * individual ability, so callbacks can allow-list or deny-list by
		 * `$slug`.
		 *
		 * @since 0.1.0
		 *
		 * @param bool   $enabled Whether to register. Default true.
		 * @param string $type    Either 'category' or 'ability'.
		 * @param string $slug    The category or ability slug being registered.
		 */
		return (bool) apply_filters( 'jetpack_wp_abilities_should_register', true, $type, $slug );
	}
}
