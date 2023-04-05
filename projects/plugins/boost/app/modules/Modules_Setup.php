<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Lib\Setup;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Modules_Setup implements Has_Setup {
	/**
	 * @var Module[] - Associative array of all Jetpack Boost modules currently available.
	 */
	protected $available_modules = array();

	public function __construct() {
		$modules                 = new Modules_Index();
		$this->available_modules = $modules->available_modules();
	}

	public function have_enabled_modules() {
		foreach ( $this->available_modules as $module ) {
			if ( $module->is_enabled() ) {
				return true;
			}
		}
		return false;
	}

	public function get_status() {
		$status = array();
		foreach ( $this->available_modules as $slug => $module ) {
			$status[ $slug ] = $module->is_enabled();
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

	public function init_modules() {

		foreach ( $this->available_modules as $slug => $module ) {

			if ( ! $module->is_enabled() ) {
				continue;
			}

			Setup::add( $module->feature );

			$this->register_endpoints( $module->feature );

			do_action( "jetpack_boost_{$slug}_initialized", $this );

		}
	}

	/**
	 * @inheritDoc
	 */
	public function setup() {
		add_action( 'plugins_loaded', array( $this, 'init_modules' ) );
		add_action( 'jetpack_ds_set', array( $this, 'on_ds_set' ), 10, 3 );
	}

	/**
	 * Handle module status changes when the DS is set.
	 *
	 * @param string $namespace The namespace of the DS.
	 * @param string $key The name of the DS entry
	 * @param mixed $value The value of the DS entry
	 */
	public function on_ds_set( $namespace, $key, $value ) {
		$pattern_matches = array();
		if ( $namespace === JETPACK_BOOST_DATASYNC_NAMESPACE && preg_match( '/\Amodule_status_([a-z_]+)\z/', $key, $pattern_matches ) ) {
			$module_slug = $pattern_matches[1];
			if ( isset( $this->available_modules[ $module_slug ] ) ) {
				$status = new Status( $module_slug );
				$status->on_update( $value );
			}
		}
	}

}
