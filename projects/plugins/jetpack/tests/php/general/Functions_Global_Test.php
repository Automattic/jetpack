<?php

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for functions in functions.global.php
 *
 * @covers ::jetpack_get_future_removed_version
 * @covers ::jetpack_get_vary_headers
 * @covers ::jetpack_is_internal_testing_environment
 */
#[CoversFunction( 'jetpack_get_future_removed_version' )]
#[CoversFunction( 'jetpack_get_vary_headers' )]
#[CoversFunction( 'jetpack_is_internal_testing_environment' )]
class Functions_Global_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Saved siteurl option for restoration in tear_down.
	 *
	 * @var string|null
	 */
	private $saved_siteurl;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->saved_siteurl = get_option( 'siteurl' );
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		if ( null !== $this->saved_siteurl ) {
			update_option( 'siteurl', $this->saved_siteurl );
		}
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		parent::tear_down();
	}

	/**
	 * Test string returned by jetpack_deprecated_function
	 *
	 * @since 8.8.0
	 * @dataProvider jetpack_deprecated_function_versions
	 *
	 * @param string $version  Version number passed to the function.
	 * @param string $expected Expected removed version number.
	 */
	#[DataProvider( 'jetpack_deprecated_function_versions' )]
	public function test_jetpack_get_future_removed_version( $version, $expected ) {
		$removed_version = jetpack_get_future_removed_version( $version );

		$this->assertEquals( $expected, $removed_version );
	}

	/**
	 * Data provider for the test_jetpack_get_future_removed_version() test.
	 *
	 * @return Array test version numbers potentially passed to the function.
	 */
	public static function jetpack_deprecated_function_versions() {
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
	 * Test jetpack_is_internal_testing_environment returns false for a production domain.
	 */
	public function test_jetpack_is_internal_testing_environment_returns_false_for_production() {
		$this->assertFalse( jetpack_is_internal_testing_environment() );
	}

	/**
	 * Test jetpack_is_internal_testing_environment returns true for localhost.
	 */
	public function test_jetpack_is_internal_testing_environment_true_for_localhost() {
		update_option( 'siteurl', 'http://localhost:8888' );
		$this->assertTrue( jetpack_is_internal_testing_environment() );
	}

	/**
	 * Test jetpack_is_internal_testing_environment returns true for jurassic.ninja domain.
	 */
	public function test_jetpack_is_internal_testing_environment_true_for_jurassic_ninja() {
		update_option( 'siteurl', 'https://mysite.jurassic.ninja' );
		$this->assertTrue( jetpack_is_internal_testing_environment() );
	}

	/**
	 * Test jetpack_is_internal_testing_environment returns true for jurassic.tube domain.
	 */
	public function test_jetpack_is_internal_testing_environment_true_for_jurassic_tube() {
		update_option( 'siteurl', 'https://mysite.jurassic.tube' );
		$this->assertTrue( jetpack_is_internal_testing_environment() );
	}
}
