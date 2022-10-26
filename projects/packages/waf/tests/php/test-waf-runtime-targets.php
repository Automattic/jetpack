<?php
/**
 * Test WAF runtime target matching
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Operators;
use Automattic\Jetpack\Waf\Waf_Request;
use Automattic\Jetpack\Waf\Waf_Runtime;
use Automattic\Jetpack\Waf\Waf_Transforms;

/**
 * Runtime test suite.
 */
final class WafRuntimeTargetsTest extends PHPUnit\Framework\TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * Test key/value targets  REQUEST_HEADERS, TX, IP, REQUEST_COOKIES, ARGS, ARGS_POST, ARGS_GET, FILES
	 *
	 * @dataProvider provideArrayTargets
	 *
	 * @param Waf_Runtime                     $runtime                    The Waf_Runtime instance to use for the test (pre-loaded with items of mocked data).
	 * @param string                          $target_name                The modsecurity target name being tested, lowercase (examples: 'request_headers', 'tx', 'args', etc).
	 * @param array{ 0: string, 1: scalar }[] $expected_names_and_values  Array of key/value tuples, where `key` is the name of one of the three mocked items, and `value` is its value.
	 * @param string                          $second_name_regex          RegEx pattern that will match only the second item in the list.
	 */
	public function testArrayTargets( $runtime, $target_name, $expected_names_and_values, $second_name_regex ) {
		$expected_count = count( $expected_names_and_values );
		$expected       = array();
		foreach ( $expected_names_and_values as list( $exp_name, $exp_value ) ) {
			$expected[] = array(
				'name'   => $exp_name,
				'value'  => $exp_value,
				'source' => "$target_name:$exp_name",
			);
		}

		// test getting all values
		$values = $runtime->normalize_targets( array( $target_name => array() ) );
		$this->assertCount( $expected_count, $values, "$target_name 'all' test returned incorrect count" );
		foreach ( $expected as $exp ) {
			$this->assertContains( $exp, $values, "$target_name 'all' test did not contain " . json_encode( $exp ) . ' in ' . json_encode( $values ) );
		}
		// test "only" filter
		$values = $runtime->normalize_targets( array( $target_name => array( 'only' => array( $expected[1]['name'] ) ) ) );
		$this->assertCount( 1, $values, "$target_name 'only' test returned incorrect number of values" );
		$this->assertContains( $expected[1], $values, "$target_name 'only' test did not include value for '{$expected[1]['name']}'" );

		// test "only" filter with regex pattern
		$values = $runtime->normalize_targets( array( $target_name => array( 'only' => array( $second_name_regex ) ) ) );
		$this->assertCount( 1, $values, "$target_name 'only regex' test returned incorrect number of values" );
		$this->assertContains( $expected[1], $values, "$target_name 'only regex' test did not include value for '{$expected[1]['name']}'" );

		// test "except" filter
		$values = $runtime->normalize_targets( array( $target_name => array( 'except' => array( $expected[0]['name'] ) ) ) );
		$this->assertCount( $expected_count - 1, $values, "$target_name 'except' test returned incorrect number of values" );
		foreach ( $expected as $i => $exp ) {
			if ( 0 === $i ) {
				$this->assertNotContains( $exp, $values );
			} else {
				$this->assertContains( $exp, $values );
			}
		}

		// test "except" filter with regex pattern
		$values = $runtime->normalize_targets( array( $target_name => array( 'except' => array( $second_name_regex ) ) ) );
		$this->assertCount( $expected_count - 1, $values, "$target_name 'except regex' test returned incorrect number of values" );
		foreach ( $expected as $i => $exp ) {
			if ( 1 === $i ) {
				$this->assertNotContains( $exp, $values );
			} else {
				$this->assertContains( $exp, $values );
			}
		}

		// test that "except" has higher priority than "only"
		$values = $runtime->normalize_targets(
			array(
				$target_name => array(
					'only'   => array( $expected[0]['name'] ),
					'except' => array( $expected[0]['name'] ),
				),
			)
		);
		$this->assertCount( 0, $values, "$target_name 'only and except' test return more than zero values" );

		// test that "count" works
		$values = $runtime->normalize_targets( array( $target_name => array( 'count' => true ) ) );
		$this->assertCount( 1, $values, "$target_name 'count' test returned more than 1 value" );
		$this->assertContains(
			array(
				'name'   => $target_name,
				'value'  => $expected_count,
				'source' => "&$target_name",
			),
			$values,
			"$target_name 'count' test returned wrong count"
		);
	}

	/**
	 * Test all of the *_NAMES targets for the targets tested by testArrayTargets() above
	 *
	 * @dataProvider provideArrayTargetsNames
	 *
	 * @param Waf_Runtime                     $runtime                    The Waf_Runtime instance to use for the test (pre-loaded with items of mocked data).
	 * @param string                          $target_name                The modsecurity target name being tested (without the _NAMES), lowercase (examples: 'request_headers', 'tx', 'args', etc).
	 * @param array{ 0: string, 1: scalar }[] $expected_names_and_values  Array of key/value tuples, where `key` is the name of one of the three mocked items, and `value` is its value.
	 * @param string                          $second_name_regex          RegEx pattern that will match only the second item in the list.
	 */
	public function testArrayTargetsNames( $runtime, $target_name, $expected_names_and_values, $second_name_regex ) {
		$expected_count = count( $expected_names_and_values );
		$expected       = array();
		foreach ( $expected_names_and_values as $i => list( $exp_name ) ) {
			$expected[] = array(
				'name'   => "$i",
				'value'  => $exp_name,
				'source' => "$target_name:$i",
			);
		}

		// test getting all values
		$values = $runtime->normalize_targets( array( $target_name => array() ) );
		$this->assertCount( $expected_count, $values, "$target_name 'all' test returned incorrect count" );
		foreach ( $expected as $exp ) {
			$this->assertContains( $exp, $values );
		}

		// test "only" filter
		$values = $runtime->normalize_targets( array( $target_name => array( 'only' => array( $expected[1]['value'] ) ) ) );
		$this->assertCount( 1, $values );
		$this->assertContains( $expected[1], $values );

		// test "only" filter with regex pattern
		$values = $runtime->normalize_targets( array( $target_name => array( 'only' => array( $second_name_regex ) ) ) );
		$this->assertCount( 1, $values );
		$this->assertContains( $expected[1], $values );

		// test "except" filter
		$values = $runtime->normalize_targets( array( $target_name => array( 'except' => array( $expected[0]['value'] ) ) ) );
		$this->assertCount( $expected_count - 1, $values );
		foreach ( $expected as $i => $exp ) {
			if ( 0 === $i ) {
				$this->assertNotContains( $exp, $values );
			} else {
				$this->assertContains( $exp, $values );
			}
		}

		// test "except" filter with regex pattern
		$values = $runtime->normalize_targets( array( $target_name => array( 'except' => array( $second_name_regex ) ) ) );
		$this->assertCount( $expected_count - 1, $values );
		foreach ( $expected as $i => $exp ) {
			if ( 1 === $i ) {
				$this->assertNotContains( $exp, $values );
			} else {
				$this->assertContains( $exp, $values );
			}
		}

		// test that "except" has higher priority than "only"
		$values = $runtime->normalize_targets(
			array(
				$target_name => array(
					'only'   => array( $expected[0]['value'] ),
					'except' => array( $expected[0]['value'] ),
				),
			)
		);
		$this->assertCount( 0, $values );

		// test that "count" works
		$values = $runtime->normalize_targets( array( $target_name => array( 'count' => true ) ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => $target_name,
				'value'  => $expected_count,
				'source' => "&$target_name",
			),
			$values
		);
	}

	/**
	 * Provide data to test key/value targets suach as ARGS_NAMES, REQUEST_HEADERS_NAMES, etc.
	 */
	public function provideArrayTargetsNames() {
		// use the same output from provideArrayTargets(), but skip IP and TX
		foreach ( $this->provideArrayTargets() as $k => $v ) {
			if ( $k === 'TX' || $k === 'IP' ) {
				continue;
			}
			// change this data item key from ARGS to ARGS_NAMES
			$names_k = $k . '_NAMES';
			$names_v = $v;
			// change the target name from args to args_names;
			$names_v[1] .= '_names';
			yield $names_k => $names_v;
		}
	}

	/**
	 * Provide data to test key/value targets such as REQUEST_HEADERS, ARGS, TX, etc.
	 */
	public function provideArrayTargets() {
		// REQUEST_HEADERS
		$expected = array(
			array( 'header-a', 'testa' ),
			array( 'header-b', 'testb' ),
			array( 'header-c', 'testc' ),
		);
		$request  = $this->mock_request(
			array(
				'headers' => $expected,
			)
		);
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		yield 'REQUEST_HEADERS' => array( $runtime, 'request_headers', $expected, '/-b$/' );

		// TX
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators() );
		$expected = array(
			array( 'test_a', 'val_a' ),
			array( 'test_b', 'val_b' ),
			array( 'test_c', 'val_c' ),
		);
		foreach ( $expected as list ( $name, $value ) ) {
			$runtime->set_var( "tx.$name", $value );
		}
		yield 'TX' => array( $runtime, 'tx', $expected, '/_b$/' );

		// IP
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators() );
		$expected = array(
			array( 'test_a', 'val_a' ),
			array( 'test_b', 'val_b' ),
			array( 'test_c', 'val_c' ),
		);
		foreach ( $expected as list ( $name, $value ) ) {
			$runtime->set_var( "ip.$name", $value );
		}
		yield 'IP' => array( $runtime, 'ip', $expected, '/_b$/' );

		// REQUEST_COOKIES
		$expected = array(
			array( 'test_a', 'cookie_a' ),
			array( 'test_b', 'cookie_b' ),
			array( 'test_c', 'cookie_c' ),
		);
		$request  = $this->mock_request(
			array(
				'cookies' => $expected,
			)
		);
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		yield 'REQUEST_COOKIES' => array( $runtime, 'request_cookies', $expected, '/_b$/' );

		// ARGS
		$request  = $this->mock_request(
			array(
				'get_vars'  => array(
					array( 'get_var', 'get_val' ),
				),
				'post_vars' => array(
					array( 'post_var', 'post_val' ),
				),
			)
		);
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$expected = array(
			array( 'get_var', 'get_val' ),
			array( 'post_var', 'post_val' ),
		);
		yield 'ARGS' => array( $runtime, 'args', $expected, '/^post_/' );

		// ARGS_GET
		$request  = $this->mock_request(
			array(
				'get_vars' => array(
					array( 'scalar', 'scalar_val' ),
					array( 'array[0]', 'array_val_0' ),
					array( 'array[1]', 'array_val_1' ),
					array( 'assoc[key0]', 'value0' ),
					array( 'assoc[key1][key1a]', 'val1a' ),
				),
			)
		);
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$expected = array(
			array( 'scalar', 'scalar_val' ),
			array( 'array[0]', 'array_val_0' ),
			array( 'array[1]', 'array_val_1' ),
			array( 'assoc[key0]', 'value0' ),
			array( 'assoc[key1][key1a]', 'val1a' ),
		);
		yield 'ARGS_GET' => array( $runtime, 'args_get', $expected, '/\[0\]$/' );

		// ARGS_POST
		$request  = $this->mock_request(
			array(
				'post_vars' => array(
					array( 'scalar', 'scalar_val' ),
					array( 'array[0]', 'array_val_0' ),
					array( 'array[1]', 'array_val_1' ),
					array( 'assoc[key0]', 'value0' ),
					array( 'assoc[key1][key1a]', 'val1a' ),
				),
			)
		);
		$runtime  = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$expected = array(
			array( 'scalar', 'scalar_val' ),
			array( 'array[0]', 'array_val_0' ),
			array( 'array[1]', 'array_val_1' ),
			array( 'assoc[key0]', 'value0' ),
			array( 'assoc[key1][key1a]', 'val1a' ),
		);
		yield 'ARGS_POST' => array( $runtime, 'args_post', $expected, '/\[0\]$/' );

		// FILES
		$expected   = array(
			array( 'fileAA', 'file1' ),
			array( 'fileBB', 'file2' ),
			array( 'file[]', 'file3' ),
			array( 'file[]', 'file4' ),
		);
		$mock_files = array_map(
			function ( $item ) {
				return array(
					'name'     => $item[0],
					'filename' => $item[1],
				);
			},
			$expected
		);
		$request    = $this->mock_request(
			array(
				'files' => $mock_files,
			)
		);
		$runtime    = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		yield 'FILES' => array( $runtime, 'files', $expected, '/^fileBB$/' );
	}

	/**
	 * Test using REQUEST_METHOD target
	 */
	public function testNormalizeRequestMethod() {
		$request = $this->mock_request( array( 'method' => 'DELETE' ) );
		$runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$values  = $runtime->normalize_targets( array( 'request_method' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_method',
				'value'  => 'DELETE',
				'source' => 'request_method',
			),
			$values
		);
	}

	/**
	 * Test using REQUEST_PROTOCOL target
	 */
	public function testNormalizeRequestProtocol() {
		$request = $this->mock_request( array( 'protocol' => 'TEST' ) );
		$runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$values  = $runtime->normalize_targets( array( 'request_protocol' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_protocol',
				'value'  => 'TEST',
				'source' => 'request_protocol',
			),
			$values
		);
	}

	/**
	 * Test using REQUEST_URI, REQUEST_URI_RAW, REQUEST_FILENAME, REQUEST_BASENAME, and QUERY_STRING targets
	 */
	public function testNormalizeRequestUri() {
		$request = $this->mock_request( array( 'url' => array( 'https://wordpress.com', '/index.php', '?test=test' ) ) );
		$runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		// test request_uri
		$values = $runtime->normalize_targets( array( 'request_uri' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_uri',
				'value'  => '/index.php?test=test',
				'source' => 'request_uri',
			),
			$values
		);
		// test request_uri_raw
		$values = $runtime->normalize_targets( array( 'request_uri_raw' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_uri_raw',
				'value'  => 'https://wordpress.com/index.php?test=test',
				'source' => 'request_uri_raw',
			),
			$values
		);
		// test request_filename
		$values = $runtime->normalize_targets( array( 'request_filename' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_filename',
				'value'  => '/index.php',
				'source' => 'request_filename',
			),
			$values
		);
		// test request_basename
		$values = $runtime->normalize_targets( array( 'request_basename' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_basename',
				'value'  => 'index.php',
				'source' => 'request_basename',
			),
			$values
		);
		// test query_string
		$values = $runtime->normalize_targets( array( 'query_string' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'query_string',
				'value'  => '?test=test',
				'source' => 'query_string',
			),
			$values
		);
	}

	/**
	 * Test using REMOTE_ADDR target
	 */
	public function testNormalizeRemoteAddr() {
		$request = $this->mock_request( array( 'remote_addr' => 'test_remote_addr' ) );
		$runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$values  = $runtime->normalize_targets( array( 'remote_addr' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'remote_addr',
				'value'  => 'test_remote_addr',
				'source' => 'remote_addr',
			),
			$values
		);
	}

	/**
	 * Test using REQUEST_BODY target
	 */
	public function testNormalizeRequestBody() {
		$request = $this->mock_request( array( 'body' => 'test request body' ) );
		$runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$values  = $runtime->normalize_targets( array( 'request_body' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_body',
				'value'  => 'test request body',
				'source' => 'request_body',
			),
			$values
		);
	}

	/**
	 * Test using REQUEST_LINE target
	 */
	public function testNormalizeRequestLine() {
		$request = $this->mock_request(
			array(
				'method'   => 'GET',
				'url'      => array( 'https://wordpress.com', '/index.php', '?test=test' ),
				'protocol' => 'HTTP/1.2',
			)
		);
		$runtime = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators(), $request );
		$values  = $runtime->normalize_targets( array( 'request_line' => array() ) );
		$this->assertCount( 1, $values );
		$this->assertContains(
			array(
				'name'   => 'request_line',
				'value'  => 'GET /index.php?test=test HTTP/1.2',
				'source' => 'request_line',
			),
			$values
		);
	}

	/**
	 * Returned a Waf_Request instance with mocked data.
	 *
	 * @param array $data Key/value assoc. array of mocked data to pre-fill the request with.
	 * @return Waf_Request
	 */
	protected function mock_request( $data ) {
		$method_names = array_map(
			function ( $k ) {
				return "get_$k";
			},
			array_keys( $data )
		);
		$mock         = $this->createPartialMock( Waf_Request::class, $method_names );
		foreach ( $data as $k => $v ) {
			$mock->method( "get_$k" )->willReturn( $v );
		}
		return $mock;
	}
}
