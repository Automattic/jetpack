<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class Jetpack_Shortcodes_Presentations_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author scotchfield
	 * @covers Presentations::presentation_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_presentations_presentation_exists() {
		$this->assertTrue( shortcode_exists( 'presentation' ) );
	}

	/**
	 * @author scotchfield
	 * @covers Presentations::slide_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_presentations_slide_exists() {
		$this->assertTrue( shortcode_exists( 'slide' ) );
	}

	/**
	 * @author scotchfield
	 * @covers Presentations::presentation_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_presentations_presentation() {
		$content = '[presentation]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}
}
