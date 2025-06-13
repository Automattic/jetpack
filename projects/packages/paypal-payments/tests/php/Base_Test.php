<?php

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Contains a simple test case for the PayPal Payments package skeleton code.
 */
class Base_Test extends TestCase {
	public function test_version() {
		$this->assertEquals( PayPal_Payments::PACKAGE_VERSION, '0.1.0-alpha' );
	}
}
