<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Image_CDN;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify;
use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;

class Modules_Index {
	/**
	 * @var Module[] - Associative array of all Jetpack Boost modules.
	 *
	 * Example: [ 'critical_css' => Module, 'lazy_images' => Module ]
	 */
	protected $modules = array();

	/**
	 * @var Pluggable[] - Classes that handle all Jetpack Boost featues.
	 */
	const MODULES = array(
		Critical_CSS::class,
		Cloud_CSS::class,
		Image_Size_Analysis::class,
		Lazy_Images::class,
		Minify::class,
		Render_Blocking_JS::class,
		Image_Guide::class,
		Image_CDN::class,
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
}
