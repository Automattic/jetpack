<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Dailymotion extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * The global $content_width value.
	 *
	 * @var string
	 */
	const CONTENT_WIDTH = 600;

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_exists() {
		$this->assertEquals( shortcode_exists( 'dailymotion' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion() {
		$content = '[dailymotion]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_id() {
		$id      = 'x8oma9';
		$content = '[dailymotion id=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_missing_id() {
		$content = '[dailymotion]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals( '<!--Dailymotion error: bad or missing ID-->', $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_title() {
		$id      = 'x8oma9';
		$title   = '2';
		$content = '[dailymotion id=' . $id . ' title=' . $title . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_user() {
		$id      = 'x8oma9';
		$user    = '3';
		$content = '[dailymotion id=' . $id . ' user=' . $user . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $id, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::dailymotion_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_dailymotion_video() {
		$id      = 'x8oma9';
		$video   = '4';
		$content = '[dailymotion id=' . $id . ' video=' . $video . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $id, $shortcode_content );
	}

	/**
	 * @author mathildes
	 * @covers ::dailymotion_shortcode
	 * @since 4.2.0
	 */
	public function test_shortcodes_dailymotion_width_height() {
		$video_id = 'x8oma9';
		$width    = '350';
		$height   = '500';
		$content  = '[dailymotion id=' . $video_id . ' width=' . $width . ' height=' . $height . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $video_id, $shortcode_content );
		$this->assertStringContainsString( 'width="' . $width . '"', $shortcode_content );
		$this->assertStringContainsString( 'height="' . $height . '"', $shortcode_content );
	}

		/**
		 * @author mathildes
		 * @covers ::dailymotion_shortcode
		 * @since 4.2.0
		 */
	public function test_shortcodes_dailymotion_params() {
		// only testing a subset of params
		$video_id = 'x8oma9';
		$content  = '[dailymotion id='
			. $video_id
			. ' autoplay=1 endscreen-enable=0 mute=1 sharing-enable=0 start=45 subtitles-default=en ui-highlight=ffcc33 ui-logo=0 ui-start-screen-info=0 ui-theme=dark]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $video_id, $shortcode_content );
		$this->assertStringContainsString( 'autoplay=1', $shortcode_content );
		$this->assertStringContainsString( 'endscreen-enable=0', $shortcode_content );
		$this->assertStringContainsString( 'mute=1', $shortcode_content );
		$this->assertStringContainsString( 'sharing-enable=0', $shortcode_content );
		$this->assertStringContainsString( 'start=45', $shortcode_content );
		$this->assertStringContainsString( 'subtitles-default=en', $shortcode_content );
		$this->assertStringContainsString( 'ui-highlight=ffcc33', $shortcode_content );
		$this->assertStringContainsString( 'ui-logo=0', $shortcode_content );
		$this->assertStringContainsString( 'ui-start-screen-info=0', $shortcode_content );
		$this->assertStringContainsString( 'ui-theme=dark', $shortcode_content );
	}

	/**
	 * Gets the test data for test_shortcodes_dailymotion_amp().
	 *
	 * @return array The test data.
	 */
	public function get_dailymotion_amp_data() {
		$id             = 26423151;
		$default_height = 471;

		return array(
			'no_attribute'            => array(
				'[dailymotion]',
				'<!--Dailymotion error: bad or missing ID-->',
			),
			'plain_id'                => array(
				'[dailymotion ' . $id . ']',
				'<amp-dailymotion data-videoid="' . $id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '"></amp-dailymotion>',
			),
			'id_value_as_attribute'   => array(
				'[dailymotion id=' . $id . ']',
				'<amp-dailymotion data-videoid="' . $id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '"></amp-dailymotion>',
			),
			'dailymotion_value'       => array(
				'[dailymotion=' . $id . ']',
				'<amp-dailymotion data-videoid="' . $id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '"></amp-dailymotion>',
			),
			'width_in_attributes'     => array(
				'[dailymotion ' . $id . ' width=300]',
				'<amp-dailymotion data-videoid="' . $id . '" layout="responsive" width="300" height="235"></amp-dailymotion>',
			),
			'0_width_in_attributes'   => array(
				'[dailymotion ' . $id . ' width=0]',
				'<amp-dailymotion data-videoid="' . $id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '"></amp-dailymotion>',
			),
			'id_as_dailymotion_value' => array(
				'[dailymotion=' . $id . ']',
				'<amp-dailymotion data-videoid="' . $id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '"></amp-dailymotion>',
			),
		);
	}

	/**
	 * Test the AMP-compatible [dailymotion] shortcode on an AMP endpoint.
	 *
	 * @dataProvider get_dailymotion_amp_data
	 * @since 8.0.0
	 *
	 * @param string $shortcode_content The shortcode, like [dailymotion 1234].
	 * @param string $expected The expected return value of the function.
	 */
	public function test_shortcodes_dailymotion_amp( $shortcode_content, $expected ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		global $content_width;
		$content_width = self::CONTENT_WIDTH;

		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$this->assertEquals( $expected, do_shortcode( $shortcode_content ) );
	}

	/**
	 * Test that the AMP [dailymotion] shortcode logic doesn't run on a non-AMP endpoint.
	 *
	 * @dataProvider get_dailymotion_amp_data
	 * @since 8.0.0
	 *
	 * @param string $shortcode_content The shortcode as entered in the editor.
	 */
	public function test_shortcodes_dailymotion_non_amp( $shortcode_content ) {
		add_filter( 'jetpack_is_amp_request', '__return_false' );
		$this->assertStringNotContainsString( 'amp-dailymotion', do_shortcode( $shortcode_content ) );
	}

}
