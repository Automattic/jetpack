<?php

class WP_Test_Jetpack_MediaExtractor extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_empty_array() {
		$post_id = $this->factory->post->create( array(
			'post_content' => '',
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertEmpty( $extract );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_image() {
		$img_title = 'title.jpg';

		$post_id = $this->factory->post->create( array(
			'post_content' => "<img src='$img_title'>",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'image', $extract );
		$this->assertEquals( $extract[ 'image' ][ 0 ][ 'url' ], $img_title );
	}

	public function shortcode_nop() {
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_shortcode() {
		$shortcode = 'test_mediaextractor_shortcode';
		add_shortcode( $shortcode, array( $this, 'shortcode_nop' ) );

		$post_id = $this->factory->post->create( array(
			'post_content' => "[$shortcode]",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'shortcode', $extract );
		$this->assertArrayHasKey( $shortcode, $extract[ 'shortcode' ] );
		$this->assertEquals( $extract[ 'shortcode_types' ][ 0 ], $shortcode );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_link() {
		$url_link = WP_TESTS_DOMAIN;
		$url = "<a href='http://$url_link'>";

		$post_id = $this->factory->post->create( array(
			'post_content' => "$url",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'link', $extract );
		$this->assertEquals( $extract[ 'link' ][ 0 ][ 'url' ], $url_link );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_mention() {
		$mention = 'user';

		$post_id = $this->factory->post->create( array(
			'post_content' => "@$mention",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'mention', $extract );
		$this->assertEquals( $extract[ 'mention' ][ 'name' ][ 0 ], $mention );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_embed() {
		$embed_link = 'wordpress.tv/embed';
		$embed = "\nhttp://$embed_link\n";

		$post_id = $this->factory->post->create( array(
			'post_content' => "$embed",
		) );

		$extract = Jetpack_Media_Meta_Extractor::extract( Jetpack_Options::get_option( 'id' ), $post_id );

		$this->assertInternalType( 'array', $extract );
		$this->assertArrayHasKey( 'embed', $extract );
        $this->assertEquals( $extract[ 'embed' ][ 'url' ][ 0 ], $embed_link );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract_images_from_content
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_images_from_content_return_empty_array() {
		$content = '';

		$image_struct = Jetpack_Media_Meta_Extractor::extract_images_from_content( $content, array() );

		$this->assertInternalType( 'array', $image_struct );
		$this->assertEmpty( $image_struct );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::extract_images_from_content
	 * @since 3.2
	 */
	public function test_mediaextractor_extract_images_from_content_return_correct_image_struct() {
		$img_name = 'image.jpg';
		$content = "<img src='$img_name'>";

		$image_struct = Jetpack_Media_Meta_Extractor::extract_images_from_content( $content, array() );

		$this->assertInternalType( 'array', $image_struct );
		$this->assertArrayHasKey( 'has', $image_struct );
		$this->assertArrayHasKey( 'image', $image_struct );
		$this->assertCount( 1, $image_struct[ 'image' ] );
		$this->assertEquals( $image_struct[ 'image' ][ 0 ][ 'url' ], $img_name );
		$this->assertEquals( $image_struct[ 'has' ][ 'image' ], 1 );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	public function test_mediaextractor_get_images_from_html_empty() {
		$content = '';

		$image_list = Jetpack_Media_Meta_Extractor::get_images_from_html( $content, array() );

		$this->assertInternalType( 'array', $image_list );
		$this->assertEmpty( $image_list );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	public function test_mediaextractor_get_images_from_html_already_extracted() {
		$content = '';
		$images_extracted = array( 'http://' . WP_TESTS_DOMAIN . '/image.jpg' );

		$image_list = Jetpack_Media_Meta_Extractor::get_images_from_html( $content, $images_extracted );

		$this->assertInternalType( 'array', $image_list );
		$this->assertEquals( $image_list, $images_extracted );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Meta_Extractor::get_images_from_html
	 * @since 3.2
	 */
	public function test_mediaextractor_get_images_from_html_duplicate_in_already_extracted() {
		$content = 'http://' . WP_TESTS_DOMAIN . '/image.jpg';
		$images_extracted = array( 'http://' . WP_TESTS_DOMAIN . '/image.jpg' );

		$image_list = Jetpack_Media_Meta_Extractor::get_images_from_html( $content, $images_extracted );

		$this->assertInternalType( 'array', $image_list );
		$this->assertEquals( $image_list, $images_extracted );
	}

}
