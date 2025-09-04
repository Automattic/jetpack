<?php
/**
 * Test class for sitemaps sticker handlers
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\Group;

// Load mock sticker functions
require_once __DIR__ . '/lib/mocks/sticker-functions.php';

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

		// Remove all existing filters to start fresh
		remove_all_filters( 'jetpack_sitemap_use_xmlwriter' );
		remove_all_filters( 'jetpack_sitemap_suspend_cache_addition' );

		// Load the sitemaps sticker handlers file to register the filters
		$handlers_file = dirname( __DIR__ ) . '/sitemaps/class-sitemaps-sticker-handlers.php';
		if ( file_exists( $handlers_file ) ) {
			require_once $handlers_file;
		}
	}

	/**
	 * Clean up after each test
	 */
	public function tear_down() {
		// Remove any filters we may have added
		remove_all_filters( 'jetpack_options' );

		// Reset global test variables
		unset( $GLOBALS['test_has_blog_sticker_return'] );
		unset( $GLOBALS['test_has_blog_sticker_args'] );
		unset( $GLOBALS['test_wpcomsh_sticker_return'] );
		unset( $GLOBALS['test_wpcomsh_sticker_args'] );

		parent::tear_down();
	}

	/**
	 * Tests jetpack_sitemap_use_xmlwriter filter when has_blog_sticker function exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_use_xmlwriter_has_blog_sticker_returns_true() {
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
			'sticker' => 'jetpack-sitemaps-use-xmlwriter',
			'blog_id' => $blog_id,
		);

		// Test with false input - should return true regardless
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
		$this->assertTrue( $result );

		// Test with true input - should still return true
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
		$this->assertTrue( $result );

		// Test with null input - should return true
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', null );
		$this->assertTrue( $result );
	}

	/**
	 * Tests jetpack_sitemap_use_xmlwriter filter when has_blog_sticker exists but returns false,
	 * and wpcomsh_is_site_sticker_active exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_use_xmlwriter_wpcomsh_sticker_active_returns_true() {
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

		// Set up mock wpcomsh_is_site_sticker_active to return true for our test sticker
		$GLOBALS['test_wpcomsh_sticker_args'] = array(
			'sticker' => 'jetpack-sitemaps-use-xmlwriter',
		);

		// Test with false input - should return true
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
		$this->assertTrue( $result );

		// Test with true input - should return true
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
		$this->assertTrue( $result );
	}

	/**
	 * Tests jetpack_sitemap_use_xmlwriter filter when both functions exist but both return false.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_use_xmlwriter_both_functions_return_false() {
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

		// Set up mock wpcomsh_is_site_sticker_active to return false
		$GLOBALS['test_wpcomsh_sticker_return'] = false;

		// Test with false input - should return false (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
		$this->assertTrue( $result );

		// Test with null input - should return null (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', null );
		$this->assertNull( $result );

		// Test with string input - should return string (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', 'test' );
		$this->assertEquals( 'test', $result );
	}

	/**
	 * Tests jetpack_sitemap_use_xmlwriter filter when neither function exists.
	 * This simulates environments where WordPress.com sticker functions are not available.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_use_xmlwriter_functions_do_not_exist() {
		// In normal environment, these functions won't exist
		// so the filter should return the original value

		// Test with false input - should return false (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
		$this->assertFalse( $result );

		// Test with true input - should return true (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
		$this->assertTrue( $result );

		// Test with null input - should return null (original value)
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', null );
		$this->assertNull( $result );

		// Test with array input - should return array (original value)
		$test_array = array( 'test' => 'value' );
		$result     = apply_filters( 'jetpack_sitemap_use_xmlwriter', $test_array );
		$this->assertEquals( $test_array, $result );
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
	 * Tests jetpack_sitemap_suspend_cache_addition filter when wpcomsh_is_site_sticker_active exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_wpcomsh_sticker_active_returns_true() {
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

		// Set up mock wpcomsh_is_site_sticker_active to return true for our test sticker
		$GLOBALS['test_wpcomsh_sticker_args'] = array(
			'sticker' => 'jetpack-sitemaps-suspend-cache-addition',
		);

		// Test with false input - should return true
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
		$this->assertTrue( $result );

		// Test with true input - should return true
		$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
		$this->assertTrue( $result );
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when both functions exist but both return false.
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

		// Set up mock wpcomsh_is_site_sticker_active to return false
		$GLOBALS['test_wpcomsh_sticker_return'] = false;

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

	/**
	 * Tests jetpack_sitemap_use_xmlwriter filter when Jetpack_Options::get_option returns false.
	 * This simulates error conditions where the blog ID cannot be retrieved.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_use_xmlwriter_jetpack_options_returns_false() {
		// Mock Jetpack_Options::get_option to return false
		add_filter(
			'jetpack_options',
			function ( $value, $option ) {
				if ( 'id' === $option ) {
					return false;
				}
				return $value;
			},
			10,
			2
		);

		// Set up mock has_blog_sticker to return false (should not be called with false blog ID)
		$GLOBALS['test_has_blog_sticker_return'] = false;

		// Set up mock wpcomsh_is_site_sticker_active to return true
		$GLOBALS['test_wpcomsh_sticker_args'] = array(
			'sticker' => 'jetpack-sitemaps-use-xmlwriter',
		);

		// Test with false input - should return true from wpcomsh fallback
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
		$this->assertTrue( $result );

		// Test with true input - should return true from wpcomsh fallback
		$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
		$this->assertTrue( $result );
	}
}
