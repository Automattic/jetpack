<?php

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * @covers ::jetpack_facebook_embed_handler
 * @covers ::jetpack_facebook_shortcode_handler
 * @covers ::jetpack_facebook_embed_reversal
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

	/**
	 * Test converting an embed code from Facebook.com into an oEmbeddable URL.
	 *
	 * @dataProvider data_provider_embed_to_url
	 *
	 * @since x.x.x
	 *
	 * @param string $embed The embed code to test.
	 * @param string $expected The expected result.
	 */
	public function test_embed_to_url( $embed, $expected ) {
		$result = jetpack_facebook_embed_reversal( $embed );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * List of possible code snippets that should (or not) be converted to an oEmbeddable URL.
	 *
	 * @return array
	 */
	public static function data_provider_embed_to_url() {
		// Link on a line by itself.
		$facebook_url = "\n\nhttps://www.facebook.com/techcrunch/posts/pfbid0997g1PXQKfyFNHNTiCgaCFevt3PRFMaUBBB9eEFPR5NsXCv8EXxBw3p9bBYezWkHl\n\n";

		return array(
			'should be converted'         => array(
				'<iframe src="https://www.facebook.com/plugins/post.php?href=' . urlencode( $facebook_url ) . '&show_text=true&width=500" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
				$facebook_url,
			),
			'Wrong domain'                => array(
				'<iframe src="https://www.fakebook.com/plugins/post.php?href=' . urlencode( $facebook_url ) . '&show_text=true&width=500" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
				'<iframe src="https://www.fakebook.com/plugins/post.php?href=' . urlencode( $facebook_url ) . '&show_text=true&width=500" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
			),
			'Missing query params'        => array(
				'<iframe src="https://www.facebook.com/plugins/post.php" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
				'<iframe src="https://www.facebook.com/plugins/post.php" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
			),
			'Missing the main href param' => array(
				'<iframe src="https://www.facebook.com/plugins/post.php?show_text=true&width=500" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
				'<iframe src="https://www.facebook.com/plugins/post.php?show_text=true&width=500" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',
			),
		);
	}
}
