<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Image_CDN;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Liar;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Quality_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_Common;
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
	 * @var Module[] - Associative array of available Jetpack Boost modules.
	 */
	protected $available_modules = array();

	/**
	 * @var Module[] - Associative array of available Jetpack Boost submodules.
	 */
	protected $available_submodules = array();

	/**
	 * @var class-string<Pluggable>[] - Classes that handle all Jetpack Boost features.
	 */
	const FEATURES = array(
		Critical_CSS::class,
		Cloud_CSS::class,
		Image_Size_Analysis::class,
		Minify_JS::class,
		Minify_CSS::class,
		Render_Blocking_JS::class,
		Image_Guide::class,
		Image_CDN::class,
		Liar::class,
		Quality_Settings::class,
		Performance_History::class,
		Page_Cache::class,
	);

	const SUB_FEATURES = array(
		Minify_Common::class,
		Liar::class,
		Quality_Settings::class,
	);

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 */
	public function __construct() {
		foreach ( self::FEATURES as $feature ) {
			$this->modules[ $feature::get_slug() ] = new Module( new $feature() );
			if ( $feature::is_available() ) {
				$this->available_modules[ $feature::get_slug() ] = $this->modules[ $feature::get_slug() ];
			}
		}

		foreach ( self::SUB_FEATURES as $feature ) {
			if ( $feature::is_available() ) {
				$this->available_submodules[ $feature::get_slug() ] = new Module( new $feature() );
			}
		}
	}

	/**
	 * Fetches all modules.
	 *
	 * @return Module[]
	 */
	public function get_modules() {
		return $this->modules;
	}

	/**
	 * Get all modules that aren't disabled.
	 *
	 * @return Module[]
	 */
	public function available_modules() {
		$forced_disabled_modules = $this->get_disabled_modules();

		if ( empty( $forced_disabled_modules ) ) {
			return $this->available_modules;
		}

		if ( array( 'all' ) === $forced_disabled_modules ) {
			return array();
		}

		$available_modules = array();
		foreach ( $this->available_modules as $slug => $module ) {
			if ( ! in_array( $slug, $forced_disabled_modules, true ) ) {
				$available_modules[ $slug ] = $module;
			}
		}

		return $available_modules;
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

	public function get_module_instance_by_slug( $slug ) {
		if ( isset( $this->available_modules[ $slug ] ) ) {
			return $this->available_modules[ $slug ];
		}

		if ( isset( $this->available_submodules[ $slug ] ) ) {
			return $this->available_submodules[ $slug ];
		}
		return false;
	}
}
