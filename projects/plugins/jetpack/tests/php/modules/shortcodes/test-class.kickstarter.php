<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Kickstarter extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * Verify that [kickstarter] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_kickstarter_exists() {
		$this->assertEquals( shortcode_exists( 'kickstarter' ), true );
	}

	/**
	 * Verify that executing the shortcode doesn't return the same content but empty, since it has no attributes.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_kickstarter() {
		$content = '[kickstarter]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '', $shortcode_content );
	}

	/**
	 * Verify that executing shortcode with an invalid URL fails.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_kickstarter_invalid_url() {
		$content = '[kickstarter url="https://kikstarter.com"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( '<!-- Invalid Kickstarter URL -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a Kickstarter link.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_kickstarter_image() {
		$this->markTestSkipped();
		$url = 'https://www.kickstarter.com/projects/peaktoplateau/yak-wool-baselayers-from-tibet-to-the-world';
		$content = "[kickstarter url='$url']";

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<a href="https://www.kickstarter.com/projects/peaktoplateau/yak-wool-baselayers-from-tibet-to-the-world">', $shortcode_content );
	}
}
