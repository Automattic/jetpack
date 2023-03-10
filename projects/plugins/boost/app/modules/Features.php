<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Features\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Features\Image_Size_Analysis\Image_Size_Analysis;
use Automattic\Jetpack_Boost\Lib\Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify;
use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Features implements Has_Setup {

	/**
	 * @var Feature_Module[] - Optimization modules
	 */
	protected $features = array();

	/**
	 * @var Feature[] - Classes that handle all Jetpack Boost featues.
	 */
	const FEATURES = array(
		Critical_CSS::class,
		Cloud_CSS::class,
		Image_Size_Analysis::class,
		Lazy_Images::class,
		Minify::class,
		Render_Blocking_JS::class,
		Image_Guide::class,
	);

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 */
	public function __construct() {

		foreach ( self::FEATURES as $feature ) {
			if ( $feature::is_available() ) {
				$slug                    = $feature::get_slug();
				$this->features[ $slug ] = new Feature_Module( new $feature() );
			}
		}
	}

	public function available_modules() {
		$forced_disabled_modules = $this->get_disabled_modules();

		if ( empty( $forced_disabled_modules ) ) {
			return $this->features;
		}

		if ( array( 'all' ) === $forced_disabled_modules ) {
			return array();
		}

		$available_modules = array();
		foreach ( $this->features as $slug => $feature ) {
			if ( ! in_array( $slug, $forced_disabled_modules, true ) ) {
				$available_modules[ $slug ] = $feature;
			}
		}

		return $available_modules;
	}

	public function have_enabled_modules() {
		foreach ( $this->features as $feature_module ) {
			if ( $feature_module->is_enabled() ) {
				return true;
			}
		}
		return false;
	}

	public function get_status() {
		$status = array();
		foreach ( $this->features as $slug => $feature_module ) {
			$status[ $slug ] = $feature_module->is_enabled();
		}
		return $status;
	}

	public function register_endpoints( $feature ) {
		if ( ! $feature instanceof Has_Endpoints ) {
			return false;
		}

		if ( empty( $feature->get_endpoints() ) ) {
			return false;
		}

		REST_API::register( $feature->get_endpoints() );
	}

	public function init_features() {

		foreach ( $this->available_modules() as $slug => $feature_module ) {

			if ( ! $feature_module->is_enabled() ) {
				continue;
			}

			Setup::add( $feature_module->feature );

			$this->register_endpoints( $feature_module->feature );

			do_action( "jetpack_boost_{$slug}_initialized", $this );

		}
	}

	/**
	 * @inheritDoc
	 */
	public function setup() {
		add_action( 'plugins_loaded', array( $this, 'init_features' ) );
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
