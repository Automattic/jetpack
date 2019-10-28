<?php

namespace Automattic\Jetpack\Capabilities;

class Capability {
	public $name;
	public $available;

	function __construct( $name, $available ) {
		$this->name      = $name;
		$this->available = $available;
	}
}
