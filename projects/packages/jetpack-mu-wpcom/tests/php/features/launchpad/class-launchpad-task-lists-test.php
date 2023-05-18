<?php
/**
 * Test class for Launchpad_Task_Lists.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Test class for Launchpad_Task_Lists.
 *
 * @coversDefaultClass Launchpad_Task_Lists
 */
class Launchpad_Task_Lists_Test extends \WorDBless\BaseTestCase {
	/**
	 * Make sure that ::build() doesn't create a PHP warning when it doesn't get a valid ID.
	 *
	 * @covers ::build
	 */
	public function test_build_creates_no_PHP_warnings() {
		$result = Launchpad_Task_Lists::get_instance()->build( '' );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}
}
