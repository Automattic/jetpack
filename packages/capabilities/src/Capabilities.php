<?php

namespace Automattic\Jetpack;

use \Automattic\Jetpack\Capabilities\Capability;

const JETPACK_BUSINESS_PLAN_SLUG = 'jetpack_business';

class Capabilities {
	private $rules;

	function __construct() {
		$this->rules = [];
	}

	static function get( $name ) {
		return new Capability( $name, true );
	}

	public function add_rule( $rule ) {
		$this->rules[] = $rule;
	}
}
