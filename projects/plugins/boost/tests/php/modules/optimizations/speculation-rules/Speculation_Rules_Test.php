<?php
/**
 * Tests for Speculation_Rules class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Speculation_Rules;
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

		// Reset Mockery container at the start of each test
		Mockery::getContainer()->mockery_close();
	}

	/**
	 * Tear down test environment
	 */
	protected function tearDown(): void {
		Mockery::close();
		Monkey\tearDown();

		// Reset any loaded classes/mocks
		Mockery::getContainer()->mockery_close();

		parent::tearDown();
	}

	/**
	 * Test setup() when feature is available
	 */
	public function test_setup() {
		// Ensure WordPress functions are available
		if ( ! function_exists( 'add_action' ) ) {
			Monkey\Functions\when( 'add_action' )->justReturn( true );
		}

		// Expect add_action to be called once with correct parameters
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
	 * Test add_cornerstone_rules() with empty URLs
	 */
	public function test_add_cornerstone_rules_with_empty_urls() {
		// Set up Cornerstone_Utils mock for this test
		$cornerstone_utils_mock = Mockery::mock( 'alias:Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils' );
		$cornerstone_utils_mock->shouldReceive( 'get_list' )
			->once()
			->andReturn( array() );

		Monkey\Functions\stubs(
			array(
				'jetpack_boost_ds_get' => array(),
				'get_option'           => array(),
			)
		);

		$speculation_rules    = new Speculation_Rules();
		$wp_speculation_rules = new \WP_Speculation_Rules();
		$speculation_rules->add_cornerstone_rules( $wp_speculation_rules );

		// @phan-suppress-next-line PhanUndeclaredMethod -- In our polyfill, which this tests, just not core's version.
		$this->assertEmpty( $wp_speculation_rules->get_rules() );
	}

	/**
	 * Test add_cornerstone_rules() with valid URLs
	 */
	public function test_add_cornerstone_rules_with_valid_urls() {
		$test_urls = array( 'https://example.com/page1', 'https://example.com/page2' );

		// Set up Cornerstone_Utils mock for this test
		$cornerstone_utils_mock = Mockery::mock( 'alias:Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils' );
		$cornerstone_utils_mock->shouldReceive( 'get_list' )
			->once()
			->andReturn( $test_urls );

		// Rest of the test remains the same...
		Monkey\Functions\stubs(
			array(
				'wp_parse_url' => array(
					'host'   => 'example.com',
					'scheme' => 'https',
				),
			)
		);

		Monkey\Functions\stubs(
			array(
				'home_url' => 'https://example.com/',
			)
		);

		$speculation_rules    = new Speculation_Rules();
		$wp_speculation_rules = new \WP_Speculation_Rules();
		$speculation_rules->add_cornerstone_rules( $wp_speculation_rules );

		$output_test_urls = array_map(
			function ( $url ) {
				return trailingslashit( str_replace( 'https://example.com', '', $url ) );
			},
			$test_urls
		);
		// Assert that the rule was added correctly
		// @phan-suppress-next-line PhanUndeclaredMethod -- In our polyfill, which this tests, just not core's version.
		$rules = $wp_speculation_rules->get_rules();
		$this->assertCount( 1, $rules );
		$this->assertEquals( 'prerender', $rules[0]['type'] );
		$this->assertEquals( 'cornerstone-pages-prerender', $rules[0]['name'] );
		$this->assertEquals(
			array(
				'source'    => 'document',
				'where'     => array(
					'href_matches' => $output_test_urls,
				),
				'eagerness' => 'moderate',
			),
			$rules[0]['args']
		);
	}
}
