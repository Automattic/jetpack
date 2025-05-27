<?php

namespace Automattic;

use PHPUnit\Framework\TestCase;

/**
 * Testing the Block Delimiter package.
 */
class Block_Delimiter_Test extends TestCase {
	public function test_version() {
		$this->assertIsString( Block_Delimiter::PACKAGE_VERSION );
	}
}
