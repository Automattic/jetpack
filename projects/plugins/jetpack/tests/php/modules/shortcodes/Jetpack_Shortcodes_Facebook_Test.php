<?php

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * @covers ::jetpack_facebook_embed_handler
 * @covers ::jetpack_facebook_shortcode_handler
 */
class Jetpack_Shortcodes_Facebook_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tear_down() {
		wp_reset_postdata();
		parent::tear_down();
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_facebook_exists() {
		$this->assertTrue( shortcode_exists( 'facebook' ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_facebook() {
		$content = '[facebook]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Test a Facebook Video using the old, first format (video.php)
	 *
	 * @since 7.5.0
	 */
	public function test_shortcodes_facebook_video_old() {
		global $post;

		$fb_video_id = '546877659119730';
		$url         = 'https://www.facebook.com/video.php?v=' . $fb_video_id;
		$post        = self::factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString(
			sprintf(
				'<div class="fb-video" data-allowfullscreen="true" data-href="%s" style="background-color: #fff; display: inline-block;"></div>',
				$url
			),
			$actual
		);
	}

	/**
	 * Test a Facebook Video using the "watch/" format
	 *
	 * @since 7.5.0
	 */
	public function test_shortcodes_facebook_video_watch_format() {
		global $post;

		$fb_video_id = '546877659119730';
		$url         = 'https://www.facebook.com/watch/?v=' . $fb_video_id;
		$post        = self::factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString(
			sprintf(
				'<div class="fb-video" data-allowfullscreen="true" data-href="%s" style="background-color: #fff; display: inline-block;"></div>',
				$url
			),
			$actual
		);
	}

	/**
	 * Test a Facebook Video using the alternate format (pagename/videos/xxx)
	 *
	 * @since 7.5.0
	 */
	public function test_shortcodes_facebook_video_alternate() {
		global $post;

		$fb_video_id = '546877659119730';
		$url         = 'https://www.facebook.com/AutomatticInc/videos/' . $fb_video_id;
		$post        = self::factory()->post->create_and_get( array( 'post_content' => $url ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString(
			sprintf(
				'<div class="fb-video" data-allowfullscreen="true" data-href="%s" style="background-color: #fff; display: inline-block;"></div>',
				$url
			),
			$actual
		);
	}
}
