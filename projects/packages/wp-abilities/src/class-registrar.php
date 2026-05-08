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

	const PACKAGE_VERSION = '0.1.0';

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
	 * Gated behind the `jetpack_wp_abilities_enabled` filter, which defaults
	 * to `false`. Consumers opt in explicitly — per site, per user, or via
	 * feature flag — so abilities roll out gradually rather than flipping on
	 * for every site the moment the package loads.
	 *
	 * When the filter returns `true`, each of the two Abilities API lifecycle
	 * actions either gets a registration callback hooked, or — if the action
	 * has already fired — dispatches immediately so late-loading plugins
	 * still register on time.
	 *
	 * @return void
	 */
	public static function init() {
		/**
		 * Filters whether Jetpack Abilities API registration should run.
		 *
		 * Default `false`. Return `true` to enable registration for this
		 * request, typically gated on a site option, user capability, or
		 * feature flag to support staged rollout.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether to register abilities. Default false.
		 */
		if ( ! apply_filters( 'jetpack_wp_abilities_enabled', false ) ) {
			return;
		}

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
	 * Safe to call directly or as a hook callback. Passes the category slug
	 * through the `jetpack_wp_abilities_should_register` filter so consumers
	 * can gate registration per-site, per-user, or per-feature-flag.
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
	 * Safe to call directly or as a hook callback. Each ability slug is
	 * passed through the `jetpack_wp_abilities_should_register` filter
	 * individually, so consumers can enable a subset of abilities on a
	 * subset of sites or users.
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
