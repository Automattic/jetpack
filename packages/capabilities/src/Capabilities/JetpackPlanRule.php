<?php

namespace Automattic\Jetpack\Capabilities;

class JetpackPlanRule implements Rule {
	private $plan_slug;

	function __construct( $plan_slug ) {
		$this->plan_slug = $plan_slug;
	}

	function check( ...$args ) : bool {
		$plan = Jetpack_Plan::get();
		if ( $this->plan_slug === $plan['product_slug'] ) {
			return true;
		} else {
			return false;
		}
	}
}
