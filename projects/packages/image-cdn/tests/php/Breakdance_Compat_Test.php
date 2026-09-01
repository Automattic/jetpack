<?php
/**
 * This file contains PHPUnit tests for the Breakdance compatibility functions.
 * To run the package unit tests, run jetpack test php packages/image-cdn
 *
 * @package automattic/jetpack-image-cdn
 */

use Automattic\Jetpack\Image_CDN\Image_CDN;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require __DIR__ . '/../../src/compatibility/breakdance.php';

/**
 * @covers ::Automattic\Jetpack\Image_CDN\Compatibility\load_breakdance_compat
 * @covers ::Automattic\Jetpack\Image_CDN\Compatibility\use_image_cdn
 */
#[CoversFunction( 'Automattic\\Jetpack\\Image_CDN\\Compatibility\\load_breakdance_compat' )]
#[CoversFunction( 'Automattic\\Jetpack\\Image_CDN\\Compatibility\\use_image_cdn' )]
class Breakdance_Compat_Test extends BaseTestCase {
	/**
	 * Test that CDN is enabled for Breakdance content by default.
	 */
	public function test_load_breakdance_compat_default() {
		\Automattic\Jetpack\Image_CDN\Compatibility\load_breakdance_compat();
		// By default we should hook into the Breakdance filters.
		$this->assertTrue( has_filter( 'breakdance_singular_content' ) );
	}

	/**
	 * Test that the plugins_loaded action hook is properly registered.
	 */
	public function test_plugins_loaded_action_registered() {
		// The action should be registered when the file is loaded
		$this->assertNotFalse(
			has_action( 'plugins_loaded', 'Automattic\\Jetpack\\Image_CDN\\Compatibility\\load_breakdance_compat' ),
			'The plugins_loaded action should be registered'
		);
	}

	/**
	 * Test use_image_cdn function when Image CDN is enabled.
	 */
	public function test_use_image_cdn_when_enabled() {
		// Initialize Image CDN to enable it
		Image_CDN::instance();

		$sample_content = '<p>Test content with <img src="http://example.com/image.jpg" alt="test"> image</p>';

		$result = \Automattic\Jetpack\Image_CDN\Compatibility\use_image_cdn( $sample_content );

		// The content should be processed by filter_the_content when CDN is enabled
		$this->assertIsString( $result );
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test use_image_cdn function when Image CDN is disabled.
	 */
	public function test_use_image_cdn_when_disabled() {
		// Reset the Image CDN instance to ensure it's disabled
		$reflection        = new \ReflectionClass( Image_CDN::class );
		$instance_property = $reflection->getProperty( 'instance' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}
		$instance_property->setValue( null, null );

		$enabled_property = $reflection->getProperty( 'is_enabled' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$enabled_property->setAccessible( true );
		}
		$enabled_property->setValue( null, false );

		$sample_content = '<p>Test content with <img src="http://example.com/image.jpg" alt="test"> image</p>';

		$result = \Automattic\Jetpack\Image_CDN\Compatibility\use_image_cdn( $sample_content );

		// When CDN is disabled, content should be returned unchanged
		$this->assertEquals( $sample_content, $result );
	}

	/**
	 * Test use_image_cdn function with empty content.
	 */
	public function test_use_image_cdn_with_empty_content() {
		// Initialize Image CDN to enable it
		Image_CDN::instance();

		$empty_content = '';

		$result = \Automattic\Jetpack\Image_CDN\Compatibility\use_image_cdn( $empty_content );

		// Empty content should remain empty
		$this->assertSame( '', $result );
	}

	/**
	 * Test use_image_cdn function with content containing no images.
	 */
	public function test_use_image_cdn_with_no_images() {
		// Initialize Image CDN to enable it
		Image_CDN::instance();

		$content_no_images = '<p>This is just text content without any images.</p>';

		$result = \Automattic\Jetpack\Image_CDN\Compatibility\use_image_cdn( $content_no_images );

		// Content without images should be processed but essentially unchanged
		$this->assertIsString( $result );
		$this->assertStringContainsString( 'This is just text content', $result );
	}
}
