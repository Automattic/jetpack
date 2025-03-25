<?php
/**
 * Tests for Speculation_Rules class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Speculation_Rules;

use Automattic\Jetpack_Boost\Lib\Speculation_Rules\Speculation_Rules;
use Brain\Monkey;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryTestCase;

/**
 * Class Test_Speculation_Rules
 */
class Speculation_Rules_Test extends MockeryTestCase {

	/**
	 * Set up test environment
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tear down test environment
	 */
	protected function tearDown(): void {
		Mockery::close();
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test setup() when prerender is enabled
	 */
	public function test_setup_when_prerender_enabled() {
		// Mock the data store get function with explicit return value
		Monkey\Functions\expect( 'jetpack_boost_ds_get' )
			->once()
			->with( 'prerender_cornerstone_pages' )  // Add explicit parameter
			->andReturn( true );

		// Ensure WordPress functions are available
		if ( ! function_exists( 'add_action' ) ) {
			Monkey\Functions\when( 'add_action' )->justReturn( true );
		}

		// More specific expectation for add_action
		Monkey\Functions\expect( 'add_action' )
			->once()
			->with(
				'wp_load_speculation_rules',
				Mockery::on(
					function ( $callback ) {
						return is_array( $callback )
							&& isset( $callback[0] )
							&& $callback[0] instanceof Speculation_Rules
							&& isset( $callback[1] )
							&& $callback[1] === 'add_cornerstone_rules';
					}
				)
			);

		$speculation_rules = new Speculation_Rules();
		$speculation_rules->setup();
	}

	/**
	 * Test setup() when prerender is disabled
	 */
	public function test_setup_when_prerender_disabled() {
		// Mock the data store get function to return false
		Monkey\Functions\stubs(
			array(
				'jetpack_boost_ds_get' => false,
			)
		);

		// Expect add_action to never be called
		Monkey\Functions\expect( 'add_action' )->never();

		$speculation_rules = new Speculation_Rules();
		$speculation_rules->setup();

		// Brain\Monkey verifies expectations automatically at the end of each test
		// No need for explicit assertion as the test will fail if expectations aren't met
	}

	/**
	 * Test add_cornerstone_rules() with empty URLs
	 */
	public function test_add_cornerstone_rules_with_empty_urls() {
		// Mock the data store get function to return empty array
		Monkey\Functions\stubs(
			array(
				'jetpack_boost_ds_get' => array(),
			)
		);

		// Create a proper mock for WP_Speculation_Rules
		$wp_speculation_rules = Mockery::mock( 'WP_Speculation_Rules' );
		$wp_speculation_rules->shouldReceive( 'add_rule' )->never();

		$speculation_rules = new Speculation_Rules();
		$speculation_rules->add_cornerstone_rules( $wp_speculation_rules );

		// No need for explicit assertion - Mockery will verify expectations automatically
	}

	/**
	 * Test add_cornerstone_rules() with valid URLs
	 */
	public function test_add_cornerstone_rules_with_valid_urls() {
		$test_urls = array( 'https://example.com/page1', 'https://example.com/page2' );

		// Mock the data store get function to return test URLs
		Monkey\Functions\stubs(
			array(
				'jetpack_boost_ds_get' => $test_urls,
			)
		);

		// Create a proper mock for WP_Speculation_Rules
		$wp_speculation_rules = Mockery::mock( 'WP_Speculation_Rules' );
		$wp_speculation_rules->expects()->add_rule(
			'prerender',
			'cornerstone-pages-prerender',
			array(
				'source'    => 'list',
				'urls'      => $test_urls,
				'eagerness' => 'moderate',
			)
		)->once();

		$speculation_rules = new Speculation_Rules();
		$speculation_rules->add_cornerstone_rules( $wp_speculation_rules );
	}
}
