<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';

/**
 * Test class for Jetpack_Sitemap_Manager
 *
 * @covers Jetpack_Sitemap_Manager
 */
#[CoversClass( Jetpack_Sitemap_Manager::class )]
class Jetpack_Sitemap_Manager_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var Jetpack_Sitemap_Manager
	 */
	private $manager;

	public function set_up() {
		parent::set_up();
		$this->manager = new Jetpack_Sitemap_Manager();
	}

	/**
	 * Constructor does not throw any fatal errors.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_constructor() {
		$manager = new Jetpack_Sitemap_Manager(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertTrue( true );
	}

	/**
	 * Tests default value of 'jetpack_sitemap_location' filter.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_filter_sitemap_location_sets_option_default() {
		// Start with an empty option.
		delete_option( 'jetpack_sitemap_location' );

		// Check default value.
		$this->manager->callback_action_filter_sitemap_location();
		$location = get_option( 'jetpack_sitemap_location' );
		$this->assertSame( '', $location );

		// Clean up.
		delete_option( 'jetpack_sitemap_location' );
	}

	/**
	 * Tests value of 'jetpack_sitemap_location' when a filter is added.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_filter_sitemap_location_sets_option_add() {
		// Start with an empty option.
		delete_option( 'jetpack_sitemap_location' );

		// Set the location.
		function add_location( $string ) { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction,Squiz.Commenting.FunctionComment.WrongStyle
			$string .= '/blah';
			return $string;
		}
		add_filter( 'jetpack_sitemap_location', 'add_location' );

		$this->manager->callback_action_filter_sitemap_location();
		$location = get_option( 'jetpack_sitemap_location' );
		$this->assertEquals( '/blah', $location );

		// Clean up.
		delete_option( 'jetpack_sitemap_location' );
	}

	/**
	 * Tests that the sitemap cron schedule is added correctly.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_adds_cron_schedule() {
		$schedules = array();
		$result    = $this->manager->callback_add_sitemap_schedule( $schedules );

		$this->assertArrayHasKey( 'sitemap-interval', $result );
		$this->assertEquals( 'Sitemap Interval', $result['sitemap-interval']['display'] );
		$this->assertEquals( JP_SITEMAP_INTERVAL, $result['sitemap-interval']['interval'] );
	}

	/**
	 * Tests that robots.txt is modified correctly.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_modifies_robotstxt() {
		ob_start();
		$this->manager->callback_action_do_robotstxt();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Sitemap: ', $output );
		$this->assertStringContainsString( 'sitemap.xml', $output );
		$this->assertStringContainsString( 'news-sitemap.xml', $output );
	}

	/**
	 * Tests that the news sitemap cache is flushed when a post is published.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_flushes_news_sitemap_cache() {
		// Set up a mock cache entry
		set_transient( 'jetpack_news_sitemap_xml', 'test cache data' );

		$this->manager->callback_action_flush_news_sitemap_cache();

		$this->assertFalse( get_transient( 'jetpack_news_sitemap_xml' ) );
	}

	/**
	 * Tests that all sitemap data is purged correctly.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_manager_purges_all_data() {
		// Set up mock data
		set_transient( 'jetpack_news_sitemap_xml', 'test cache data' );

		$this->manager->callback_action_purge_data();

		$this->assertFalse( get_transient( 'jetpack_news_sitemap_xml' ) );
	}

	/**
	 * Tests callback_filter_use_xmlwriter when has_blog_sticker function exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_callback_filter_use_xmlwriter_has_blog_sticker_returns_true() {
		$blog_id = 12345;
		// Mock Jetpack_Options::get_option to return the blog ID
		$jetpack_options_handle = \Patchwork\redefine(
			'Jetpack_Options::get_option',
			function ( $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return false;
			}
		);

		// Mock has_blog_sticker function to return true
		$has_blog_sticker_handle = \Patchwork\redefine(
			'has_blog_sticker',
			function ( $sticker, $passed_blog_id ) use ( $blog_id ) {
				if ( 'jetpack-sitemaps-use-xmlwriter' === $sticker && $blog_id === $passed_blog_id ) {
					return true;
				}
				return false;
			}
		);

		// Test with false input - should return true regardless
		$result = $this->manager->callback_filter_use_xmlwriter( false );
		$this->assertTrue( $result );

		// Test with true input - should still return true
		$result = $this->manager->callback_filter_use_xmlwriter( true );
		$this->assertTrue( $result );

		// Test with null input - should return true
		$result = $this->manager->callback_filter_use_xmlwriter( null );
		$this->assertTrue( $result );

		// Clean up mocks
		if ( $has_blog_sticker_handle ) {
			\Patchwork\restore( $has_blog_sticker_handle );
		}
		if ( $jetpack_options_handle ) {
			\Patchwork\restore( $jetpack_options_handle );
		}
	}

	/**
	 * Tests callback_filter_use_xmlwriter when has_blog_sticker exists but returns false,
	 * and wpcomsh_is_site_sticker_active exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_callback_filter_use_xmlwriter_wpcomsh_sticker_active_returns_true() {
		$blog_id = 12345;

		// Mock Jetpack_Options::get_option to return the blog ID
		$jetpack_options_handle = \Patchwork\redefine(
			'Jetpack_Options::get_option',
			function ( $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return false;
			}
		);

		// Mock has_blog_sticker function to return false
		$has_blog_sticker_handle = \Patchwork\redefine(
			'has_blog_sticker',
			function ( $sticker, $passed_blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		);

		// Mock wpcomsh_is_site_sticker_active function to return true
		$wpcomsh_sticker_handle = \Patchwork\redefine(
			'wpcomsh_is_site_sticker_active',
			function ( $sticker ) {
				if ( 'jetpack-sitemaps-use-xmlwriter' === $sticker ) {
					return true;
				}
				return false;
			}
		);

		// Test with false input - should return true
		$result = $this->manager->callback_filter_use_xmlwriter( false );
		$this->assertTrue( $result );

		// Test with true input - should return true
		$result = $this->manager->callback_filter_use_xmlwriter( true );
		$this->assertTrue( $result );

		// Clean up mocks
		if ( $wpcomsh_sticker_handle ) {
			\Patchwork\restore( $wpcomsh_sticker_handle );
		}
		if ( $has_blog_sticker_handle ) {
			\Patchwork\restore( $has_blog_sticker_handle );
		}
		if ( $jetpack_options_handle ) {
			\Patchwork\restore( $jetpack_options_handle );
		}
	}

	/**
	 * Tests callback_filter_use_xmlwriter when both functions exist but both return false.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_callback_filter_use_xmlwriter_both_functions_return_false() {
		$blog_id = 12345;

		// Mock Jetpack_Options::get_option to return the blog ID
		$jetpack_options_handle = \Patchwork\redefine(
			'Jetpack_Options::get_option',
			function ( $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return false;
			}
		);

		// Mock has_blog_sticker function to return false
		$has_blog_sticker_handle = \Patchwork\redefine(
			'has_blog_sticker',
			function ( $sticker, $passed_blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		);

		// Mock wpcomsh_is_site_sticker_active function to return false
		$wpcomsh_sticker_handle = \Patchwork\redefine(
			'wpcomsh_is_site_sticker_active',
			function ( $sticker ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		);

		// Test with false input - should return false (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( true );
		$this->assertTrue( $result );

		// Test with null input - should return null (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( null );
		$this->assertNull( $result );

		// Test with string input - should return string (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( 'test' );
		$this->assertEquals( 'test', $result );

		// Clean up mocks
		if ( $wpcomsh_sticker_handle ) {
			\Patchwork\restore( $wpcomsh_sticker_handle );
		}
		if ( $has_blog_sticker_handle ) {
			\Patchwork\restore( $has_blog_sticker_handle );
		}
		if ( $jetpack_options_handle ) {
			\Patchwork\restore( $jetpack_options_handle );
		}
	}

	/**
	 * Tests callback_filter_use_xmlwriter when neither function exists.
	 * This simulates environments where WordPress.com sticker functions are not available.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_callback_filter_use_xmlwriter_functions_do_not_exist() {
		// In normal Jetpack environment, these functions won't exist
		// so we don't need to mock function_exists, the code should behave correctly

		// Test with false input - should return false (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( true );
		$this->assertTrue( $result );

		// Test with null input - should return null (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( null );
		$this->assertNull( $result );

		// Test with array input - should return array (original value)
		$test_array = array( 'test' => 'value' );
		$result     = $this->manager->callback_filter_use_xmlwriter( $test_array );
		$this->assertEquals( $test_array, $result );
	}

	/**
	 * Tests callback_filter_use_xmlwriter when has_blog_sticker exists but returns false
	 * and wpcomsh_is_site_sticker_active does not exist.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_callback_filter_use_xmlwriter_only_has_blog_sticker_exists_returns_false() {
		$blog_id = 12345;

		// Mock Jetpack_Options::get_option to return the blog ID
		$jetpack_options_handle = \Patchwork\redefine(
			'Jetpack_Options::get_option',
			function ( $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return false;
			}
		);

		// Mock has_blog_sticker function to return false
		$has_blog_sticker_handle = \Patchwork\redefine(
			'has_blog_sticker',
			function ( $sticker, $passed_blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		);

		// Don't mock wpcomsh_is_site_sticker_active since it doesn't exist in test environment

		// Test with false input - should return false (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( true );
		$this->assertTrue( $result );

		// Clean up mocks
		if ( $has_blog_sticker_handle ) {
			\Patchwork\restore( $has_blog_sticker_handle );
		}
		if ( $jetpack_options_handle ) {
			\Patchwork\restore( $jetpack_options_handle );
		}
	}

	/**
	 * Tests callback_filter_use_xmlwriter when has_blog_sticker does not exist
	 * but wpcomsh_is_site_sticker_active exists and returns false.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_callback_filter_use_xmlwriter_only_wpcomsh_sticker_exists_returns_false() {
		// Mock wpcomsh_is_site_sticker_active to simulate it existing
		// Don't mock function_exists as it's complex, instead just mock the actual function

		// Mock wpcomsh_is_site_sticker_active function to return false
		$wpcomsh_sticker_handle = \Patchwork\redefine(
			'wpcomsh_is_site_sticker_active',
			function ( $sticker ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
		);

		// Test with false input - should return false (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = $this->manager->callback_filter_use_xmlwriter( true );
		$this->assertTrue( $result );

		// Clean up mocks
		if ( $wpcomsh_sticker_handle ) {
			\Patchwork\restore( $wpcomsh_sticker_handle );
		}
	}
}
