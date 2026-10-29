<?php
/**
 * Tests for LCP_Optimize_Img_Tag class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\Lcp;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Optimize_Img_Tag;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_HTML_Tag_Processor;

/**
 * Class LCP_Optimize_Img_Tag_Test
 *
 * Tests the optimizations object functionality in LCP_Optimize_Img_Tag.
 */
class LCP_Optimize_Img_Tag_Test extends BaseTestCase {

	/**
	 * Set up test environment
	 */
	public function set_up() {
		parent::set_up();

		// Skip the optimization check that requires full WordPress
		add_filter( 'jetpack_boost_pre_should_skip_lcp_optimization', '__return_false' );

		// Mock Image CDN to return predictable URLs
		add_filter(
			'jetpack_photon_url',
			function ( $url ) {
				$parsed = wp_parse_url( $url );
				if ( ! is_array( $parsed ) || ! isset( $parsed['host'] ) ) {
					return $url;
				}
				return 'https://i0.wp.com/' . ltrim( $parsed['host'] . ( $parsed['path'] ?? '' ), '/' );
			}
		);
	}

	/**
	 * Tear down test environment
	 */
	public function tear_down() {
		parent::tear_down();
		remove_all_filters( 'jetpack_photon_url' );
		remove_all_filters( 'jetpack_boost_pre_should_skip_lcp_optimization' );
		remove_all_filters( 'jetpack_photon_development_mode' );
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
			'type'        => Lcp::TYPE_IMAGE,
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
	 * Test that srcset/sizes are skipped when disabled in the optimizations object.
	 *
	 * This is the case when custom focal points are detected - resize would
	 * use center-crop, losing the author's intended object-position.
	 */
	public function test_optimize_image_skips_srcset_when_disabled() {
		$optimizations           = $this->get_default_optimizations();
		$optimizations['srcset'] = false;
		$lcp_data                = $this->create_lcp_data( $optimizations );

		$optimizer = new LCP_Optimize_Img_Tag( $lcp_data );
		$result    = $optimizer->optimize_buffer( $this->get_test_buffer() );

		// srcset should NOT be present
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
	}

	/**
	 * Test that optimize_buffer returns original buffer when LCP data is invalid.
	 */
	public function test_optimize_buffer_returns_original_when_lcp_data_invalid() {
		$lcp_data = array(
			'success' => false,
			'type'    => Lcp::TYPE_IMAGE,
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
		$lcp_data['type'] = Lcp::TYPE_BACKGROUND_IMAGE;

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

	/**
	 * 'imageDimensions' is an optional field, so the consumer has to guard what it
	 * indexes directly. An absent one is "foreach() argument must be of type
	 * array|object, null given" plus an undefined-key warning, on wp_head.
	 *
	 * Asserted through the srcset rather than through an unchanged buffer: these
	 * records still optimize and just contribute no widths, so "the page rendered" is
	 * not on its own evidence that the guard ran.
	 */
	public function test_an_absent_field_is_a_skipped_breakpoint_not_a_warning() {
		$buffer = $this->get_test_buffer();

		// Applied to every breakpoint in the fixture, not just the first: the srcset
		// is the union of all of them, so one intact breakpoint would supply widths
		// and hide the skip.
		$omissions = array(
			'no imageDimensions on a breakpoint'      => function ( $breakpoint ) {
				unset( $breakpoint['imageDimensions'] );
				return $breakpoint;
			},
			'an imageDimensions entry with no width'  => function ( $breakpoint ) {
				unset( $breakpoint['imageDimensions'][0]['width'] );
				return $breakpoint;
			},
			'an imageDimensions entry with no height' => function ( $breakpoint ) {
				unset( $breakpoint['imageDimensions'][0]['height'] );
				return $breakpoint;
			},
		);

		foreach ( $omissions as $label => $omit ) {
			$data                = $this->create_lcp_data( $this->get_default_optimizations() );
			$data['breakpoints'] = array_map( $omit, $data['breakpoints'] );

			$this->assertStringNotContainsString(
				'srcset=',
				( new LCP_Optimize_Img_Tag( $data ) )->optimize_buffer( $buffer ),
				$label . ': a breakpoint with nothing to size from must be skipped rather than indexed.'
			);
		}
	}

	/**
	 * @dataProvider srcset_cases
	 */
	#[DataProvider( 'srcset_cases' )]
	public function test_srcset_keeps_the_image_proportions_at_the_box_density( $attributes, $expected_candidates, $src = 'https://example.com/image.jpg', $computed_object_fit = null ) {
		add_filter( 'jetpack_photon_development_mode', '__return_false' );

		$data = $this->create_lcp_data();
		if ( $computed_object_fit ) {
			$data['objectFit'] = $computed_object_fit;
		}
		$data['breakpoints'] = array(
			array(
				'maxWidth'        => 412,
				'widthValue'      => '412px',
				'imageDimensions' => array(
					array(
						'width'  => 412,
						'height' => 700,
					),
				),
			),
		);

		// Boost swaps a WordPress size for its original only if the original is on disk.
		$original = null;
		if ( str_contains( $src, '{uploads}' ) ) {
			$uploads = wp_get_upload_dir();
			wp_mkdir_p( $uploads['basedir'] );
			$original = $uploads['basedir'] . '/image.jpg';
			file_put_contents( $original, '' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$src = str_replace( '{uploads}', $uploads['baseurl'], $src );
		}

		$buffer = '<img class="wp-post-image" id="test-img" ' . $attributes . ' src="' . $src . '">';
		$result = '';
		try {
			$result = ( new LCP_Optimize_Img_Tag( $data ) )->optimize_buffer( $buffer );
		} finally {
			if ( $original ) {
				wp_delete_file( $original );
			}
		}

		$processor = new WP_HTML_Tag_Processor( $result );
		$processor->next_tag( 'img' );

		$candidates = array();
		foreach ( explode( ', ', (string) $processor->get_attribute( 'srcset' ) ) as $candidate ) {
			list( $url, $descriptor ) = explode( ' ', $candidate );
			parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

			$candidates[] = ( $args['resize'] ?? '' ) . ' ' . $descriptor;
		}

		// Each descriptor is the 412px slot times a DPR, whatever size the file is.
		$this->assertSame( '412px', $processor->get_attribute( 'sizes' ) );
		$this->assertSame( $expected_candidates, $candidates );
	}

	/**
	 * A 412x700 box at 1x, 1.75x, 2x and 3x, described as resize and descriptor.
	 *
	 * @return array[]
	 */
	public static function srcset_cases() {
		return array(
			'no dimensions: the box'                      => array( '', array( '1236,2100 1236w', '824,1400 824w', '721,1225 721w', '412,700 412w' ) ),
			'a 3:2 image with no fit in the markup: widened, not cropped' => array( 'width="1200" height="800"', array( '3150,2100 1236w', '2100,1400 824w', '1838,1225 721w', '1050,700 412w' ) ),
			'object-fit: contain (Featured Image Scale): fits inside the box' => array( 'width="1200" height="800" style="aspect-ratio:3/5;object-fit:contain;"', array( '1236,825 1236w', '824,550 824w', '721,481 721w', '412,275 412w' ) ),
			'a -600x400 size with 300x300 attributes: the size wins' => array( 'width="300" height="300"', array( '3150,2100 1236w', '2100,1400 824w', '1838,1225 721w', '1050,700 412w' ), '{uploads}/image-600x400.jpg' ),
			'a -600x400 size with a query string: the size wins' => array( 'width="300" height="300"', array( '3150,2100 1236w', '2100,1400 824w', '1838,1225 721w', '1050,700 412w' ), '{uploads}/image-600x400.jpg?ver=2' ),
			'a -2x1 name with no original to swap in: the attributes' => array( 'width="1200" height="800"', array( '3150,2100 1236w', '2100,1400 824w', '1838,1225 721w', '1050,700 412w' ), '{uploads}/banner-2x1.jpg' ),
			'object-fit: contain then cover: the last wins' => array( 'width="1200" height="800" style="object-fit:contain;object-fit:cover"', array( '1236,2100 1236w', '824,1400 824w', '721,1225 721w', '412,700 412w' ) ),
			'object-fit: contain !important then cover: the !important wins' => array( 'width="1200" height="800" style="object-fit:contain !important;object-fit:cover"', array( '1236,825 1236w', '824,550 824w', '721,481 721w', '412,275 412w' ) ),
			'inline contain over data-object-fit="cover": the inline style wins' => array( 'width="1200" height="800" data-object-fit="cover" style="object-fit:contain"', array( '1236,825 1236w', '824,550 824w', '721,481 721w', '412,275 412w' ) ),
			'width="1e300": not a pixel size, the box'    => array( 'width="1e300" height="800"', array( '1236,2100 1236w', '824,1400 824w', '721,1225 721w', '412,700 412w' ) ),
			'object-fit: cover (Featured Image Scale): the box' => array( 'width="1200" height="800" style="aspect-ratio:3/5;object-fit:cover;"', array( '1236,2100 1236w', '824,1400 824w', '721,1225 721w', '412,700 412w' ) ),
			'data-object-fit="cover" (Cover block): the box' => array( 'width="1200" height="800" data-object-fit="cover"', array( '1236,2100 1236w', '824,1400 824w', '721,1225 721w', '412,700 412w' ) ),
			'a square thumbnail of any upload: still 1:1' => array( 'width="300" height="300"', array( '2100,2100 1236w', '1400,1400 824w', '1225,1225 721w', '700,700 412w' ) ),
			'a computed cover the markup does not show (theme CSS): the box' => array( 'width="1200" height="800"', array( '1236,2100 1236w', '824,1400 824w', '721,1225 721w', '412,700 412w' ), 'https://example.com/image.jpg', 'cover' ),
			'a computed fill over data-object-fit="cover": the computed fit wins' => array( 'width="1200" height="800" data-object-fit="cover"', array( '3150,2100 1236w', '2100,1400 824w', '1838,1225 721w', '1050,700 412w' ), 'https://example.com/image.jpg', 'fill' ),
		);
	}

	/**
	 * An array passes isset(), and preg_match() throws a TypeError on one.
	 * This runs inside the output buffer callback, so the throw is a blank page.
	 */
	public function test_an_array_width_value_is_a_skipped_breakpoint_not_a_type_error() {
		$data = $this->create_lcp_data( $this->get_default_optimizations() );

		$data['breakpoints'] = array_map(
			function ( $breakpoint ) {
				$breakpoint['widthValue'] = array( '100vw' );
				return $breakpoint;
			},
			$data['breakpoints']
		);

		$this->assertStringNotContainsString(
			'sizes=',
			( new LCP_Optimize_Img_Tag( $data ) )->optimize_buffer( $this->get_test_buffer() ),
			'A non-string widthValue must be skipped before it reaches preg_match().'
		);
	}
}
