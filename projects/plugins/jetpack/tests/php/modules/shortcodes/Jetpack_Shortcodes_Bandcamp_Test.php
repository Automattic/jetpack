<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class Jetpack_Shortcodes_Bandcamp_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author scotchfield
	 * @covers ::shortcode_handler_bandcamp
	 * @since 3.2
	 */
	public function test_shortcodes_bandcamp_exists() {
		$this->assertTrue( shortcode_exists( 'bandcamp' ) );
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
