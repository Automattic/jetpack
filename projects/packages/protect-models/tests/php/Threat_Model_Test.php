<?php

namespace Automattic\Jetpack\Protect_Models;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Threat_Model class.
 *
 * @package automattic/jetpack-protect-models
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

	/**
	 * @dataProvider provide_fixed_versions
	 *
	 * @param array<string|null> $fixed_versions Vulnerability fixed versions.
	 * @param string|null        $expected       Expected threat fixed version.
	 */
	#[DataProvider( 'provide_fixed_versions' )]
	public function test_generated_threat_fixed_version( array $fixed_versions, $expected ) {
		$extension       = new Extension_Model( array( 'type' => 'plugins' ) );
		$vulnerabilities = array_map(
			static fn ( $fixed_in ) => new Vulnerability_Model( array( 'fixed_in' => $fixed_in ) ),
			$fixed_versions
		);

		$threat = Threat_Model::generate_from_extension_vulnerabilities( $extension, $vulnerabilities );

		$this->assertSame( $expected, $threat->fixed_in );
	}

	/**
	 * @return array Fixed versions and their expected threat fixed version.
	 */
	public static function provide_fixed_versions() {
		return array(
			'fixed then unfixed' => array( array( '2.0', null ), null ),
			'unfixed then fixed' => array( array( null, '2.0' ), null ),
			'all fixed'          => array( array( '2.9', '2.10', '2.8' ), '2.10' ),
		);
	}
}
