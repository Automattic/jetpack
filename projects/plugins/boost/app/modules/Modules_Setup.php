<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Regenerate;
use Automattic\Jetpack_Boost\Lib\Setup;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Always_Available_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Modules_Setup implements Has_Setup {
	/**
	 * @var Modules_Index
	 */
	protected $modules_index = array();

	/**
	 * @var Module[] - Associative array of all Jetpack Boost modules currently available.
	 */
	protected $available_modules = array();

	public function __construct() {
		$this->modules_index     = new Modules_Index();
		$this->available_modules = $this->modules_index->available_modules();
	}

	public function have_enabled_modules() {
		foreach ( $this->available_modules as $module ) {
			if ( $module->is_enabled() ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Get modules that are currently active and optimizing the site.
	 *
	 * @return string[] Slugs of optimization modules that are currently active and serving.
	 */
	public function get_ready_active_optimization_modules() {
		$working_modules = array();
		foreach ( $this->available_modules as $slug => $module ) {
			if ( $module->is_optimizing() ) {
				$working_modules[] = $slug;
			}
		}
		return $working_modules;
	}

	public function get_status() {
		$status = array();
		foreach ( $this->available_modules as $slug => $module ) {
			$status[ $slug ] = $module->is_enabled();
		}
		return $status;
	}

	/**
	 * Used to register endpoints that will be available even
	 * if the module is not enabled.
	 *
	 * @return bool|void
	 */
	public function register_always_available_endpoints( $feature ) {
		if ( ! $feature instanceof Has_Always_Available_Endpoints ) {
			return false;
		}

		if ( empty( $feature->get_always_available_endpoints() ) ) {
			return false;
		}

		REST_API::register( $feature->get_always_available_endpoints() );
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

	public function load_modules() {
		$this->init_modules( $this->available_modules );
	}

	private function init_modules( $modules ) {
		foreach ( $modules as $slug => $module ) {

			$this->register_always_available_endpoints( $module->feature );

			if ( ! $module->is_enabled() ) {
				continue;
			}

			Setup::add( $module->feature );

			$submodules = $module->get_submodules();
			if ( $submodules ) {
				$submodules_instances = array();
				foreach ( $submodules as $sub_module ) {
					if ( $sub_module::is_available() ) {
						$submodules_instances[] = new Module( new $sub_module() );
					}
				}
				$this->init_modules( $submodules_instances );
			}

			$this->register_endpoints( $module->feature );

			do_action( "jetpack_boost_{$slug}_initialized", $this );

		}
	}

	/**
	 * @inheritDoc
	 */
	public function setup() {
		add_action( 'plugins_loaded', array( $this, 'load_modules' ) );
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

		$module = $this->modules_index->get_module_instance_by_slug( $module_slug );
		if ( $is_activated && $module ) {
			$module->on_activate();
		}

		if ( ! $is_activated && $module ) {
			$module->on_deactivate();
		}

		if ( $module_slug === Cloud_CSS::get_slug() && $is_activated ) {
			( new Regenerate() )->start();
		}
	}
}
