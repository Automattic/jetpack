<?php
/**
 * Main plugin file testing.
 *
 * @package automattic/automattic-for-agencies-client
 */

use WorDBless\BaseTestCase;

/**
 * Main plugin file testing.
 */
class Automattic_For_Agencies_Client_Test extends BaseTestCase {
	public function test_class_exists() {
		$this->assertTrue( class_exists( 'Automattic_For_Agencies_Client' ) );
	}
}
