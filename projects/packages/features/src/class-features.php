<?php
/**
 * Feature Catalog bootstrap.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

/**
 * Wires the catalog into the host platform.
 */
class Features {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Whether init() has already run.
	 *
	 * @var bool
	 */
	private static $did_init = false;

	/**
	 * Whether feature registration has already run.
	 *
	 * @var bool
	 */
	private static $did_register = false;

	/**
	 * Bind the Jetpack environment and (flag-gated) register the CLI command and dashboard.
	 * Feature registration itself is deferred to first use — see ensure_registered() — so
	 * requests that never read the catalog do no catalog work. Safe to call more than once.
	 */
	public static function init() {
		if ( self::$did_init ) {
			return;
		}
		self::$did_init = true;

		Registry::instance()->set_environment( new Jetpack_Environment() );

		if ( self::is_enabled() ) {
			Dashboard::register();

			if ( defined( 'WP_CLI' ) && \WP_CLI ) {
				\WP_CLI::add_command( 'jetpack features', __NAMESPACE__ . '\\CLI' );
			}
		}
	}

	/**
	 * Register all features on first use. Idempotent — a consumer (CLI, dashboard, REST)
	 * calls this immediately before it reads the catalog, so registration only happens when
	 * the catalog is actually looked at, never on plain page loads.
	 */
	public static function ensure_registered() {
		if ( self::$did_register ) {
			return;
		}
		self::$did_register = true;

		/**
		 * Register features into the catalog. Handlers should only call register_feature().
		 */
		do_action( 'jetpack_features_register' );
	}

	/**
	 * Master flag for all user-visible surfaces.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/** Gate every catalog surface (CLI, REST, UI) behind this flag. */
		return (bool) apply_filters( 'jetpack_features_catalog_enabled', false );
	}
}
