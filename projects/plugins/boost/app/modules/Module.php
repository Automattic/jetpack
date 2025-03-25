<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Status;

class Module {
	/**
	 * @var Status
	 */
	private $status;

	/**
	 * @var Pluggable
	 */
	public $feature;

	public function __construct( Pluggable $feature ) {
		$this->feature = $feature;
		$this->status  = new Status( $feature::get_slug() );
	}

	public function on_activate() {
		if ( $this->feature instanceof Changes_Output_On_Activation ) {
			$this->indicate_page_output_changed();
		}

		return $this->feature instanceof Has_Activate ? $this->feature::activate() : true;
	}

	public function on_deactivate() {
		// If the module changes the page output, with or without preparation, deactivating the module should indicate a page output change.
		if ( $this->feature instanceof Changes_Output_On_Activation || $this->feature instanceof Changes_Output_After_Activation ) {
			$this->indicate_page_output_changed();
		}

		return $this->feature instanceof Has_Deactivate ? $this->feature::deactivate() : true;
	}

	public function indicate_page_output_changed() {
		/**
		 * Indicate that the HTML output of front-end has changed.
		 *
		 * If there is any page cache, it should be invalidated when this action is triggered.
		 */
		do_action( 'jetpack_boost_page_output_changed' );
	}

	public function get_slug() {
		return $this->feature::get_slug();
	}

	public function get_submodules() {
		if ( $this->feature instanceof Has_Submodules ) {
			return $this->feature->get_submodules();
		}

		return false;
	}

	public function get_available_submodules() {
		$submodules = $this->get_submodules();

		if ( empty( $submodules ) ) {
			return array();
		}

		$available_submodules = array();
		foreach ( $submodules as $submodule ) {
			if ( $submodule::is_available() ) {
				$available_submodules[] = new Module( new $submodule() );
			}
		}

		return $available_submodules;
	}

	/**
	 * Get the active parent modules.
	 *
	 * @return Module[] The active parent modules.
	 */
	public function get_active_parent_modules() {
		$modules               = ( new Modules_Index() )->get_modules();
		$active_parent_modules = array();
		foreach ( $modules as $module ) {
			$module_feature = $module->feature;
			if ( ! $module_feature instanceof Has_Submodules ) {
				continue;
			}

			// Check if the feature is a parent of the current module.
			if ( in_array( get_class( $this->feature ), $module_feature->get_submodules(), true ) ) {
				if ( $module->is_enabled() ) {
					$active_parent_modules[ $module->get_slug() ] = $module;
				}
			}
		}
		return $active_parent_modules;
	}

	public function update( $new_status ) {
		return $this->status->set( $new_status );
	}

	public function is_enabled() {
		$always_on = is_subclass_of( $this->feature, 'Automattic\Jetpack_Boost\Contracts\Is_Always_On' );
		if ( $always_on ) {
			return true;
		}

		return $this->status->get();
	}

	public function is_available() {
		return $this->feature::is_available();
	}

	/**
	 * Check if the module is active and ready to serve optimized output.
	 */
	public function is_optimizing() {
		if ( ! ( $this->feature instanceof Optimization ) || ! $this->is_enabled() ) {
			return false;
		}

		if ( $this->feature instanceof Needs_To_Be_Ready && ! $this->feature->is_ready() ) {
			return false;
		}

		return true;
	}
}
