<?php

namespace Automattic\Jetpack\Connection;

use phpmock\functions\FunctionProvider;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;

class ManagerTest extends TestCase {

	function test_class_implements_interface() {
		$manager = new Manager();
		$this->assertInstanceOf( 'Automattic\Jetpack\Connection\Manager_Interface', $manager );
	}
}
