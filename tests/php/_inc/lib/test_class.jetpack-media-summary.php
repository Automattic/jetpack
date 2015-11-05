<?php

if ( ! class_exists( 'Jetpack_Media_Summary' ) ) {
			jetpack_require_lib( 'class.media-summary' );
	}

class WP_Test_Jetpack_MediaSummary extends WP_UnitTestCase {

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::get
	 * @since 3.2
	 * @todo find a better way to test this large function
	 */
	public function test_mediasummary_get() {
		$post_id = $this->factory->post->create( array() );

		$get_obj = Jetpack_Media_Summary::get( $post_id );

		$this->assertInternalType( 'array', $get_obj );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::https
	 * @since 3.2
	 */
	public function test_mediasummary_https() {
		$content = 'http://' . WP_TESTS_DOMAIN . '/';
		$expected = 'https://' . WP_TESTS_DOMAIN . '/';

		$this->assertEquals( Jetpack_Media_Summary::https( $content ), $expected );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::ssl_img
	 * @since 3.2
	 */
	public function test_mediasummary_ssl_img() {
		$content = 'http://' . WP_TESTS_DOMAIN . '/';
		$expected = 'https://' . WP_TESTS_DOMAIN . '/';

		$this->assertEquals( Jetpack_Media_Summary::ssl_img( $content ), $expected );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::ssl_img
	 * @since 3.2
	 */
	public function test_mediasummary_ssl_img_wordpress_domain() {
		$content = 'http://files.wordpress.com/';
		$expected = 'https://files.wordpress.com/';

		$this->assertEquals( Jetpack_Media_Summary::ssl_img( $content ), $expected );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::clean_text
	 * @since 3.2
	 */
	public function test_mediasummary_clean_text_empty() {
		$content = '';

		$this->assertEmpty( Jetpack_Media_Summary::clean_text( $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::clean_text
	 * @since 3.2
	 */
	public function test_mediasummary_clean_text_simple() {
		$shortcode = 'test_mediasummary_shortcode';
		add_shortcode( $shortcode, array( $this, 'shortcode_nop' ) );

		$content = '[' . $shortcode . '] <a href="' . WP_TESTS_DOMAIN . '">test</a>';

		$this->assertEquals( Jetpack_Media_Summary::clean_text( $content ), 'test' );
	}

	public function shortcode_nop() { }

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::get_word_count
	 * @since 3.2
	 */
	public function test_mediasummary_get_word_count_empty() {
		$content = '';

		$this->assertEquals( 0, Jetpack_Media_Summary::get_word_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::get_word_count
	 * @since 3.2
	 */
	public function test_mediasummary_get_word_count_sample() {
		$content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

		$this->assertEquals( 19, Jetpack_Media_Summary::get_word_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::get_link_count
	 * @since 3.2
	 */
	public function test_mediasummary_get_link_count_empty() {
		$content = '';

		$this->assertEquals( 0, Jetpack_Media_Summary::get_link_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::get_link_count
	 * @since 3.2
	 */
	public function test_mediasummary_get_link_count_simple() {
		$content = '<a href="' . WP_TESTS_DOMAIN . '"></a>';

		$this->assertEquals( 1, Jetpack_Media_Summary::get_link_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Media_Summary::get_link_count
	 * @since 3.2
	 */
	public function test_mediasummary_get_link_count_invalid_tag() {
		$content = '<abbr title="Canada">CA</abbr>';

		$this->assertEquals( 0, Jetpack_Media_Summary::get_link_count( $content ) );
	}

}
