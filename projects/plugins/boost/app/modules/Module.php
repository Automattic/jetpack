<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
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

	public function is_enabled() {
		return $this->status->is_enabled();
	}

	/**
	 * Check if the module is active and ready to serve optimized output.
	 */
	public function is_optimizing() {
		if ( $this->feature instanceof Changes_Page_Output && $this->feature->is_active() ) {
			return true;
		}
	}
}
