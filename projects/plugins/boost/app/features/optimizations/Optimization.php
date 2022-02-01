<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Status;

class Optimization {
	/**
	 * @var Status
	 */
	public $status;

	/**
	 * @var Feature
	 */
	public $feature;

	public function __construct( Feature $feature ) {
		$this->feature = $feature;
		$this->status  = new Status( $feature->get_slug() );
	}
}
