<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Features\Image_Guide\Image_Guide;
use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Features\Optimizations\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Features\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;

class Optimizations implements Has_Setup {

	/**
	 * @var Optimization[] - Optimization modules
	 */
	protected $features = array();

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 */
	public function __construct() {

		$critical_css_class = Critical_CSS::class;
		if ( Premium_Features::has_feature( Premium_Features::CLOUD_CSS ) ) {
			$critical_css_class = Cloud_CSS::class;
		}

		$features = array(
			new $critical_css_class(),
			new Lazy_Images(),
			new Render_Blocking_JS(),
			new Image_Guide(),
		);

		foreach ( $features as $feature ) {
			$slug                    = $feature->get_slug();
			$this->features[ $slug ] = new Optimization( $feature );
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
		foreach ( $this->features as $optimization ) {
			if ( $optimization->status->is_enabled() ) {
				return true;
			}
		}
		return false;
	}

	public function get_status() {
		$status = array();
		foreach ( $this->features as $slug => $optimization ) {
			$status[ $slug ] = $optimization->status->is_enabled();
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
	}

	/**
	 * @inheritDoc
	 */
	public function setup() {

		foreach ( $this->available_modules() as $slug => $optimization ) {

			if ( ! $optimization->status->is_enabled() ) {
				continue;
			}

			$optimization->feature->setup();
			$this->register_endpoints( $optimization->feature );

			do_action( "jetpack_boost_{$slug}_initialized", $this );

		}
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

	/**
	 * @inheritDoc
	 */
	public function setup_trigger() {
		return 'plugins_loaded';
	}

}
