<?php

namespace Automattic\Jetpack\Capabilities;

class Capability {
	public $name;
	private $rules;

	function __construct( $name ) {
		$this->name  = $name;
		$this->rules = [];
	}

	public function add_rule( $rule ) {
		$this->rules[] = $rule;
	}

	public function test() {
		foreach ( $this->rules as $rule ) {
			if ( ! $rule->check() ) { // TODO: args?
				return false;
			}
		}
		return true;
	}
}
