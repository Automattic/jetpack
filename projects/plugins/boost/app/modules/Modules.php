<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Lazy_Images\Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Render_Blocking_JS\Render_Blocking_JS;

class Modules {

	protected $modules = array();

	protected function available_modules() {
		$forced_disabled_modules = array();
		// Get the lists of modules explicitly disabled from the 'jb-disable-modules' query string.
		// The parameter is a comma separated value list of module slug.
		if ( ! empty( $_GET['jb-disable-modules'] ) ) {
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
	 * Initialize modules.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-disable-modules is intended to work
	 * without a nonce.
	 */
	public function setup_modules() {

		$features = array(
			new Critical_CSS(),
			new Lazy_Images(),
			new Render_Blocking_JS(),
		);

		foreach ( $features as $feature ) {
			$module = new Module( $feature );
			$module->register_endpoints();

			$modules[ $module->get_slug() ] = $module;
		}

		$this->modules = $modules;
	}

	/**
	 * Initialize modules when WordPress is ready
	 */
	public function initialize_modules() {
		foreach ( $this->available_modules() as $module ) {
			$module->initialize();
		}
	}


	/**
	 * @param string $module_slug
	 *
	 * @return Module_Toggle|false
	 */
	public function get_module( $module_slug ) {
		if ( ! $this->modules[ $module_slug ] ) {
			return false; // @TODO: Return empty module instead
		}

		return $this->modules[ $module_slug ];
	}

	/**
	 * Returns an array of active modules.
	 */
	public function get_active_modules() {
		return array_filter( $this->modules, function( $module ) {
			return $module->is_enabled();
		} );
	}

	public function get_modules() {
		return $this->modules;
	}



}