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
	 *    'expected_output' => The expected output of $signature->join_with_equal_sign.
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
			'associative_array_value'        =>
				array(
					'name'            => 'numbers',
					'value'           => array(
						'one' => 1,
						'two' => 2,
					),
					'expected_output' => array( 'numbers[one]=1', 'numbers[two]=2' ),
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

	/**
	 * Tests the Jetpack_Signature->normalized_query_parameters() method.
	 *
	 * @covers Automattic\Jetpack\Connection\Jetpack_Signature->normalized_query_parameters
	 * @dataProvider normalized_query_parameters_data_provider
	 *
	 * @param string       $query_string Query string key value.
	 * @param string|array $expected_output The expected output of $signature->normalized_query_parameters.
	 */
	public function test_normalized_query_parameters( $query_string, $expected_output ) {
		$signature = new \Jetpack_Signature( 'some-secret', 0 );
		$this->assertEquals( $expected_output, $signature->normalized_query_parameters( $query_string ) );
	}

	/**
	 * Data provider for test_join_with_equal_sign.
	 *
	 * The test data arrays have the format:
	 *    'name'            => The value that the constant will be set to. Null if the constant will not be set.
	 *    'value'           => The name of the constant.
	 *    'expected_output' => The expected output of $signature->normalized_query_parameters().
	 */
	public function normalized_query_parameters_data_provider() {
		return array(
			'signature_omitted' =>
				array(
					'query_string'    => 'size=10&signature=super-secret',
					'expected_output' => array(
						'size=10',
					),
				),
			'query_key_sort'    =>
				array(
					'query_string'    => 'size=10&highlight_fields%5B0%5D=title&highlight_fields%5B1%5D=content&aggregations%5Btaxonomy_1%5D%5Bterms%5D%5Bfield%5D=taxonomy.xposts.slug_slash_name&aggregations%5Btaxonomy_1%5D%5Bterms%5D%5Bsize%5D=5&fields%5B0%5D=date&fields%5B1%5D=permalink.url.raw&query=journey',
					'expected_output' => array(
						'query=journey',
						// Note that size has been sorted below query.
						'size=10',
						array(
							'aggregations[taxonomy_1][terms][field]=taxonomy.xposts.slug_slash_name',
							'aggregations[taxonomy_1][terms][size]=5',
						),
						array(
							'fields[0]=date',
							'fields[1]=permalink.url.raw',
						),
						// Note that highlight_fields has been sorted below aggregations and fields.
						array(
							'highlight_fields[0]=title',
							'highlight_fields[1]=content',
						),
					),
				),
		);
	}
}
