<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
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
	const DISABLE_MODULE_QUERY_VAR = 'jb-disable-modules';
	/**
	 * @var Module[] - Associative array of all Jetpack Boost modules.
	 *
	 * Example: [ 'critical_css' => Module, 'image_cdn' => Module ]
	 */
	protected $modules = array();

	/**
	 * @var class-string<Pluggable>[] - Classes that handle all Jetpack Boost features.
	 */
	const MAIN_FEATURES = array(
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
		foreach ( self::MAIN_FEATURES as $feature ) {
			$module                 = new Module( new $feature() );
			$slug                   = $module->get_slug();
			$this->modules[ $slug ] = $module;
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

		foreach ( self::get_modules_and_submodules() as $slug => $module ) {
			if ( in_array( $interface, class_implements( $module ), true ) ) {
				$matching_modules[ $slug ] = $module;
			}
		}

		return $matching_modules;
	}

	public static function get_modules_and_submodules() {
		$modules = array();

		foreach ( self::MAIN_FEATURES as $module ) {
			$modules[ $module::get_slug() ] = $module;
			$module_instance                = ( new Module( new $module() ) );

			if ( $module_instance->feature instanceof Has_Submodules ) {
				$submodules = $module_instance->feature->get_submodules();

				foreach ( $submodules as $submodule ) {
					$modules[ $submodule::get_slug() ] = $submodule;
				}
			}
		}

		return $modules;
	}

	/**
	 * Get all modules that aren't disabled.
	 *
	 * @return Module[]
	 */
	public function get_modules() {
		$forced_disabled_modules = $this->get_disabled_modules();

		if ( empty( $forced_disabled_modules ) ) {
			return $this->modules;
		}

		if ( array( 'all' ) === $forced_disabled_modules ) {
			return array();
		}

		$modules = array();
		foreach ( $this->modules as $slug => $module ) {
			if ( ! in_array( $slug, $forced_disabled_modules, true ) ) {
				$modules[ $slug ] = $module;
			}
		}

		return $modules;
	}

	// @todo - This only checks main modules.
	public function is_module_enabled( $slug ) {
		$modules = $this->get_modules();

		if ( ! array_key_exists( $slug, $modules ) ) {
			return false;
		}

		$module = $modules[ $slug ];

		return $module->is_enabled();
	}

	// @todo - This only checks main modules.
	public function is_module_available( $slug ) {
		$modules = $this->get_modules();

		if ( ! array_key_exists( $slug, $modules ) ) {
			return false;
		}

		$module = $modules[ $slug ];

		return $module->is_available();
	}

	/**
	 * Get the lists of modules explicitly disabled from the 'jb-disable-modules' query string.
	 * The parameter is a comma separated value list of module slug.
	 *
	 * @return array
	 */
	public function get_disabled_modules() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET[ self::DISABLE_MODULE_QUERY_VAR ] ) ) {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return array_map( 'sanitize_key', explode( ',', $_GET[ self::DISABLE_MODULE_QUERY_VAR ] ) );
		}

		return array();
	}

	// @todo - This only checks main modules.
	public function get_module_instance_by_slug( $slug ) {
		return isset( $this->modules[ $slug ] ) ? $this->modules[ $slug ] : false;
	}
}
