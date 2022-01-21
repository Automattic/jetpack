<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Features\Optimizations\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Features\Optimizations\Render_Blocking_JS\Render_Blocking_JS;

class Optimizations implements Has_Setup {

	/**
	 * @var Optimization[] - Optimization modules
	 */
	protected $modules = array();

	/**
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 */
	public function __construct() {

		$features = array(
			new Critical_CSS(),
			new Lazy_Images(),
			new Render_Blocking_JS(),
		);

		$modules = array();
		foreach ( $features as $feature ) {
			$module                         = new Optimization( $feature );
			$modules[ $module->get_slug() ] = $module;
		}

		$this->modules = $modules;
	}

	protected function available_modules() {
		$forced_disabled_modules = array();
		// Get the lists of modules explicitly disabled from the 'jb-disable-modules' query string.
		// The parameter is a comma separated value list of module slug.

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET['jb-disable-modules'] ) ) {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$forced_disabled_modules = array_map( 'sanitize_key', explode( ',', $_GET['jb-disable-modules'] ) );
		}

		$available_modules = array();
		foreach ( $this->modules as $module_slug => $module ) {

			// Don't register modules that have been forcibly disabled from the url 'jb-disable-modules' query string parameter.
			if ( in_array( $module_slug, $forced_disabled_modules, true ) || in_array( 'all', $forced_disabled_modules, true ) ) {
				continue;
			}
			$available_modules[ $module_slug ] = $module;
		}

		return $available_modules;
	}

	/**
	 * @param string $module_slug
	 */
	public function get_module( $module_slug ) {
		if ( ! $this->modules[ $module_slug ] ) {
			return false; // @TODO: Return empty module instead?
		}

		return $this->modules[ $module_slug ];
	}

	/**
	 * Returns an array of active modules.
	 */
	public function get_active_modules() {
		return array_filter(
			$this->modules,
			function ( $module ) {
				return $module->is_enabled();
			}
		);
	}

	public function get_modules() {
		return $this->modules;
	}

	/**
	 * @inheritDoc
	 */
	public function setup() {
		foreach ( $this->available_modules() as $module ) {
			$module->register_endpoints();
			$module->initialize();
		}
	}

	/**
	 * @inheritDoc
	 */
	public function setup_trigger() {
		return 'init';
	}
}
