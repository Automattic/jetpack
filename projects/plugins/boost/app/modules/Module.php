<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
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
		$this->status  = new Status( $feature );
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

	public function update( $new_status ) {
		return $this->status->update( $new_status );
	}

	public function is_enabled() {
		if ( $this->feature instanceof Is_Always_On ) {
			return true;
		}

		return $this->status->is_enabled();
	}

	public function is_available() {
		return $this->status->is_available();
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
