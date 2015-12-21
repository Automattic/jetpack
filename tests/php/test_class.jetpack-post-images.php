<?php

class WP_Test_Jetpack_PostImages extends WP_UnitTestCase {

	/**
	 * @author blobaugh
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_single_quotes() {
		$s = '<imgANYTHINGATALLHEREsrc="bob.jpg"MOREANYTHINGHERE/>';

		$result = Jetpack_PostImages::from_html( $s );

		$this->assertInternalType( 'array', $result );
		$this->assertFalse( empty( $result ) );
	}

	/**
	 * @author blobaugh
	 * @covers Jetpack_PostImages::from_html
	 * @since 2.7
	 */
	public function test_from_html_double_quotes() {
		$s = "<imgANYTHINGATALLHEREsrc='bob.jpg'MOREANYTHINGHERE/>";

		$result = Jetpack_PostImages::from_html( $s );


		$this->assertInternalType( 'array', $result );
		$this->assertFalse( empty( $result ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_slideshow
	 * @since 3.2
	 */
	public function test_from_slideshow_is_array() {
		require_once plugin_dir_path( realpath( dirname( __FILE__ ) . '/../../modules/shortcodes/slideshow.php' ) ) . 'slideshow.php';

		$slideshow = new Jetpack_Slideshow_Shortcode();

		$post_id = $this->factory->post->create( array(
			'post_content' => '[slideshow]',
		) );

		$images = Jetpack_PostImages::from_slideshow( $post_id );

		$this->assertInternalType( 'array', $images );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_gallery
	 * @since 3.2
	 */
	public function test_from_gallery_is_array() {
		$post_id = $this->factory->post->create( array(
			'post_content' => '[gallery]',
		) );

		$images = Jetpack_PostImages::from_gallery( $post_id );

		$this->assertInternalType( 'array', $images );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_PostImages::from_attachment
	 * @since 3.2
	 */
	public function test_from_attachment_is_correct_array() {
		$img_name = 'image.jpg';
		$img_url = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . $img_name;
		$img_html = '<img src="' . $img_url . '"/>';
		$img_dimensions = array( 'width' => 250, 'height' => 250 );

		$post_id = $this->factory->post->create( array(
			'post_content' => $img_html,
		) );
		$attachment_id = $this->factory->attachment->create_object( $img_name, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		wp_update_attachment_metadata( $attachment_id, $img_dimensions );

		$images = Jetpack_PostImages::from_attachment( $post_id );

		$this->assertEquals( count( $images ), 1 );
		$this->assertEquals( $images[ 0 ][ 'src' ], $img_url );
	}

} // end class
