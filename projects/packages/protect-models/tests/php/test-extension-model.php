<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Protect_Models;

use WorDBless\BaseTestCase;

/**
 * Tests for the Extension_Model class.
 *
 * @package automattic/jetpack-protect
 */
class Test_Extension_Model extends BaseTestCase {
	/**
	 * Tests for extension model's __construct() method.
	 */
	public function test_extension_model_construct() {
		$test_data      = array(
			'slug'    => 'test-extension-1',
			'name'    => 'Test Extension 1',
			'version' => '1.0.0',
			'type'    => 'plugin',
		);
		$test_extension = new Extension_Model( $test_data );

		foreach ( $test_data as $key => $value ) {
			$this->assertSame( $value, $test_extension->$key );
		}
	}
}
