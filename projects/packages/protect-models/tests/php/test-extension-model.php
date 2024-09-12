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
	 * Get a sample threat
	 *
	 * @param int|string $id The sample threat's unique identifier.
	 * @return array
	 */
	private static function get_sample_threat( $id = 0 ) {
		return array(
			'id'          => "test-threat-$id",
			'signature'   => 'Test.Threat',
			'title'       => "Test Threat $id",
			'description' => 'This is a test threat.',
		);
	}

	/**
	 * Tests for extension model's __construct() method.
	 */
	public function test_extension_model_construct() {
		$test_data = array(
			'name'    => 'Test Extension',
			'slug'    => 'test-extension',
			'version' => '1.0.0',
			'threats' => array(
				self::get_sample_threat( 0 ),
				self::get_sample_threat( 1 ),
				self::get_sample_threat( 2 ),
			),
			'checked' => true,
			'type'    => 'plugins',
		);

		// Initialize multiple instances of Extension_Model to test varying initial params
		$test_extensions = array(
			new Extension_Model( $test_data ),
			new Extension_Model( (object) $test_data ),
		);

		foreach ( $test_extensions as $extension ) {
			foreach ( $extension->threats as $loop_index => $threat ) {
				// Validate the threat data is converted into Threat_Models
				$this->assertSame( 'Automattic\Jetpack\Protect_Models\Threat_Model', get_class( $threat ) );

				// Validate the threat data is set properly
				foreach ( self::get_sample_threat( $loop_index ) as $key => $value ) {
					$this->assertSame( $value, $threat->{ $key } );
				}
			}
		}
	}
}
