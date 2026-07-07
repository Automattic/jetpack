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
	 * Bind the Jetpack environment, trigger feature registration, and (flag-gated) register CLI.
	 * Safe to call more than once.
	 */
	public static function init() {
		if ( self::$did_init ) {
			return;
		}
		self::$did_init = true;

		Registry::instance()->set_environment( new Jetpack_Environment() );

		add_action( 'plugins_loaded', array( __CLASS__, 'register_features' ), 20 );

		if ( self::is_enabled() && defined( 'WP_CLI' ) && \WP_CLI ) {
			\WP_CLI::add_command( 'jetpack features', __NAMESPACE__ . '\\CLI' );
		}
	}

	/**
	 * Fire the registration hook so each owner can require its features.php.
	 */
	public static function register_features() {
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
