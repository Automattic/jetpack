<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Image_CDN;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Automattic\Jetpack_Boost\Modules\Performance_History\Performance_History;

class Modules_Index {
	/**
	 * @var Module[] - Associative array of all Jetpack Boost modules.
	 *
	 * Example: [ 'critical_css' => Module, 'image_cdn' => Module ]
	 */
	protected $modules = array();

	/**
	 * @var Pluggable[] - Classes that handle all Jetpack Boost featues.
	 */
	const MODULES = array(
		Critical_CSS::class,
		Cloud_CSS::class,
		Image_Size_Analysis::class,
		Minify_JS::class,
		Minify_CSS::class,
		Render_Blocking_JS::class,
		Image_Guide::class,
		Image_CDN::class,
		Performance_History::class,
		Page_Cache::class,
	);

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 */
	public function __construct() {
		foreach ( self::MODULES as $module ) {
			if ( $module::is_available() ) {
				$slug                   = $module::get_slug();
				$this->modules[ $slug ] = new Module( new $module() );
			}
		}
	}

	/**
	 * Get all modules that implement a specific interface.
	 *
	 * @param string $interface - The interface to search for.
	 * @return array - An array of module classes indexed by slug that implement the interface.
	 */
	public static function get_modules_implementing( string $interface ): array {
		$matching_modules = array();

		foreach ( self::MODULES as $module ) {
			if ( in_array( $interface, class_implements( $module ), true ) ) {
				$matching_modules[ $module::get_slug() ] = $module;
			}
		}

		return $matching_modules;
	}

	public function available_modules() {
		$forced_disabled_modules = $this->get_disabled_modules();

		if ( empty( $forced_disabled_modules ) ) {
			return $this->modules;
		}

		if ( array( 'all' ) === $forced_disabled_modules ) {
			return array();
		}

		$available_modules = array();
		foreach ( $this->modules as $slug => $module ) {
			if ( ! in_array( $slug, $forced_disabled_modules, true ) ) {
				$available_modules[ $slug ] = $module;
			}
		}

		return $available_modules;
	}

	public function is_module_enabled( $slug ) {
		$available_modules = $this->available_modules();

		if ( ! array_key_exists( $slug, $available_modules ) ) {
			return false;
		}

		$module = $available_modules[ $slug ];

		return $module->is_enabled();
	}

	/**
	 * Get the lists of modules explicitly disabled from the 'jb-disable-modules' query string.
	 * The parameter is a comma separated value list of module slug.
	 *
	 * @return array
	 */
	public function get_disabled_modules() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET['jb-disable-modules'] ) ) {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return array_map( 'sanitize_key', explode( ',', $_GET['jb-disable-modules'] ) );
		}

		return array();
	}

	public function get_feature_instance_by_slug( $slug ) {
		return isset( $this->modules[ $slug ] ) ? $this->modules[ $slug ]->feature : false;
	}
}
