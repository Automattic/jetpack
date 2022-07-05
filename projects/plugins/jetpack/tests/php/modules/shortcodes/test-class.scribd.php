<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Scribd extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * @author scotchfield
	 * @covers ::scribd_shortcode_handler
	 * @since 3.2
	 */
	public function test_shortcodes_scribd_exists() {
		$this->assertEquals( shortcode_exists( 'scribd' ), true );
	}

	/**
	 * Gets the test data for test_shortcodes_scribd().
	 *
	 * @return array The test data.
	 */
	public function get_data_shortcodes_scribd() {
		return array(
			'non_amp' => array(
				'[scribd id=39027960 key=key-3kaiwcjqhtipf25m8tw mode=list]',
				false,
				'<iframe class="scribd_iframe_embed" src="https://www.scribd.com/embeds/39027960/content?start_page=1&view_mode=list&access_key=key-3kaiwcjqhtipf25m8tw" data-auto-height="true" scrolling="no" id="scribd_39027960" width="100%" height="500" frameborder="0"></iframe><div style="font-size:10px;text-align:center;width:100%"><a href="https://www.scribd.com/doc/39027960" rel="noopener noreferrer" target="_blank">View this document on Scribd</a></div>',
			),
			'amp'     => array(
				'[scribd id=39027960 key=key-3kaiwcjqhtipf25m8tw mode=list]',
				true,
				'<iframe class="scribd_iframe_embed" src="https://www.scribd.com/embeds/39027960/content?start_page=1&view_mode=list&access_key=key-3kaiwcjqhtipf25m8tw" sandbox="allow-popups allow-scripts allow-same-origin" data-auto-height="true" scrolling="no" id="scribd_39027960" width="100%" height="500" frameborder="0"></iframe><div style="font-size:10px;text-align:center;width:100%"><a href="https://www.scribd.com/doc/39027960" rel="noopener noreferrer" target="_blank">View this document on Scribd</a></div>',
			),
		);
	}

	/**
	 * Tests the [scribd] shortcode output.
	 *
	 * @dataProvider get_data_shortcodes_scribd
	 * @author scotchfield
	 * @covers ::scribd_shortcode_handler
	 * @since 3.2
	 *
	 * @param string $shortcode The shortcode string.
	 * @param bool   $is_amp    Whether this is an AMP endpoint.
	 * @param string $expected  The expected return of the shortcode callback.
	 */
	public function test_shortcodes_scribd( $shortcode, $is_amp, $expected ) {
		if ( $is_amp && defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com is in the process of removing AMP plugin.' );
			return;
		}

		if ( $is_amp ) {
			add_filter( 'jetpack_is_amp_request', '__return_true' );
		}

		$actual = preg_replace( '/\s+/', ' ', do_shortcode( $shortcode ) );
		$actual = preg_replace( '/(?<=>)\s+(?=<)/', '', trim( $actual ) );

		$this->assertEquals( $expected, $actual );
	}

}
