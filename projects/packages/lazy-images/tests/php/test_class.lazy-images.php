<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

require __DIR__ . '/../../src/lazy-images.php';

use Automattic\Jetpack\Jetpack_Lazy_Images;
use WorDBless\BaseTestCase;

/**
 * Class WP_Test_Lazy_Images
 */
class WP_Test_Lazy_Images extends BaseTestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * Setup.
	 *
	 * @before
	 */
	public function set_up() {
		add_filter( 'lazyload_images_placeholder_image', array( $this, 'override_image_placeholder' ) );
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_process_image_test_data() {
		return array(
			'img_with_no_src'           => array(
				array(
					'<img id="img" />',
					'img',
					' id="img"',
				),
				'<img id="img" />',
			),
			'img_simple'                => array(
				array(
					'<img src="image.jpg" />',
					'img',
					' src="image.jpg"',
				),
				'<img src="image.jpg" data-lazy-src="http://image.jpg?is-pending-load=1" srcset="placeholder.jpg" class=" jetpack-lazy-image"><noscript><img data-lazy-fallback="1" src="image.jpg" /></noscript>',
			),
			'img_with_other_attributes' => array(
				array(
					'<img src="image.jpg" alt="Alt!" />',
					'img',
					' src="image.jpg" alt="Alt!"',
				),
				'<img src="image.jpg" alt="Alt!" data-lazy-src="http://image.jpg?is-pending-load=1" srcset="placeholder.jpg" class=" jetpack-lazy-image"><noscript><img data-lazy-fallback="1" src="image.jpg" alt="Alt!" /></noscript>',
			),
			'img_with_srcset'           => array(
				array(
					'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" />',
					'img',
					' src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w"',

				),
				'<img src="image.jpg" data-lazy-srcset="medium.jpg 1000w, large.jpg 2000w" data-lazy-src="http://image.jpg?is-pending-load=1" srcset="placeholder.jpg" class=" jetpack-lazy-image"><noscript><img data-lazy-fallback="1" src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" /></noscript>',
			),
			'img_with_sizes'            => array(
				array(
					'<img src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw" />',
					'img',
					' src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw"',

				),
				'<img src="image.jpg" data-lazy-sizes="(min-width: 36em) 33.3vw, 100vw" data-lazy-src="http://image.jpg?is-pending-load=1" srcset="placeholder.jpg" class=" jetpack-lazy-image"><noscript><img data-lazy-fallback="1" src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw" /></noscript>',
			),
		);
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_process_image_attributes_data() {
		return array(
			'img_with_no_src'              => array(
				array(
					'width'  => 10,
					'height' => 10,
				),
				array(
					'width'  => 10,
					'height' => 10,
				),
			),
			'img_simple'                   => array(
				array(
					'src'    => 'image.jpg',
					'width'  => 10,
					'height' => 10,
				),
				array(
					'src'           => 'image.jpg',
					'width'         => 10,
					'height'        => 10,
					'data-lazy-src' => 'http://image.jpg?is-pending-load=1',
					'srcset'        => 'placeholder.jpg',
					'class'         => ' jetpack-lazy-image',
				),
			),
			'img_with_srcset'              => array(
				array(
					'src'    => 'image.jpg',
					'width'  => 10,
					'height' => 10,
					'srcset' => 'medium.jpg 1000w, large.jpg 2000w',
				),
				array(
					'src'              => 'image.jpg',
					'width'            => 10,
					'height'           => 10,
					'data-lazy-srcset' => 'medium.jpg 1000w, large.jpg 2000w',
					'data-lazy-src'    => 'http://image.jpg?is-pending-load=1',
					'srcset'           => 'placeholder.jpg',
					'class'            => ' jetpack-lazy-image',
				),
			),
			'img_with_sizes'               => array(
				array(
					'src'    => 'image.jpg',
					'width'  => 10,
					'height' => 10,
					'sizes'  => '(min-width: 36em) 33.3vw, 100vw',
				),
				array(
					'src'             => 'image.jpg',
					'width'           => 10,
					'height'          => 10,
					'data-lazy-sizes' => '(min-width: 36em) 33.3vw, 100vw',
					'data-lazy-src'   => 'http://image.jpg?is-pending-load=1',
					'srcset'          => 'placeholder.jpg',
					'class'           => ' jetpack-lazy-image',
				),
			),
			'gazette_theme_featured_image' => array(
				array(
					'src'    => 'image.jpg',
					'width'  => 10,
					'height' => 10,
					'class'  => 'attachment-gazette-featured-content-thumbnail wp-post-image',
				),
				// Should be unmodified.
				array(
					'src'    => 'image.jpg',
					'width'  => 10,
					'height' => 10,
					'class'  => 'attachment-gazette-featured-content-thumbnail wp-post-image',
				),
			),
		);
	}

	/**
	 * Test the process image attribute filter.
	 */
	public function test_process_image_attribute_filter() {
		add_filter( 'jetpack_lazy_images_new_attributes', array( $this, 'set_height_attribute' ) );

		$html = Jetpack_Lazy_Images::process_image(
			array(
				'<img src="image.jpg" height="100px" />',
				'img',
				' src="image.jpg" height="100px"',
			)
		);

		remove_filter( 'jetpack_lazy_images_new_attributes', array( $this, 'set_height_attribute' ) );

		$this->assertStringContainsString( 'style="height: 100px;"', $html );
	}

	/**
	 * Create a upload
	 *
	 * @param string  $file File path.
	 * @param integer $parent Parent post ID.
	 * @return integer
	 */
	public function create_upload_object( $file, $parent = 0 ) {
		$contents = file_get_contents( $file ); //phpcs:ignore
		$upload   = wp_upload_bits( basename( $file ), null, $contents );

		$type = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'], null );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent,
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data.

		$id = wp_insert_attachment( $attachment, $upload['file'], $parent );

		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		return $id;
	}

	/**
	 * Test that the wp_get_attachment_image function output gets the lazy treatment.
	 */
	public function test_wp_get_attachment_image_gets_lazy_treatment() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/wp-logo.jpg', 0 );
		add_filter( 'wp_get_attachment_image_attributes', array( 'Automattic\\Jetpack\\Jetpack_Lazy_Images', 'process_image_attributes' ), PHP_INT_MAX );
		$image = wp_get_attachment_image( $attachment_id );
		remove_filter( 'wp_get_attachment_image_attributes', array( 'Automattic\\Jetpack\\Jetpack_Lazy_Images', 'process_image_attributes' ), PHP_INT_MAX );

		$this->assertStringContainsString( 'srcset="placeholder.jpg"', $image );
		$this->assertStringContainsString(
			sprintf( 'data-lazy-srcset="%s"', wp_get_attachment_image_srcset( $attachment_id, 'thumbnail' ) ),
			$image
		);
		// phpcs:enable
	}

	/**
	 * Test that the wp_get_attachment_image function output does not get the lazy treatment when lazy images feature is skipped.
	 */
	public function test_wp_get_attachment_image_does_not_get_lazy_treatment_when_skip_lazy_added() {
		$attachment_id = $this->create_upload_object( __DIR__ . '/wp-logo.jpg', 0 );
		$instance      = Jetpack_Lazy_Images::instance();

		$instance->setup_filters();
		add_filter( 'wp_get_attachment_image_attributes', array( $this, 'add_skip_lazy_class_to_attributes' ) );
		$image = wp_get_attachment_image( $attachment_id );
		remove_filter( 'wp_get_attachment_image_attributes', array( $this, 'add_skip_lazy_class_to_attributes' ) );
		$instance->remove_filters();

		$this->assertStringNotContainsString( 'srcset="placeholder.jpg"', $image );
	}

	/**
	 * Test the process_image method.
	 *
	 * @param array  $image_parts   Image parts.
	 * @param string $expected_html Expected HTML.
	 *
	 * @dataProvider get_process_image_test_data
	 */
	public function test_process_image( $image_parts, $expected_html ) {
		$actual_html = Jetpack_Lazy_Images::process_image( $image_parts );

		$this->assertEquals( $expected_html, $actual_html );
	}

	/**
	 * Test the add_image_placeholders method.
	 */
	public function test_add_image_placeholders() {
		$this->assertSame( $this->get_output_content(), Jetpack_Lazy_Images::instance()->add_image_placeholders( $this->get_input_content() ) );
	}

	/**
	 * Test the process_image_attributes method.
	 *
	 * @param array $input           Input attributes.
	 * @param array $expected_output Expected output.
	 *
	 * @dataProvider get_process_image_attributes_data
	 */
	public function test_process_image_attributes( $input, $expected_output ) {
		$this->assertSame( Jetpack_Lazy_Images::process_image_attributes( $input ), $expected_output );
	}

	/**
	 * Test that images with classes are not processed.
	 *
	 * @param string $input       Input content.
	 * @param bool   $should_skip Whether or not it lazy images treatment should be skipped.
	 *
	 * @dataProvider get_dont_process_images_with_classes_data
	 */
	public function test_dont_process_images_with_classes( $input, $should_skip = true ) {
		$instance = Jetpack_Lazy_Images::instance();
		$output   = $instance->add_image_placeholders( $input );

		if ( $should_skip ) {
			$this->assertStringNotContainsString( 'srcset="placeholder.jpg"', $output );
		} else {
			$this->assertStringContainsString( 'srcset="placeholder.jpg"', $output );
		}
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_dont_process_images_with_classes_data() {
		return array(
			'skip_lazy'                    => array(
				'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" class="skip-lazy"/>',
			),
			'gazette_theme_featured_image' => array(
				'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" class="attachment-gazette-featured-content-thumbnail wp-post-image"/>',
			),
			'does_not-skip'                => array(
				'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" class="wp-post-image"/>',
				false,
			),
		);
	}

	/**
	 * Test that images with the skip lazy data attribute are skipped.
	 *
	 * @param string $input       Input content.
	 * @param bool   $should_skip Whether or not it lazy images treatment should be skipped.
	 *
	 * @dataProvider get_dont_process_images_with_skip_lazy_data_attribute_data
	 */
	public function test_dont_process_images_with_skip_lazy_data_attribute( $input, $should_skip = true ) {
		$instance = Jetpack_Lazy_Images::instance();
		$output   = $instance->add_image_placeholders( $input );

		if ( $should_skip ) {
			$this->assertStringNotContainsString( 'srcset="placeholder.jpg"', $output );
		} else {
			$this->assertStringContainsString( 'srcset="placeholder.jpg"', $output );
		}
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_dont_process_images_with_skip_lazy_data_attribute_data() {
		return array(
			'skip_lazy_attr_only' => array(
				'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" data-skip-lazy/>',
			),
			'skip-lazy-attr-true' => array(
				'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" data-skip-lazy="true"/>',
			),
			'skip-lazy-attr-1'    => array(
				'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" data-skip-lazy="1"/>',
			),
		);
	}

	/**
	 * Test that images with the blocked class should be skipped
	 *
	 * @param bool   $expected Expected result.
	 * @param string $input  A string of space-separated classes.
	 * @param bool   $empty_blocked_classes Empty block classes.
	 *
	 * @dataProvider get_should_skip_image_with_blocked_class_data
	 */
	public function test_should_skip_image_with_blocked_class( $expected, $input, $empty_blocked_classes = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertSame( $expected, Jetpack_Lazy_Images::should_skip_image_with_blocked_class( $input ) );
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_should_skip_image_with_blocked_class_data() {
		return array(
			'wp-post-image'   => array(
				false,
				'wp-post-image',
			),
			'skip-lazy'       => array(
				true,
				'wp-post-image skip-lazy',
			),
			'gazette-feature' => array(
				true,
				'wp-post-image attachment-gazette-featured-content-thumbnail',
			),
		);
	}

	/**
	 * Test that images with filtered empty blocklist should be skipped.
	 *
	 * @param string $classes A string of space-separated classes. TODO: Check type.
	 *
	 * @dataProvider get_should_skip_image_with_filtered_empty_blocked_data
	 */
	public function test_should_skip_image_with_filtered_empty_blocklist( $classes ) {
		$filter_callbacks = array(
			'__return_empty_string',
			'__return_empty_array',
		);

		foreach ( $filter_callbacks as $callback ) {
			add_filter( 'jetpack_lazy_images_blocked_classes', $callback );
			$this->assertSame( false, Jetpack_Lazy_Images::should_skip_image_with_blocked_class( $classes ) );
			remove_filter( 'jetpack_lazy_images_blocked_classes', $callback );
		}
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_should_skip_image_with_filtered_empty_blocked_data() {
		return array(
			'wp-post-image'   => array(
				'wp-post-image',
			),
			'skip-lazy'       => array(
				'wp-post-image skip-lazy',
			),
			'gazette-feature' => array(
				'wp-post-image attachment-gazette-featured-content-thumbnail',
			),
		);
	}

	/**
	 * Test that Jetpack lazy images skip image with attributes filter.
	 *
	 * @param string $filter_name filter name.
	 *
	 * @dataProvider get_skip_image_with_attributes_data
	 */
	public function test_jetpack_lazy_images_skip_image_with_attributes_filter( $filter_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$instance = Jetpack_Lazy_Images::instance();
		$src      = '<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" class="wp-post-image"/>';

		$this->assertStringContainsString( 'srcset="placeholder.jpg"', $instance->add_image_placeholders( $src ) );

		add_filter( 'jetpack_lazy_images_skip_image_with_attributes', '__return_true' );
		$this->assertStringNotContainsString( 'srcset="placeholder.jpg"', $instance->add_image_placeholders( $src ) );
		remove_filter( 'jetpack_lazy_images_skip_image_with_attributes', '__return_true' );

		add_filter( 'jetpack_lazy_images_skip_image_with_attributes', array( $this, 'skip_if_srcset' ), 10, 2 );
		$this->assertStringNotContainsString( 'srcset="placeholder.jpg"', $instance->add_image_placeholders( $src ) );
		$this->assertStringContainsString( 'srcset="placeholder.jpg"', $instance->add_image_placeholders( '<img src="image.jpg" />' ) );
		remove_filter( 'jetpack_lazy_images_skip_image_with_attributes', array( $this, 'skip_if_srcset' ), 10, 2 );
	}

	/**
	 * Data provider for test.
	 *
	 * @return array
	 */
	public function get_skip_image_with_attributes_data() {
		return array(
			'deprecated_filter_name_with_typo' => array(
				'jetpack_lazy_images_skip_image_with_atttributes',
			),
			'correct_filter_name'              => array(
				'jetpack_lazy_images_skip_image_with_attributes',
			),
		);
	}

	/**
	 * Test that processing the_content handles adding lazy image support and removing the loading attribute.
	 */
	public function test_processing_removes_loading_attribute() {
		$instance = Jetpack_Lazy_Images::instance();
		$instance->setup_filters();

		$src = '<img loading="lazy" src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" class="wp-post-image"/>';

		$processed = apply_filters( 'the_content', $src );
		$img_tag   = preg_replace( '/<noscript>.*<\/noscript>/', '', $processed );

		$this->assertStringContainsString( 'srcset="placeholder.jpg"', $img_tag );
		$this->assertStringContainsString( 'src="image.jpg"', $img_tag );
		$this->assertStringNotContainsString( 'loading="', $img_tag );

		$instance->remove_filters();
	}

	/**
	 * Test that processing more than once results in the same output.
	 */
	public function test_processing_more_than_once() {
		$instance = Jetpack_Lazy_Images::instance();
		$instance->setup_filters();

		$src = '<img loading="lazy" src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" class="wp-post-image"/>';

		$processed = apply_filters( 'the_content', $src );

		$processed_again = apply_filters( 'the_content', $processed );

		$this->assertSame( $processed, $processed_again );

		$instance->remove_filters();
	}

	/*
	 * Helpers
	 */

	/**
	 * Override image placeholder.
	 *
	 * @return string
	 */
	public function override_image_placeholder() {
		return 'placeholder.jpg';
	}

	/**
	 * Set height attribute.
	 *
	 * @param array $attributes Attributes.
	 *
	 * @return array
	 */
	public function set_height_attribute( $attributes ) {
		if ( ! empty( $attributes['height'] ) ) {
			$attributes['style'] = sprintf( 'height: %dpx;', $attributes['height'] );
			unset( $attributes['height'] );
		}
		return $attributes;
	}

	/**
	 * Get input content.
	 *
	 * @return string
	 */
	public function get_input_content() {
		ob_start();

		require_once __DIR__ . '/pre-image-placeholder-content.html';

		$contents = trim( ob_get_contents() );
		ob_end_clean();

		return trim( $contents );
	}

	/**
	 * Get output content.
	 *
	 * @return string
	 */
	public function get_output_content() {
		ob_start();

		require_once __DIR__ . '/post-image-placeholder-content.html';

		$contents = trim( ob_get_contents() );
		ob_end_clean();

		return trim( $contents );
	}

	/**
	 * Check is the srcset attribute it set.
	 *
	 * @param bool  $should_skip Whether or not it lazy images treatment should be skipped.
	 * @param array $attributes  Attributes.
	 *
	 * @return bool
	 */
	public function skip_if_srcset( $should_skip, $attributes ) {
		return isset( $attributes['srcset'] );
	}

	/**
	 * Add skip lazy class to attributes.
	 *
	 * @param array $attributes attributes.
	 *
	 * @return mixed
	 */
	public function add_skip_lazy_class_to_attributes( $attributes ) {
		$attributes['class'] .= ' skip-lazy';
		return $attributes;
	}
}
