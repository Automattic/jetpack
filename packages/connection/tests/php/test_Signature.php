<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The SignatureTest class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Provides unit tests for the methods in the Jetpack_Signature class.
 */
class SignatureTest extends TestCase {
	/**
	 * Tests the Jetpack_Signature->join_with_equal_sign() method.
	 *
	 * @covers Automattic\Jetpack\Connection\Jetpack_Signature->join_with_equal_sign
	 * @dataProvider join_with_equal_sign_data_provider
	 *
	 * @param string       $name Query string key value.
	 * @param string|array $value Associated value for query string key.
	 * @param string|array $expected_output The expected output of $signature->join_with_equal_sign.
	 */
	public function test_join_with_equal_sign( $name, $value, $expected_output ) {
		$signature = new \Jetpack_Signature( 'some-secret', 0 );
		$this->assertEquals( $expected_output, $signature->join_with_equal_sign( $name, $value ) );
	}

	/**
	 * Data provider for test_join_with_equal_sign.
	 *
	 * The test data arrays have the format:
	 *    'name'            => The value that the constant will be set to. Null if the constant will not be set.
	 *    'value'           => The name of the constant.
	 *    'expected_output' => The expected output of Utils::jetpack_api_constant_filter().
	 */
	public function join_with_equal_sign_data_provider() {
		return array(
			'string_value'                   =>
				array(
					'name'            => 'street',
					'value'           => '1600 Pennsylvania Ave',
					'expected_output' => 'street=1600 Pennsylvania Ave',
				),
			'array_value'                    =>
				array(
					'name'            => 'first_names',
					'value'           => array( 'Michael', 'Jim', 'Pam' ),
					'expected_output' => array( 'first_names[0]=Michael', 'first_names[1]=Jim', 'first_names[2]=Pam' ),
				),
			'nested_array_value'             =>
				array(
					'name'            => 'numbers',
					'value'           => array( array( 0, 1 ), array( 2, 3 ), array( 4, 5 ) ),
					'expected_output' => array(
						'numbers[0][0]=0',
						'numbers[0][1]=1',
						'numbers[1][0]=2',
						'numbers[1][1]=3',
						'numbers[2][0]=4',
						'numbers[2][1]=5',
					),
				),
			'nested_associative_array_value' =>
				array(
					'name'            => 'people',
					'value'           => array(
						array(
							'last_name'  => 'Scott',
							'first_name' => 'Michael',
							'city'       => 'Boulder',
						),
						array(
							'first_name' => 'Jim',
							'state'      => 'Texas',
							'last_name'  => 'Halpert',
						),
					),
					// Note: Expected output is sorted.
					'expected_output' => array(
						'people[0][city]=Boulder',
						'people[0][first_name]=Michael',
						'people[0][last_name]=Scott',
						'people[1][first_name]=Jim',
						'people[1][last_name]=Halpert',
						'people[1][state]=Texas',
					),
				),
		);
	}
}
