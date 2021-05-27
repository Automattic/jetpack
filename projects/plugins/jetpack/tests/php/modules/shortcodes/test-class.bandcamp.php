<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Bandcamp extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author scotchfield
	 * @covers ::shortcode_handler_bandcamp
	 * @since 3.2
	 */
	public function test_shortcodes_bandcamp_exists() {
		$this->assertEquals( shortcode_exists( 'bandcamp' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_handler_bandcamp
	 * @since 3.2
	 */
	public function test_shortcodes_bandcamp() {
		$content = '[bandcamp]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

}
