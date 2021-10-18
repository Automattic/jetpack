<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Ustream extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [ustream] and [ustreamsocial] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_ustream_exists() {
		$this->assertEquals( shortcode_exists( 'ustream' ), true );
		$this->assertEquals( shortcode_exists( 'ustreamsocial' ), true );
	}

	/**
	 * Verify that executing ustream doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_ustream() {
		$content           = '[ustream]';
		$shortcode_content = do_shortcode( $content );
		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- ustream error: bad video ID -->', $shortcode_content );
	}

	/**
	 * Verify that executing ustreamsocial doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_ustreamsocial() {
		$content = '[ustreamsocial]';
		$shortcode_content = do_shortcode( $content );
		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- ustreamsocial error: bad social stream ID -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Ustream video.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_ustream_video() {
		$id = '1524';
		$content = "[ustream id='$id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<iframe src="https://www.ustream.tv/embed/recorded/' . $id, $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Ustream video.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_ustream_social_stream() {
		$id = '12980237';
		$content = "[ustreamsocial id='$id' width=500]";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<iframe id="SocialStream" src="https://www.ustream.tv/socialstream/' . $id, $shortcode_content );
	}
}
