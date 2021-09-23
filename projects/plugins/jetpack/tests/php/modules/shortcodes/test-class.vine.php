<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Vine extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * @author scotchfield
	 * @covers ::vine_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vine_exists() {
		$this->assertEquals( shortcode_exists( 'vine' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::vine_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vine() {
		$content = '[vine]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vine_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vine_url() {
		$url = 'https://vine.co/v/hBFxTlV36Tg';
		$content = '[vine url=' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $url, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vine_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vine_inappropriate_url() {
		$url = 'https://' . WP_TESTS_DOMAIN . '/v/hBFxTlV36Tg';
		$content = '[vine url=' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEmpty( $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vine_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vine_url_width_height() {
		$url = 'https://vine.co/v/hBFxTlV36Tg';
		$width = '300';
		$height = '300';
		$content = '[vine url=' . $url . ' width=' . $width . ' height=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $url, $shortcode_content );
		$this->assertStringContainsString( 'width="' . $width . '"', $shortcode_content );
		$this->assertStringContainsString( 'height="' . $height . '"', $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::vine_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_vine_url_postcard() {
		$url = 'https://vine.co/v/hBFxTlV36Tg';
		$type = 'postcard';
		$content = '[vine url=' . $url . ' type=' . $type . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $url, $shortcode_content );
		$this->assertStringContainsString( '/embed/' . $type, $shortcode_content );
	}

}
