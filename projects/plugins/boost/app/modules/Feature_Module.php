<?php

namespace Automattic\Jetpack_Boost\Modules;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Status;

class Feature_Module {
	/**
	 * @var Status
	 */
	private $status;

	/**
	 * @var Feature
	 */
	public $feature;

	public function __construct( Feature $feature ) {
		$this->feature = $feature;
		$this->status  = new Status( $feature::get_slug() );
	}

	public function is_enabled() {
		return $this->status->is_enabled();
	}

}
