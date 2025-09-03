<?php
/**
 * Test class for sitemaps sticker handlers
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
	 * Mock handle for Jetpack_Options::get_option
	 *
	 * @var mixed
	 */
	private $jetpack_options_handle;

	/**
	 * Mock handle for has_blog_sticker function
	 *
	 * @var mixed
	 */
	private $has_blog_sticker_handle;

	/**
	 * Mock handle for wpcomsh_is_site_sticker_active function
	 *
	 * @var mixed
	 */
	private $wpcomsh_sticker_handle;

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
		// Clean up individual mock functions to ensure proper test isolation
		if ( function_exists( 'Patchwork\restore' ) ) {
			if ( $this->jetpack_options_handle ) {
				\Patchwork\restore( $this->jetpack_options_handle );
				$this->jetpack_options_handle = null;
			}
			if ( $this->has_blog_sticker_handle ) {
				\Patchwork\restore( $this->has_blog_sticker_handle );
				$this->has_blog_sticker_handle = null;
			}
			if ( $this->wpcomsh_sticker_handle ) {
				\Patchwork\restore( $this->wpcomsh_sticker_handle );
				$this->wpcomsh_sticker_handle = null;
			}
		}

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
		if ( function_exists( 'Patchwork\redefine' ) ) {
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) use ( $blog_id ) {
					if ( 'id' === $option ) {
						return $blog_id;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to return true
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function ( $sticker, $passed_blog_id ) use ( $blog_id ) {
					if ( 'jetpack-sitemaps-use-xmlwriter' === $sticker && $blog_id === $passed_blog_id ) {
						return true;
					}
					return false;
				}
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
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
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

		if ( function_exists( 'Patchwork\redefine' ) ) {
			// Mock Jetpack_Options::get_option to return the blog ID
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) use ( $blog_id ) {
					if ( 'id' === $option ) {
						return $blog_id;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to return false
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function () {
					return false;
				}
			);

			// Mock wpcomsh_is_site_sticker_active function to return true
			$this->wpcomsh_sticker_handle = \Patchwork\redefine(
				'wpcomsh_is_site_sticker_active',
				function ( $sticker ) {
					if ( 'jetpack-sitemaps-use-xmlwriter' === $sticker ) {
						return true;
					}
					return false;
				}
			);

			// Test with false input - should return true
			$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
			$this->assertTrue( $result );

			// Test with true input - should return true
			$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
			$this->assertTrue( $result );
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
	}

	/**
	 * Tests jetpack_sitemap_use_xmlwriter filter when both functions exist but both return false.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_use_xmlwriter_both_functions_return_false() {
		$blog_id = 12345;

		if ( function_exists( 'Patchwork\redefine' ) ) {
			// Mock Jetpack_Options::get_option to return the blog ID
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) use ( $blog_id ) {
					if ( 'id' === $option ) {
						return $blog_id;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to return false
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function () {
					return false;
				}
			);

			// Mock wpcomsh_is_site_sticker_active function to return false
			$this->wpcomsh_sticker_handle = \Patchwork\redefine(
				'wpcomsh_is_site_sticker_active',
				function () {
					return false;
				}
			);

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
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
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

		if ( function_exists( 'Patchwork\redefine' ) ) {
			// Mock Jetpack_Options::get_option to return the blog ID
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) use ( $blog_id ) {
					if ( 'id' === $option ) {
						return $blog_id;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to return true
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function ( $sticker, $passed_blog_id ) use ( $blog_id ) {
					if ( 'jetpack-sitemaps-suspend-cache-addition' === $sticker && $blog_id === $passed_blog_id ) {
						return true;
					}
					return false;
				}
			);

			// Test with false input - should return true regardless
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
			$this->assertTrue( $result );

			// Test with true input - should still return true
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
			$this->assertTrue( $result );
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when wpcomsh_is_site_sticker_active exists and returns true.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_wpcomsh_sticker_active_returns_true() {
		$blog_id = 12345;

		if ( function_exists( 'Patchwork\redefine' ) ) {
			// Mock Jetpack_Options::get_option to return the blog ID
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) use ( $blog_id ) {
					if ( 'id' === $option ) {
						return $blog_id;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to return false
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function () {
					return false;
				}
			);

			// Mock wpcomsh_is_site_sticker_active function to return true
			$this->wpcomsh_sticker_handle = \Patchwork\redefine(
				'wpcomsh_is_site_sticker_active',
				function ( $sticker ) {
					if ( 'jetpack-sitemaps-suspend-cache-addition' === $sticker ) {
						return true;
					}
					return false;
				}
			);

			// Test with false input - should return true
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
			$this->assertTrue( $result );

			// Test with true input - should return true
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
			$this->assertTrue( $result );
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
	}

	/**
	 * Tests jetpack_sitemap_suspend_cache_addition filter when both functions exist but both return false.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_jetpack_sitemap_suspend_cache_addition_both_functions_return_false() {
		$blog_id = 12345;

		if ( function_exists( 'Patchwork\redefine' ) ) {
			// Mock Jetpack_Options::get_option to return the blog ID
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) use ( $blog_id ) {
					if ( 'id' === $option ) {
						return $blog_id;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to return false
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function () {
					return false;
				}
			);

			// Mock wpcomsh_is_site_sticker_active function to return false
			$this->wpcomsh_sticker_handle = \Patchwork\redefine(
				'wpcomsh_is_site_sticker_active',
				function () {
					return false;
				}
			);

			// Test with false input - should return false (original value)
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', false );
			$this->assertFalse( $result );

			// Test with true input - should return true (original value)
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', true );
			$this->assertTrue( $result );

			// Test with null input - should return null (original value)
			$result = apply_filters( 'jetpack_sitemap_suspend_cache_addition', null );
			$this->assertNull( $result );
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
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
		if ( function_exists( 'Patchwork\redefine' ) ) {
			// Mock Jetpack_Options::get_option to return false
			$this->jetpack_options_handle = \Patchwork\redefine(
				'Jetpack_Options::get_option',
				function ( $option ) {
					if ( 'id' === $option ) {
						return false;
					}
					return false;
				}
			);

			// Mock has_blog_sticker function to exist but should not be called with false blog ID
			$this->has_blog_sticker_handle = \Patchwork\redefine(
				'has_blog_sticker',
				function () {
					// Should not be called with false blog ID, but return false if it is
					return false;
				}
			);

			// Mock wpcomsh_is_site_sticker_active function to return true
			$this->wpcomsh_sticker_handle = \Patchwork\redefine(
				'wpcomsh_is_site_sticker_active',
				function ( $sticker ) {
					if ( 'jetpack-sitemaps-use-xmlwriter' === $sticker ) {
						return true;
					}
					return false;
				}
			);

			// Test with false input - should return true from wpcomsh fallback
			$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', false );
			$this->assertTrue( $result );

			// Test with true input - should return true from wpcomsh fallback
			$result = apply_filters( 'jetpack_sitemap_use_xmlwriter', true );
			$this->assertTrue( $result );
		} else {
			$this->markTestSkipped( 'Patchwork is not available for mocking functions.' );
		}
	}
}
