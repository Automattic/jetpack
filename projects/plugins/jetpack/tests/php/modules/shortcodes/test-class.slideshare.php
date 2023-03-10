<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Slideshare extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author scotchfield
	 * @covers ::slideshare_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_slideshare_exists() {
		$this->assertEquals( shortcode_exists( 'slideshare' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::slideshare_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_slideshare() {
		$content = '[slideshare]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_slideshare_id() {
		$content = '[slideshare id=5342235]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_slideshare_id_content() {
		$content = '[slideshare id=5342235]';

		$shortcode_content = do_shortcode( $content );

		$this->assertSame( 0, strpos( $shortcode_content, "<iframe src='https://www.slideshare.net/slideshow/embed_code/5342235'" ) );
	}

	public function test_shortcodes_slideshare_fb_arg() {
		$content = '[slideshare id=5342235&amp;fb=0&amp;mw=0&amp;mh=0&amp;sc=no]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( ! false, strpos( $shortcode_content, 'frameborder' ) );
	}

	public function test_shortcodes_slideshare_no_fb_arg() {
		$content = '[slideshare id=5342235&amp;mw=0&amp;mh=0&amp;sc=no]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringNotContainsString( 'frameborder', $shortcode_content );
	}
}
