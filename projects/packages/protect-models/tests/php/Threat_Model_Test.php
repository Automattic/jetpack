<?php

namespace Automattic\Jetpack\Protect_Models;

use WorDBless\BaseTestCase;

/**
 * Tests for the Threat_Model class.
 *
 * @package automattic/jetpack-protect
 */
class Threat_Model_Test extends BaseTestCase {

	/**
	 * Tests for threat model's __construct() method.
	 */
	public function test_threat_model_construct() {
		// Initialize multiple instances of Extension_Threat to test varying initial params
		$test_data = array(
			array(
				'id'          => 'test-threat-1',
				'signature'   => 'Test.Threat',
				'title'       => 'Test Threat 1',
				'description' => 'This is a test threat.',
				'extension'   => array(
					'slug'    => 'test-extension-1',
					'name'    => 'Test Extension 1',
					'version' => '1.0.0',
					'type'    => 'plugin',
				),
			),
			array(
				'id'          => 'test-threat-2',
				'signature'   => 'Test.Threat',
				'title'       => 'Test Threat 2',
				'description' => 'This is a test threat.',
				'extension'   => array(
					'slug'    => 'test-extension-2',
					'name'    => 'Test Extension 2',
					'version' => '1.0.0',
					'type'    => 'theme',
				),
			),
			array(
				'id'          => 'test-threat-3',
				'signature'   => 'Test.Threat',
				'title'       => 'Test Threat 3',
				'description' => 'This is a test threat.',
			),
		);

		$test_threats = array_map(
			function ( $threat_data ) {
				return new Threat_Model( $threat_data );
			},
			$test_data
		);

		foreach ( $test_threats as $loop_index => $threat ) {
			// Validate the threat data is normalized into model classes
			$this->assertSame( 'Automattic\Jetpack\Protect_Models\Threat_Model', get_class( $threat ) );
			if ( isset( $threat->extension ) ) {
				$this->assertSame( 'Automattic\Jetpack\Protect_Models\Extension_Model', get_class( $threat->extension ) );
			}

			// Validate the threat data is set properly
			foreach ( $test_data[ $loop_index ] as $key => $value ) {
				if ( 'extension' === $key ) {
					foreach ( $value as $extension_key => $extension_value ) {
						$this->assertSame( $extension_value, $threat->extension->$extension_key );
					}
					continue;
				}
				$this->assertSame( $value, $threat->$key );
			}
		}
	}
}
