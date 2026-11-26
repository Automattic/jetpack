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
use PHPUnit\Framework\Attributes\DataProvider;

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
	 * Test prerender patterns for Cornerstone Pages.
	 *
	 * @param string   $home_url The site home URL.
	 * @param string[] $test_urls The Cornerstone Page URLs.
	 * @param string[] $patterns The expected prerender patterns.
	 * @dataProvider provide_cornerstone_prerender_patterns
	 */
	#[DataProvider( 'provide_cornerstone_prerender_patterns' )]
	public function test_cornerstone_prerender_patterns( $home_url, $test_urls, $patterns ) {
		// Set up Cornerstone_Utils mock for this test
		$cornerstone_utils_mock = Mockery::mock( 'alias:Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils' );
		$cornerstone_utils_mock->shouldReceive( 'get_list' )
			->once()
			->andReturn( $test_urls );

		Monkey\Functions\when( 'home_url' )->justReturn( $home_url );
		Monkey\Functions\when( 'wp_parse_url' )->alias( 'parse_url' );

		$speculation_rules    = new Speculation_Rules();
		$wp_speculation_rules = new \WP_Speculation_Rules();
		$speculation_rules->add_cornerstone_rules( $wp_speculation_rules );

		// @phan-suppress-next-line PhanUndeclaredMethod -- In our polyfill, which this tests, just not core's version.
		$rules = $wp_speculation_rules->get_rules();
		$this->assertCount( 1, $rules );
		$this->assertEquals( 'prerender', $rules[0]['type'] );
		$this->assertEquals( 'cornerstone-pages-prerender', $rules[0]['name'] );
		$this->assertEquals(
			array(
				'source'    => 'document',
				'where'     => array(
					'href_matches' => $patterns,
				),
				'eagerness' => 'moderate',
			),
			$rules[0]['args']
		);
	}

	/**
	 * Provide home URLs, Cornerstone Pages, and their patterns.
	 *
	 * @return array<string, array{string, string[], string[]}>
	 */
	public static function provide_cornerstone_prerender_patterns() {
		$plain_host  = 'https://example.com';
		$custom_port = 'http://localhost:8081';
		$subdir      = $custom_port . '/blog';
		$patterns    = array( '/', '/about/', '/contact/' );

		return array(
			'plain host'               => array( $plain_host, array( $plain_host, $plain_host . '/about', $plain_host . '/contact/' ), $patterns ),
			'custom port'              => array( $custom_port, array( $custom_port, $custom_port . '/about', $custom_port . '/contact/' ), $patterns ),
			'custom-port subdirectory' => array(
				$subdir,
				array( $subdir, $subdir . '/about' ),
				array( '/blog/', '/blog/about/' ),
			),
		);
	}
}
