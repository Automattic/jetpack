<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Base class for API test cases.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack_CRM\Tests;

use WorDBless\BaseTestCase;

/**
 * Dummy test class to ensure tests are working.
 *
 * @covers Automattic\Jetpack_CRM
 */
class Dummy_Test extends BaseTestCase {

	/**
	 * Dummy test to ensure PHPUnit works.
	 */
	public function test_that_our_tests_are_testing_the_test_system() {
		add_option( 'jpcrm_test_option', 'hello' );

		$this->assertSame( 'hello', get_option( 'jpcrm_test_option' ) );
	}

}
