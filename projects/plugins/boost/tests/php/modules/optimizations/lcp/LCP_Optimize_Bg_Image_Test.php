<?php
/**
 * Tests for LCP_Optimize_Bg_Image class
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Optimize_Bg_Image;
use WorDBless\BaseTestCase;

/**
 * Class LCP_Optimize_Bg_Image_Test
 *
 * Tests the optimizations object functionality in LCP_Optimize_Bg_Image.
 */
class LCP_Optimize_Bg_Image_Test extends BaseTestCase {

	/**
	 * Set up test environment
	 */
	public function set_up() {
		parent::set_up();

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
	}

	/**
	 * Create a test LCP data array for background images.
	 *
	 * @param array|null $optimizations Optional optimizations object. If null, no optimizations key is added.
	 * @return array The LCP data array.
	 */
	private function create_lcp_data( $optimizations = null ) {
		$data = array(
			'success'     => true,
			'type'        => LCP::TYPE_BACKGROUND_IMAGE,
			'selector'    => 'div.hero-bg',
			'html'        => '<div class="hero-bg" id="test-bg"></div>',
			'url'         => 'https://example.com/background.jpg',
			'breakpoints' => array(
				array(
					'maxWidth'        => 1200,
					'minWidth'        => 769,
					'widthValue'      => '1200px',
					'imageDimensions' => array(
						array(
							'width'  => 1200,
							'height' => 800,
						),
					),
				),
				array(
					'maxWidth'        => 768,
					'minWidth'        => 0,
					'widthValue'      => '768px',
					'imageDimensions' => array(
						array(
							'width'  => 768,
							'height' => 500,
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
	 * Access a private method using reflection.
	 *
	 * @param object $instance The object instance.
	 * @param string $method_name The method name to access.
	 * @return \ReflectionMethod The accessible method.
	 */
	private function get_private_method( $instance, $method_name ) {
		$reflection = new \ReflectionClass( $instance );
		$method     = $reflection->getMethod( $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method;
	}

	/**
	 * Test that get_responsive_image_rules returns rules by default when no optimizations object exists.
	 *
	 * This ensures backward compatibility with old cloud responses.
	 */
	public function test_get_responsive_image_rules_returns_rules_by_default() {
		// Create LCP data without optimizations object (old cloud response)
		$lcp_data = $this->create_lcp_data( null );

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Rules should be generated
		$this->assertNotEmpty( $result );
		$this->assertIsArray( $result );
		// Should have rules for each breakpoint
		$this->assertCount( 2, $result );
	}

	/**
	 * Test that get_responsive_image_rules returns rules when cssOverride is enabled.
	 */
	public function test_get_responsive_image_rules_returns_rules_when_css_override_enabled() {
		$optimizations = array(
			'cssOverride' => true,
		);
		$lcp_data      = $this->create_lcp_data( $optimizations );

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Rules should be generated
		$this->assertNotEmpty( $result );
		$this->assertIsArray( $result );
		$this->assertCount( 2, $result );
	}

	/**
	 * Test that get_responsive_image_rules returns empty array when cssOverride is disabled.
	 *
	 * When cssOverride is false, it means the cloud detected responsive backgrounds
	 * or custom focal points, so we should skip all background-image optimizations.
	 */
	public function test_get_responsive_image_rules_returns_empty_when_css_override_disabled() {
		$optimizations = array(
			'cssOverride' => false,
		);
		$lcp_data      = $this->create_lcp_data( $optimizations );

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Rules should be empty - no optimization should be applied
		$this->assertEmpty( $result );
	}

	/**
	 * Test that get_responsive_image_rules returns empty for non-background-image types.
	 */
	public function test_get_responsive_image_rules_returns_empty_for_non_bg_type() {
		$lcp_data         = $this->create_lcp_data( array( 'cssOverride' => true ) );
		$lcp_data['type'] = LCP::TYPE_IMAGE; // Not a background image

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Rules should be empty because type is not background-image
		$this->assertEmpty( $result );
	}

	/**
	 * Test that get_responsive_image_rules returns empty when breakpoints are missing.
	 */
	public function test_get_responsive_image_rules_returns_empty_when_no_breakpoints() {
		$lcp_data                = $this->create_lcp_data( array( 'cssOverride' => true ) );
		$lcp_data['breakpoints'] = array(); // No breakpoints

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Rules should be empty because there are no breakpoints
		$this->assertEmpty( $result );
	}

	/**
	 * Test that responsive image rules contain correct structure.
	 */
	public function test_get_responsive_image_rules_structure() {
		$lcp_data = $this->create_lcp_data( array( 'cssOverride' => true ) );

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Verify structure of each rule
		foreach ( $result as $rule ) {
			$this->assertArrayHasKey( 'media_query', $rule );
			$this->assertArrayHasKey( 'image_set', $rule );
			$this->assertArrayHasKey( 'base_image', $rule );

			// image_set should contain url and dpr
			$this->assertNotEmpty( $rule['image_set'] );
			foreach ( $rule['image_set'] as $image ) {
				$this->assertArrayHasKey( 'url', $image );
				$this->assertArrayHasKey( 'dpr', $image );
			}
		}
	}

	/**
	 * Test behavior with empty optimizations object (cssOverride key missing).
	 *
	 * When the optimizations object exists but cssOverride is missing,
	 * the code checks for empty() which would be true for missing keys.
	 */
	public function test_get_responsive_image_rules_with_empty_optimizations_object() {
		// Empty optimizations object - cssOverride will be missing
		$lcp_data = $this->create_lcp_data( array() );

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// With empty optimizations object, empty() check will return true for missing cssOverride
		// so optimizations won't be applied (empty array returned)
		$this->assertEmpty( $result );
	}

	/**
	 * Test get_responsive_image_rules when success is false.
	 */
	public function test_get_responsive_image_rules_returns_empty_when_success_false() {
		$lcp_data            = $this->create_lcp_data( array( 'cssOverride' => true ) );
		$lcp_data['success'] = false;

		$instance = new LCP_Optimize_Bg_Image( array( $lcp_data ) );
		$method   = $this->get_private_method( $instance, 'get_responsive_image_rules' );
		$result   = $method->invoke( $instance, $lcp_data );

		// Rules should be empty because success is false
		$this->assertEmpty( $result );
	}
}
