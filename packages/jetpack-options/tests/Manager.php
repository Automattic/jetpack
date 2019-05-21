<?php

use WP_Mock\Tools\TestCase;
use Jetpack\V7\Options\Manager;

class ManagerTest extends TestCase {
	public function setUp(): void {
		\WP_Mock::setUp();

		$this->manager = new Manager();
	}

	public function test_get_options() {

	}

	public function tearDown(): void {
		\WP_Mock::tearDown();
	}
}
