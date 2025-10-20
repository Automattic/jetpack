<?php
/**
 * Test class for WPCOMSH_Sitemap_Sticker_Handlers
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\Group;

/**
 * Class SitemapsStickerHandlersTest.
 */
class SitemapsStickerHandlersTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up test environment before each test
	 */
	public function set_up() {
		parent::set_up();

		// Load mock functions
		require_once __DIR__ . '/lib/mocks/sticker-functions.php';

		// Load the class
		$handlers_file = dirname( __DIR__ ) . '/sitemaps/class-wpcomsh-sitemap-sticker-handlers.php';
		if ( file_exists( $handlers_file ) ) {
			require_once $handlers_file;
		}
	}

	/**
	 * Clean up after each test
	 */
	public function tear_down() {
		// Clean up global variables
		unset( $GLOBALS['test_has_blog_sticker_return'] );
		unset( $GLOBALS['test_has_blog_sticker_args'] );

		parent::tear_down();
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when has_blog_sticker function exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_has_blog_sticker_returns_true() {
		$blog_id = 12345;

		// Mock Jetpack_Options::get_option to return the blog ID
		add_filter(
			'jetpack_options',
			function ( $value, $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return $value;
			},
			10,
			2
		);

		// Set up mock has_blog_sticker to return true for our test sticker
		$GLOBALS['test_has_blog_sticker_args'] = array(
			'sticker' => 'jetpack-sitemaps-suspend-cache-addition',
			'blog_id' => $blog_id,
		);

		// Test with false input - should return true regardless
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
		$this->assertTrue( $result );

		// Test with true input - should still return true
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
		$this->assertTrue( $result );
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when has_blog_sticker returns false.
	 * Since wpcomsh_is_site_sticker_active is a real function that depends on Atomic_Persistent_Data
	 * (which doesn't exist in test environment), it will return false, so the original value is preserved.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_has_blog_sticker_false_wpcomsh_real_function() {
		$blog_id = 12345;

		// Mock Jetpack_Options::get_option to return the blog ID
		add_filter(
			'jetpack_options',
			function ( $value, $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return $value;
			},
			10,
			2
		);

		// Set up mock has_blog_sticker to return false
		$GLOBALS['test_has_blog_sticker_return'] = false;

		// wpcomsh_is_site_sticker_active will return false since \Atomic_Persistent_Data doesn't exist
		// So the filter should return the original value

		// Test with false input - should return false (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
		$this->assertTrue( $result );
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when both functions exist but both return false.
	 * This test is now redundant with test_jetpack_sitemap_suspend_cache_addition_has_blog_sticker_false_wpcomsh_real_function
	 * since wpcomsh_is_site_sticker_active is a real function that will return false in test environment.
	 *
	 * Note: This test now verifies the same behavior as the previous test but with explicit documentation
	 * that both functions return false in the test environment.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_both_functions_return_false() {
		$blog_id = 12345;

		// Mock Jetpack_Options::get_option to return the blog ID
		add_filter(
			'jetpack_options',
			function ( $value, $option ) use ( $blog_id ) {
				if ( 'id' === $option ) {
					return $blog_id;
				}
				return $value;
			},
			10,
			2
		);

		// Set up mock has_blog_sticker to return false
		$GLOBALS['test_has_blog_sticker_return'] = false;

		// wpcomsh_is_site_sticker_active will return false since \Atomic_Persistent_Data doesn't exist
		// No need to mock it since it's a real function

		// Test with false input - should return false (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
		$this->assertTrue( $result );

		// Test with null input - should return null (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', null );
		$this->assertNull( $result );
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when neither function exists.
	 * This simulates environments where WordPress.com sticker functions are not available.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_functions_do_not_exist() {
		// In normal environment, these functions won't exist
		// so the filter should return the original value

		// Test with false input - should return false (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
		$this->assertTrue( $result );

		// Test with null input - should return null (original value)
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', null );
		$this->assertNull( $result );

		// Test with array input - should return array (original value)
		$test_array = array( 'test' => 'value' );
		$result     = apply_filters( 'jetpack_sitemap_suspend_cache_addition', $test_array );
		$this->assertEquals( $test_array, $result );
	}
}
