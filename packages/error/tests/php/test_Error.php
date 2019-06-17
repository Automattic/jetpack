<?php

use Automattic\Jetpack\Error;
use PHPUnit\Framework\TestCase;

class Test_Error extends TestCase {
	function test_jetpack_error() {
		$error = new Error();
		$this->assertInstanceOf( '\\WP_Error', $error );
	}
}

class WP_Error {}
