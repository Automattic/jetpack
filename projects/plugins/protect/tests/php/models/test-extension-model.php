<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Protect;

use WorDBless\BaseTestCase;

/**
 * Tests for the Extension_Model class.
 *
 * @package automattic/jetpack-protect
 */
class Test_Extension_Model extends BaseTestCase {

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
	}

	/**
	 * Get a sample vulnerability
	 *
	 * @param int|string $id The sample vulnerability's unique identifier.
	 * @return array
	 */
	private static function get_sample_vulnerability( $id = 0 ) {
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
			'name'            => 'Test Extension',
			'slug'            => 'test-extension',
			'version'         => '1.0.0',
			'vulnerabilities' => array(
				self::get_sample_vulnerability( 0 ),
				self::get_sample_vulnerability( 1 ),
				self::get_sample_vulnerability( 2 ),
			),
			'checked'         => true,
			'type'            => 'plugins',
		);

		// Initialize multiple instances of Extension_Model to test varying initial params
		$test_extensions = array(
			new Extension_Model( $test_data ),
			new Extension_Model( (object) $test_data ),
		);

		foreach ( $test_extensions as $extension ) {
			foreach ( $extension->vulnerabilities as $loop_index => $vulnerability ) {
				// Validate the threat data is converted into Threat_Models
				$this->assertSame( get_class( $vulnerability ), 'Automattic\Jetpack\Protect\Threat_Model' );

				// Validate the threat data is set properly
				foreach ( self::get_sample_vulnerability( $loop_index ) as $key => $value ) {
					$this->assertSame( $value, $vulnerability->{ $key } );
				}
			}
		}

	}

}
