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
		add_action( 'jetpack_boost_module_status_updated', array( $this, 'on_module_status_update' ), 10, 2 );
	}

	/**
	 * Handle module status changes.
	 *
	 * @param string $module_slug The module slug.
	 * @param bool   $is_activated The new status.
	 */
	public function on_module_status_update( $module_slug, $is_activated ) {
		$status = new Status( $module_slug );
		$status->on_update( $is_activated );
	}

}
