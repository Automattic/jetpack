<?php
/**
 * Test the Test_Environment class custom slug functionality
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test the Test_Environment class custom slug functionality
 */
class Test_Environment_Custom_Slug_Test extends TestCase {
	/**
	 * Test the Test_Environment class with a custom package slug
	 */
	public function test_custom_package_slug() {
		Test_Environment::init( 'test-package' );
		$this->assertTrue( \defined( 'dbless_UPLOADS' ) );
		$this->assertEquals( 'uploads-test-package', \constant( 'dbless_UPLOADS' ) );
		$this->assertStringContainsString( 'uploads-test-package', wp_upload_dir()['path'] );
	}
}
