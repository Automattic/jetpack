<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Protect_Models;

use WorDBless\BaseTestCase;

/**
 * Tests for the Threat_Model class.
 *
 * @package automattic/jetpack-protect
 */
class Test_Threat_Model extends BaseTestCase {

	/**
	 * Tests for threat model's __construct() method.
	 */
	public function test_threat_model_construct() {
		$test_data = array(
			'id'             => 'abc-123-abc-123',
			'signature'      => 'Test.Threat',
			'title'          => 'Test Threat',
			'description'    => 'This is a test threat.',
			'first_detected' => '2022-01-01T00:00:00.000Z',
			'fixed_in'       => '1.0.1',
			'severity'       => 4,
			'fixable'        => (object) array(
				'fixer'            => 'update',
				'target'           => '1.0.1',
				'extension_status' => 'active',
			),
			'status'         => 'current',
			'filename'       => '/srv/htdocs/wp-content/uploads/threat.jpg.php',
			'context'        => (object) array(),
		);

		// Initialize multiple instances of Threat_Model to test varying initial params
		$test_threats = array(
			new Threat_Model( $test_data ),
			new Threat_Model( (object) $test_data ),
		);

		foreach ( $test_threats as $threat ) {
			// Validate the threat data is set properly
			foreach ( $test_data as $key => $value ) {
				$this->assertSame( $value, $threat->{ $key } );
			}
		}
	}
}
