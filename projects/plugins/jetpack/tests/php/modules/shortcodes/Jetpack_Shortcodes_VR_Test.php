<?php

use PHPUnit\Framework\Attributes\CoversFunction;

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * @covers ::jetpack_vr_viewer_shortcode
 */
#[CoversFunction( 'jetpack_vr_viewer_shortcode' )]
class Jetpack_Shortcodes_VR_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author mkaz
	 * @since 4.5
	 */
	public function test_shortcodes_vr_exists() {
		$this->assertTrue( shortcode_exists( 'vr' ) );
	}

	/**
	 * @author mkaz
	 * @since 4.5
	 */
	public function test_shortcodes_vr() {
		$content = '[vr]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author mkaz
	 * @since 4.5
	 */
	public function test_shortcodes_vr_url() {
		$img     = 'https://en-blog.files.wordpress.com/2016/12/regents_park.jpg';
		$content = '[vr url=' . $img . ' view=360]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $img, $shortcode_content );
	}

	/**
	 * @author mkaz
	 * @since 4.5
	 */
	public function test_shortcodes_vr_url_missing() {
		$content           = '[vr]';
		$shortcode_content = do_shortcode( $content );
		$this->assertEmpty( $shortcode_content );
	}
}
