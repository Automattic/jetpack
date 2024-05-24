<?php
/**
 * "Child" test for RedefinitionTest::testRemoval().
 *
 * @package automattic/patchwork-redefine-exit
 */

namespace Automattic\RedefineExit\Tests;

use PHPUnit\Framework\TestCase;

/**
 * "Child" test for RedefinitionTest::testRemoval().
 *
 * This should not be run normally.
 */
class RedefinitionTestChild extends TestCase {

	/**
	 * @after
	 */
	public function tear_down() {
		\Patchwork\restoreAll();
	}

	public function testSomething() {
		$this->assertTrue( true );
	}
}
