<?php

namespace Automattic\Jetpack;

use \Automattic\Jetpack\Capabilities\Capability;

const JETPACK_BUSINESS_PLAN_SLUG = 'jetpack_business';

class Capabilities {
	private $capabilities;

	function __construct() {
		$this->capabilities = [];
	}

	static function get( $name ) {
		return new Capability( $name, $this );
	}

	public function register( $capability ) {
		// TODO check for clashes?
		$this->capabilities[ $capability->name ] = $capability;
	}
}
