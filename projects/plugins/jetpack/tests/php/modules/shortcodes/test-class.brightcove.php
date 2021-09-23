<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Brightcove extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [brightcove] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_brightcove_exists() {
		$this->assertEquals( shortcode_exists( 'brightcove' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_brightcove() {
		$content = '[brightcove]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Missing Brightcove parameters -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Brightcove player.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_brightcove_video_id() {
		$video_id = '68143720001';
		$account_id = '57838016001';
		$content = "[brightcove video_id='$video_id' account_id='$account_id']";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<iframe src="//players.brightcove.net/' . $account_id . '/default_default/index.html?videoId=' . $video_id . '"', $shortcode_content );
	}
}
