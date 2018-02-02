<?php
require dirname( __FILE__ ) . '/../../../../modules/lazy-images/lazy-images.php';

class WP_Test_Lazy_Images extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		add_filter( 'lazyload_images_placeholder_image', array( $this, '__override_image_placeholder' ) );
	}

	function get_process_image_test_data() {
		return array(
			'img_with_no_src' => array(
				array(
					'<img id="img" />',
					'img',
					' id="img"',
				),
				'<img id="img" />',
			),

			'img_simple' => array(
				array(
					'<img src="image.jpg" />',
					'img',
					' src="image.jpg"',
				),
				'<img src="placeholder.jpg" data-lazy-src="image.jpg"><noscript><img src="image.jpg" /></noscript>',
			),

			'img_with_other_attributes' => array(
				array(
					'<img src="image.jpg" alt="Alt!" />',
					'img',
					' src="image.jpg" alt="Alt!"',
				),
				'<img src="placeholder.jpg" alt="Alt!" data-lazy-src="image.jpg"><noscript><img src="image.jpg" alt="Alt!" /></noscript>',
			),

			'img_with_srcset' => array(
				array(
					'<img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" />',
					'img',
					' src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w"',

				),
				'<img src="placeholder.jpg" data-lazy-src="image.jpg" data-lazy-srcset="medium.jpg 1000w, large.jpg 2000w"><noscript><img src="image.jpg" srcset="medium.jpg 1000w, large.jpg 2000w" /></noscript>',
			),

			'img_with_sizes' => array(
				array(
					'<img src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw" />',
					'img',
					' src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw"',

				),
				'<img src="placeholder.jpg" data-lazy-src="image.jpg" data-lazy-sizes="(min-width: 36em) 33.3vw, 100vw"><noscript><img src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw" /></noscript>',
			),
		);
	}

	function get_process_image_attributes_data() {
		return array(
			'img_with_no_src' => array(
				array(
					'width' => 10,
					'height' => 10
				),
				array(
					'width' => 10,
					'height' => 10,
				)
			),
			'img_simple' => array(
				array(
					'src' => 'image.jpg',
					'width' => 10,
					'height' => 10,
				),
				array(
					'src' => 'placeholder.jpg',
					'width' => 10,
					'height' => 10,
					'data-lazy-src' => 'image.jpg',
				),
			),
			'img_with_srcset' => array(
				array(
					'src' => 'image.jpg',
					'width' => 10,
					'height' => 10,
					'srcset' => 'medium.jpg 1000w, large.jpg 2000w'
				),
				array(
					'src' => 'placeholder.jpg',
					'width' => 10,
					'height' => 10,
					'data-lazy-src' => 'image.jpg',
					'data-lazy-srcset' => 'medium.jpg 1000w, large.jpg 2000w'
				)
			),
			'img_with_sizes' => array(
				array(
					'src' => 'image.jpg',
					'width' => 10,
					'height' => 10,
					'sizes' => '(min-width: 36em) 33.3vw, 100vw'
				),
				array(
					'src' => 'placeholder.jpg',
					'width' => 10,
					'height' => 10,
					'data-lazy-src' => 'image.jpg',
					'data-lazy-sizes' => '(min-width: 36em) 33.3vw, 100vw'
				)
			),
			'gazette_theme_featured_image' => array(
				array(
					'src' => 'image.jpg',
					'width' => 10,
					'height' => 10,
					'class' => 'attachment-gazette-featured-content-thumbnail wp-post-image'
				),
				// should be unmodified
				array(
					'src' => 'image.jpg',
					'width' => 10,
					'height' => 10,
					'class' => 'attachment-gazette-featured-content-thumbnail wp-post-image'
				)
			),
		);
	}

	function test_process_image_attribute_filter() {
		add_filter( 'jetpack_lazy_images_new_attributes', array( $this, '__set_height_attribute' ) );

		$html = Jetpack_Lazy_Images::process_image( array(
			'<img src="image.jpg" height="100px" />',
			'img',
			' src="image.jpg" height="100px"',

		) );

		remove_filter( 'jetpack_lazy_images_new_attributes', array( $this, '__set_height_attribute' ) );

		$expected_html = '<img src="placeholder.jpg" data-lazy-src="image.jpg" style="height: 100px;"><noscript><img src="image.jpg" sizes="(min-width: 36em) 33.3vw, 100vw" /></noscript>';
	}

	function test_wp_get_attachment_image_gets_lazy_treatment() {
		$attachment_id = $this->factory->attachment->create_upload_object( JETPACK__PLUGIN_DIR . 'tests/php/jetpack-icon.jpg', 0 );
		add_filter( 'wp_get_attachment_image_attributes', array( 'Jetpack_Lazy_Images', 'process_image_attributes' ), PHP_INT_MAX );
		$image = wp_get_attachment_image( $attachment_id );
		remove_filter( 'wp_get_attachment_image_attributes', array( 'Jetpack_Lazy_Images', 'process_image_attributes' ), PHP_INT_MAX );

		$image_src = wp_get_attachment_image_src( $attachment_id );

		$this->assertContains( 'src="placeholder.jpg"', $image );
		$this->assertContains( sprintf( 'data-lazy-src="%s"', $image_src[0] ), $image );
	}

	/**
	 * @dataProvider get_process_image_test_data
	 */
	function test_process_image( $image_parts, $expected_html ) {
		$actual_html = Jetpack_Lazy_Images::process_image( $image_parts );

		$this->assertEquals( $expected_html, $actual_html );
	}

	function test_add_image_placeholders() {
		$this->assertSame( $this->__get_output_content(), Jetpack_Lazy_Images::instance()->add_image_placeholders( $this->__get_input_content() ) );
	}

	/**
	 * @dataProvider get_process_image_attributes_data
	 */
	function test_process_image_attributes( $input, $expected_output ) {
		$this->assertSame( Jetpack_Lazy_Images::process_image_attributes( $input ), $expected_output );
	}

	function test_compat_with_wp_kses_post() {
		$instance = Jetpack_Lazy_Images::instance();
		remove_filter( 'wp_kses_allowed_html', array( $instance, 'allow_lazy_attributes' ) );

		$sample_image_srcset = '<img src="placeholder.jpg" data-lazy-src="image.jpg" data-lazy-srcset="medium.jpg 1000w, large.jpg 2000w">';
		$sample_img_sizes    = '<img src="placeholder.jpg" data-lazy-src="image.jpg" data-lazy-sizes="(min-width: 36em) 33.3vw, 100vw">';

		$allowed = wp_kses_allowed_html();

		// First, test existence of issue if we don't filter.
		$no_lazy_srcset = wp_kses_post( $sample_image_srcset );
		$no_lazy_sizes  = wp_kses_post( $sample_img_sizes );

		$this->assertNotContains( 'data-lazy-src', $no_lazy_srcset );
		$this->assertNotContains( 'data-lazy-src', $no_lazy_sizes );
		$this->assertNotContains( 'data-lazy-srcset', $no_lazy_srcset );
		$this->assertNotContains( 'data-lazy-size', $no_lazy_sizes );

		add_filter( 'wp_kses_allowed_html', array( $instance, 'allow_lazy_attributes' ) );

		// Second, test that the issue is fixed when we filter.
		$with_lazy_srcset = wp_kses_post( $sample_image_srcset );
		$with_lazy_sizes  = wp_kses_post( $sample_img_sizes );

		$this->assertContains( 'data-lazy-src', $with_lazy_srcset );
		$this->assertContains( 'data-lazy-src', $with_lazy_sizes );
		$this->assertContains( 'data-lazy-srcset', $with_lazy_srcset );
		$this->assertContains( 'data-lazy-size', $with_lazy_sizes );
	}

	/*
	 * Helpers
	 */

	public function __override_image_placeholder() {
		return 'placeholder.jpg';
	}

	public function __set_height_attribute( $attributes ) {
		if ( ! empty( $attributes['height'] ) ) {
			$attributes['style'] = sprintf( 'height: %d;', $attributes['height'] );
		}
		return $attributes;
	}

	public function __get_input_content() {
		ob_start();

		require_once( dirname( __FILE__ ) . '/pre-image-placeholder-content.php' );

		$contents = trim( ob_get_contents() );
		ob_end_clean();

		return trim( $contents );
	}

	public function __get_output_content() {
		ob_start();

		require_once( dirname( __FILE__ ) . '/post-image-placeholder-content.php' );

		$contents = trim( ob_get_contents() );
		ob_end_clean();

		return trim( $contents );
	}
}
