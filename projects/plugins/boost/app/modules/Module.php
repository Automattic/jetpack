<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
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
		return $this->feature instanceof Has_Activate ? $this->feature::activate() : true;
	}

	public function on_deactivate() {
		return $this->feature instanceof Has_Deactivate ? $this->feature::deactivate() : true;
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
		if ( $this->feature instanceof Optimization && $this->is_enabled() && $this->feature->is_ready() ) {
			return true;
		}
	}
}
