<?php

/**
 * Tests for functions in functions.global.php
 */
class WP_Test_Functions_Global extends WP_UnitTestCase {
	/**
	 * Test string returned by jetpack_deprecated_function
	 *
	 * @covers ::jetpack_get_future_removed_version
	 * @since 8.8.0
	 * @dataProvider jetpack_deprecated_function_versions
	 *
	 * @param string $version  Version number passed to the function.
	 * @param string $expected Expected removed version number.
	 */
	public function test_jetpack_get_future_removed_version( $version, $expected ) {
		$removed_version = jetpack_get_future_removed_version( $version );

		$this->assertEquals( $expected, $removed_version );
	}

	/**
	 * Data provider for the test_jetpack_get_future_removed_version() test.
	 *
	 * @return Array test version numbers potentially passed to the function.
	 */
	public function jetpack_deprecated_function_versions() {
		return array(
			'no_version_number'                          => array(
				'jetpack',
				false,
			),
			'only_major_number'                          => array(
				'8.8',
				'9.4',
			),
			'full_version_number_without_text'           => array(
				'8.8.0',
				'9.4',
			),
			'full_version_number_with_jetpack_prepended' => array(
				'jetpack-8.8.0',
				'9.4',
			),
			'full_zero_version_number_with_jetpack'      => array(
				'jetpack-8.0.0',
				'8.6',
			),
			'semver_number_above_10'                     => array(
				'9.15.0',
				false,
			),
			'full_version_number_above_10'               => array(
				'10.5',
				'11.1',
			),
		);
	}

	/**
	 * Test jetpack_get_vary_headers.
	 *
	 * @dataProvider get_test_headers
	 * @covers ::jetpack_get_vary_headers
	 *
	 * @param array $headers  Array of headers.
	 * @param array $expected Expected array of headers, to be used as Vary header.
	 */
	public function test_jetpack_get_vary_headers( $headers, $expected ) {
		$vary_header_parts = jetpack_get_vary_headers( $headers );

		$this->assertEquals( $expected, $vary_header_parts );
	}

	/**
	 * Data provider for the test_jetpack_get_vary_headers() test.
	 *
	 * @return array
	 */
	public function get_test_headers() {
		return array(
			'no headers'                             => array(
				array(),
				array( 'accept', 'content-type' ),
			),
			'Single Vary Encoding header'            => array(
				array(
					'Vary: Accept-Encoding',
				),
				array( 'accept', 'content-type', 'accept-encoding' ),
			),
			'Double Vary: Accept-Encoding & Accept'  => array(
				array(
					'Vary: Accept, Accept-Encoding',
				),
				array( 'accept', 'content-type', 'accept-encoding' ),
			),
			'vary header'                            => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept',
				),
				array( 'accept', 'content-type' ),
			),
			'Wildcard Vary header'                   => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: *',
				),
				array( '*' ),
			),
			'Multiple Vary headers'                  => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: Accept',
					'Vary: Accept-Encoding',
				),
				array( 'accept', 'content-type', 'accept-encoding' ),
			),
			'Multiple Vary headers, with a wildcard' => array(
				array(
					'Cache-Control: no-cache, must-revalidate, max-age=0',
					'Content-Type: text/html; charset=UTF-8',
					'Vary: *',
					'Vary: Accept-Encoding',
				),
				array( '*' ),
			),
		);
	}
}
