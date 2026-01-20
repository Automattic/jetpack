<?php
/**
 * Tests for LCP_Optimize_Img_Tag class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Optimize_Img_Tag;
use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryTestCase;

/**
 * Class LCP_Optimize_Img_Tag_Test
 *
 * Tests the optimizations object functionality in LCP_Optimize_Img_Tag.
 * Uses Brain Monkey to mock WordPress functions, avoiding cross-version compatibility issues.
 */
class LCP_Optimize_Img_Tag_Test extends MockeryTestCase {

	/**
	 * LCP type constant for standard images.
	 * Mirrors LCP::TYPE_IMAGE to avoid autoloading issues.
	 */
	const TYPE_IMAGE = 'img';

	/**
	 * LCP type constant for background images.
	 * Mirrors LCP::TYPE_BACKGROUND_IMAGE to avoid autoloading issues.
	 */
	const TYPE_BACKGROUND_IMAGE = 'background-image';

	/**
	 * Set up test environment
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Reset Mockery container at the start of each test
		Mockery::getContainer()->mockery_close();

		// Load mock LCP class to provide type constants
		require_once __DIR__ . '/class-mock-lcp.php';

		// Mock WordPress functions
		Functions\when( 'wp_http_validate_url' )->justReturn( true );
		Functions\when( 'remove_query_arg' )->alias(
			function ( $keys, $url ) {
				// Simple implementation for testing
				$parsed = parse_url( $url );
				if ( isset( $parsed['query'] ) ) {
					parse_str( $parsed['query'], $query_params );
					foreach ( (array) $keys as $key ) {
						unset( $query_params[ $key ] );
					}
					$query = http_build_query( $query_params );
					$url   = $parsed['scheme'] . '://' . $parsed['host'] . ( $parsed['path'] ?? '' );
					if ( $query ) {
						$url .= '?' . $query;
					}
				}
				return $url;
			}
		);

		// Mock Image CDN classes
		$cdn_mock = Mockery::mock( 'alias:Automattic\Jetpack\Image_CDN\Image_CDN' );
		$cdn_mock->shouldReceive( 'strip_image_dimensions_maybe' )->andReturnArg( 0 );

		$cdn_core_mock = Mockery::mock( 'alias:Automattic\Jetpack\Image_CDN\Image_CDN_Core' );
		$cdn_core_mock->shouldReceive( 'is_cdn_url' )->andReturn( false );
		$cdn_core_mock->shouldReceive( 'cdn_url' )->andReturnUsing(
			function ( $url ) {
				// Return a mock CDN URL
				$parsed = parse_url( $url );
				if ( ! is_array( $parsed ) || ! isset( $parsed['host'] ) ) {
					return $url;
				}
				return 'https://i0.wp.com/' . ltrim( $parsed['host'] . ( $parsed['path'] ?? '' ), '/' );
			}
		);

		// Load mock WP_HTML_Tag_Processor class
		require_once __DIR__ . '/class-wp-html-tag-processor.php';
	}

	/**
	 * Tear down test environment
	 */
	protected function tearDown(): void {
		Mockery::close();
		Monkey\tearDown();
		Mockery::getContainer()->mockery_close();
		parent::tearDown();
	}

	/**
	 * Create a test LCP data array.
	 *
	 * @param array|null $optimizations Optional optimizations object. If null, no optimizations key is added.
	 * @return array The LCP data array.
	 */
	private function create_lcp_data( $optimizations = null ) {
		$data = array(
			'success'     => true,
			'type'        => self::TYPE_IMAGE,
			'selector'    => 'img.wp-post-image',
			'html'        => '<img class="wp-post-image" id="test-img" src="https://example.com/image.jpg">',
			'url'         => 'https://example.com/image.jpg',
			'breakpoints' => array(
				array(
					'maxWidth'        => 768,
					'minWidth'        => 481,
					'widthValue'      => '100vw',
					'imageDimensions' => array(
						array(
							'width'  => 768,
							'height' => 500,
						),
					),
				),
				array(
					'maxWidth'        => 480,
					'minWidth'        => 0,
					'widthValue'      => '100vw',
					'imageDimensions' => array(
						array(
							'width'  => 480,
							'height' => 320,
						),
					),
				),
			),
		);

		if ( $optimizations !== null ) {
			$data['optimizations'] = $optimizations;
		}

		return $data;
	}

	/**
	 * Get the default optimizations object with all optimizations enabled.
	 *
	 * @return array The default optimizations.
	 */
	private function get_default_optimizations() {
		return array(
			'fetchpriority' => true,
			'loading'       => true,
			'cdnUrl'        => true,
			'srcset'        => true,
		);
	}

	/**
	 * Get a test HTML buffer containing an LCP image.
	 *
	 * @return string The HTML buffer.
	 */
	private function get_test_buffer() {
		return '<html><head></head><body><img class="wp-post-image" id="test-img" src="https://example.com/image.jpg" alt="Test Image"></body></html>';
	}

	/**
	 * Test that all optimizations are applied by default when no optimizations object exists.
	 *
	 * This ensures backward compatibility with old cloud responses.
	 */
	public function test_optimize_image_applies_all_optimizations_by_default() {
		// Create LCP data without optimizations object (old cloud response)
		$lcp_data = $this->create_lcp_data( null );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// Core optimizations should be applied
		$this->assertStringContainsString( 'fetchpriority="high"', $result );
		$this->assertStringContainsString( 'loading="eager"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test that all optimizations are applied when all are enabled in the optimizations object.
	 */
	public function test_optimize_image_applies_all_optimizations_when_all_enabled() {
		$lcp_data = $this->create_lcp_data( $this->get_default_optimizations() );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// All optimizations should be applied
		$this->assertStringContainsString( 'fetchpriority="high"', $result );
		$this->assertStringContainsString( 'loading="eager"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test that fetchpriority is skipped when disabled in the optimizations object.
	 */
	public function test_optimize_image_skips_fetchpriority_when_disabled() {
		$optimizations                  = $this->get_default_optimizations();
		$optimizations['fetchpriority'] = false;
		$lcp_data                       = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// fetchpriority should NOT be present
		$this->assertStringNotContainsString( 'fetchpriority=', $result );

		// Other optimizations should still be applied
		$this->assertStringContainsString( 'loading="eager"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test that loading attribute is skipped when disabled in the optimizations object.
	 */
	public function test_optimize_image_skips_loading_when_disabled() {
		$optimizations            = $this->get_default_optimizations();
		$optimizations['loading'] = false;
		$lcp_data                 = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// loading="eager" should NOT be present
		$this->assertStringNotContainsString( 'loading="eager"', $result );

		// Other optimizations should still be applied
		$this->assertStringContainsString( 'fetchpriority="high"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test that CDN URL transformation is skipped when disabled in the optimizations object.
	 */
	public function test_optimize_image_skips_cdn_url_when_disabled() {
		$optimizations           = $this->get_default_optimizations();
		$optimizations['cdnUrl'] = false;
		$lcp_data                = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// The src attribute should still be the original URL (not transformed to CDN)
		$this->assertStringContainsString( 'src="https://example.com/image.jpg"', $result );

		// Other optimizations should still be applied
		$this->assertStringContainsString( 'fetchpriority="high"', $result );
		$this->assertStringContainsString( 'loading="eager"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test that srcset/sizes are skipped when disabled in the optimizations object.
	 *
	 * This is the case when custom focal points are detected - resize would
	 * use center-crop, losing the author's intended object-position.
	 *
	 * Note: With mocked WP_HTML_Tag_Processor, srcset generation is not fully tested.
	 * This test verifies that the srcset flag is respected.
	 */
	public function test_optimize_image_skips_srcset_when_disabled() {
		$optimizations           = $this->get_default_optimizations();
		$optimizations['srcset'] = false;
		$lcp_data                = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// srcset should NOT be present (our mock doesn't add it when disabled)
		$this->assertStringNotContainsString( 'srcset=', $result );

		// Other optimizations should still be applied
		$this->assertStringContainsString( 'fetchpriority="high"', $result );
		$this->assertStringContainsString( 'loading="eager"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test that data-jp-lcp-optimized attribute is always added regardless of other optimizations.
	 */
	public function test_optimize_image_always_adds_data_attribute() {
		// Even with all optimizations disabled, the data attribute should be added
		$optimizations = array(
			'fetchpriority' => false,
			'loading'       => false,
			'cdnUrl'        => false,
			'srcset'        => false,
		);
		$lcp_data      = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// data-jp-lcp-optimized should ALWAYS be present
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}

	/**
	 * Test with multiple optimizations disabled simultaneously.
	 */
	public function test_optimize_image_with_multiple_optimizations_disabled() {
		$optimizations = array(
			'fetchpriority' => false,
			'loading'       => true,
			'cdnUrl'        => false,
			'srcset'        => false,
		);
		$lcp_data      = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// Only loading should be applied
		$this->assertStringNotContainsString( 'fetchpriority=', $result );
		$this->assertStringContainsString( 'loading="eager"', $result );
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
		// src should remain original (cdnUrl disabled)
		$this->assertStringContainsString( 'src="https://example.com/image.jpg"', $result );
	}

	/**
	 * Test that optimize_buffer returns original buffer when LCP data is invalid.
	 */
	public function test_optimize_buffer_returns_original_when_lcp_data_invalid() {
		$lcp_data = array(
			'success' => false,
			'type'    => self::TYPE_IMAGE,
		);

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$buffer    = $this->get_test_buffer();
		$result    = $optimizer->optimize_buffer( $buffer );

		// Buffer should be unchanged
		$this->assertEquals( $buffer, $result );
	}

	/**
	 * Test that optimize_buffer returns original buffer when type is not an image.
	 */
	public function test_optimize_buffer_returns_original_when_type_is_not_image() {
		$lcp_data         = $this->create_lcp_data( $this->get_default_optimizations() );
		$lcp_data['type'] = self::TYPE_BACKGROUND_IMAGE;

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$buffer    = $this->get_test_buffer();
		$result    = $optimizer->optimize_buffer( $buffer );

		// Buffer should be unchanged because type is background-image
		$this->assertEquals( $buffer, $result );
	}

	/**
	 * Test that optimize_buffer returns original buffer when image is not found in buffer.
	 */
	public function test_optimize_buffer_returns_original_when_image_not_found() {
		$lcp_data = $this->create_lcp_data( $this->get_default_optimizations() );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		// Buffer without the matching image
		$buffer = '<html><body><img class="different-class" src="https://other.com/other.jpg"></body></html>';
		$result = $optimizer->optimize_buffer( $buffer );

		// Buffer should be unchanged
		$this->assertEquals( $buffer, $result );
	}

	/**
	 * Test behavior with empty optimizations object (all keys missing).
	 *
	 * When the optimizations object exists but keys are missing,
	 * the code checks for empty() which would be true for missing keys.
	 */
	public function test_optimize_image_with_empty_optimizations_object() {
		// Empty optimizations object - all will be skipped
		$lcp_data = $this->create_lcp_data( array() );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// With empty optimizations object, empty() check will return true for missing keys
		// so optimizations won't be applied
		$this->assertStringNotContainsString( 'fetchpriority=', $result );
		$this->assertStringNotContainsString( 'loading="eager"', $result );

		// data attribute should still be added
		$this->assertStringContainsString( 'data-jp-lcp-optimized="true"', $result );
	}
}
