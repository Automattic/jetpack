<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Youtube extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Mock global $content_width value.
	 *
	 * @var int
	 */
	const CONTENT_WIDTH = 600;

	/**
	 * Tear down after each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		unset( $GLOBALS['content_width'] );
		parent::tear_down();
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube_exists() {
		$this->assertEquals( shortcode_exists( 'youtube' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube() {
		$content = '[youtube]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::youtube_shortcode
	 * @since 3.2
	 */
	public function test_shortcodes_youtube_url() {
		$youtube_id = 'JaNH56Vpg-A';
		$url        = 'http://www.youtube.com/watch?v=' . $youtube_id;
		$content    = '[youtube=' . $url . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( $youtube_id, $shortcode_content );
	}

	/**
	 * Tests options within a YouTube URL as parsed as expected iframe parameters.
	 *
	 * @author kraftbj
	 * @covers ::youtube_id
	 * @dataProvider get_youtube_id_options
	 * @since 9.9
	 *
	 * @param string $url The YouTube URL.
	 * @param string $expected The expected iframe parameter output.
	 */
	public function test_shortcodes_youtube_id_options( $url, $expected ) {
		$output = youtube_id( $url );

		$this->assertStringContainsString( $expected, $output );
	}

	/**
	 * Data provider with various YouTube URLs with the expected iframe parameter.
	 */
	public function get_youtube_id_options() {
		return array(
			't_as_seconds' => array(
				'https://youtu.be/o-IvKy3322k?t=10683',
				'start=10683',
			),
			't_as_mixed'   => array(
				'https://youtu.be/o-IvKy3322k?t=1m1s',
				'start=61',
			),
		);
	}

	/**
	 * @author Toro_Unit
	 * @covers ::youtube_shortcode
	 * @since 3.9
	 */
	public function test_replace_url_with_iframe_in_the_content() {
		global $post;

		$youtube_id = 'JaNH56Vpg-A';
		$url        = 'http://www.youtube.com/watch?v=' . $youtube_id;
		$post       = self::factory()->post->create_and_get( array( 'post_content' => $url ) );

		wpcom_youtube_embed_crazy_url_init();
		setup_postdata( $post );
		ob_start();
		// This below is needed since Core inserts "loading=lazy" right after the iframe opener.
		add_filter( 'wp_lazy_loading_enabled', '__return_false' );
		the_content();
		remove_all_filters( 'wp_lazy_loading_enabled' );
		$actual = ob_get_clean();
		wp_reset_postdata();
		$this->assertStringContainsString( '<span class="embed-youtube"', $actual );
		$this->assertStringContainsString( '<iframe class="youtube-player"', $actual );
		$this->assertStringContainsString( "https://www.youtube.com/embed/$youtube_id", $actual );

	}

	/**
	 * Gets the test data for jetpack_shortcode_youtube_args().
	 *
	 * @return array[] The test data.
	 */
	public function get_youtube_args_data() {
		return array(
			'empty_url'                        => array(
				array(),
				false,
			),
			'only_in_query'                    => array(
				array( 'query' => 'foo=baz&bar=example&even=more' ),
				array(
					'foo'  => 'baz',
					'bar'  => 'example',
					'even' => 'more',
				),
			),
			'only_in_fragment'                 => array(
				array( 'fragment' => 'example=shown&additional=here' ),
				false,
			),
			'in_query_and_fragment'            => array(
				array(
					'query'    => 'foo=baz&example=more',
					'fragment' => 'add=another&there=more',
				),
				array(
					'foo'     => 'baz',
					'example' => 'more',
					'add'     => 'another',
					'there'   => 'more',
				),
			),
			'query_and_fragment_have_same_key' => array(
				array(
					'query'    => 'foo=inquery',
					'fragment' => 'foo=infragment',
				),
				array( 'foo' => 'inquery' ),
			),
		);
	}

	/**
	 * Test jetpack_shortcode_youtube_args.
	 *
	 * @dataProvider get_youtube_args_data
	 * @covers ::jetpack_shortcode_youtube_args
	 *
	 * @param array      $url The parsed URL in which to look for query args.
	 * @param array|bool $expected The expected return value of the tested function.
	 */
	public function test_jetpack_shortcode_youtube_args( $url, $expected ) {
		$this->assertEquals( $expected, jetpack_shortcode_youtube_args( $url ) );
	}

	/**
	 * Gets the test data for youtube_id().
	 *
	 * @return array[] The test data.
	 */
	public function get_amp_youtube_data() {
		$height                   = 360;
		$width                    = 640;
		$GLOBALS['content_width'] = $width;

		return array(
			'no_url'                  => array(
				'',
				'<!--YouTube Error: bad URL entered-->',
				'<!--YouTube Error: bad URL entered-->',
			),
			'valid_url'               => array(
				'https://www.youtube.com/watch?v=SVRiktFlWxI',
				'<span class="embed-youtube" style="text-align:center; display: block;"><amp-youtube data-videoid="SVRiktFlWxI" data-param-rel="1" data-param-showsearch="0" data-param-showinfo="1" data-param-iv_load_policy="1" data-param-fs="1" data-param-hl="en-US" data-param-autohide="2" data-param-wmode="transparent" width="' . $width . '" height="' . $height . '" layout="responsive"><a href="https://www.youtube.com/watch?v=SVRiktFlWxI" placeholder><amp-img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" alt="YouTube Poster" layout="fill" object-fit="cover"><noscript><img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" loading="lazy" decoding="async" alt="YouTube Poster"></noscript></amp-img></a></amp-youtube></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="640" height="360" src="https://www.youtube.com/embed/SVRiktFlWxI?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
			'short_youtube_url'       => array(
				'https://youtu.be/gS6_xOABTWo',
				'<span class="embed-youtube" style="text-align:center; display: block;"><amp-youtube data-videoid="gS6_xOABTWo" data-param-rel="1" data-param-showsearch="0" data-param-showinfo="1" data-param-iv_load_policy="1" data-param-fs="1" data-param-hl="en-US" data-param-autohide="2" data-param-wmode="transparent" width="' . $width . '" height="' . $height . '" layout="responsive"><a href="https://www.youtube.com/watch?v=gS6_xOABTWo" placeholder><amp-img src="https://i.ytimg.com/vi/gS6_xOABTWo/hqdefault.jpg" alt="YouTube Poster" layout="fill" object-fit="cover"><noscript><img src="https://i.ytimg.com/vi/gS6_xOABTWo/hqdefault.jpg" loading="lazy" decoding="async" alt="YouTube Poster"></noscript></amp-img></a></amp-youtube></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="640" height="360" src="https://www.youtube.com/embed/gS6_xOABTWo?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
			'url_without_id'          => array(
				'https://youtube.com',
				'<!--YouTube Error: bad URL entered-->',
				'<!--YouTube Error: bad URL entered-->',
			),
			'videoseries_url'         => array(
				'https://www.youtube.com/videoseries?list=PL56C3506BBE979C1B',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="640" height="360" layout="responsive" src="https://www.youtube.com/embed?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent&#038;listType=playlist&#038;list=PL56C3506BBE979C1B" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="640" height="360" src="https://www.youtube.com/embed?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent&#038;listType=playlist&#038;list=PL56C3506BBE979C1B" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
			'with_v_query_param'      => array(
				'https://www.youtube.com/watch?v=WVbQ-oro7FQ',
				'<span class="embed-youtube" style="text-align:center; display: block;"><amp-youtube data-videoid="WVbQ-oro7FQ" data-param-rel="1" data-param-showsearch="0" data-param-showinfo="1" data-param-iv_load_policy="1" data-param-fs="1" data-param-hl="en-US" data-param-autohide="2" data-param-wmode="transparent" width="' . $width . '" height="' . $height . '" layout="responsive"><a href="https://www.youtube.com/watch?v=WVbQ-oro7FQ" placeholder><amp-img src="https://i.ytimg.com/vi/WVbQ-oro7FQ/hqdefault.jpg" alt="YouTube Poster" layout="fill" object-fit="cover"><noscript><img src="https://i.ytimg.com/vi/WVbQ-oro7FQ/hqdefault.jpg" loading="lazy" decoding="async" alt="YouTube Poster"></noscript></amp-img></a></amp-youtube></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="640" height="360" src="https://www.youtube.com/embed/WVbQ-oro7FQ?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
			'only_width_in_url'       => array(
				'youtube="https://www.youtube.com/watch?v=SVRiktFlWxI&w=850"',
				'<span class="embed-youtube" style="text-align:center; display: block;"><amp-youtube data-videoid="SVRiktFlWxI" data-param-rel="1" data-param-showsearch="0" data-param-showinfo="1" data-param-iv_load_policy="1" data-param-fs="1" data-param-hl="en-US" data-param-autohide="2" data-param-wmode="transparent" width="850" height="479" layout="responsive"><a href="https://www.youtube.com/watch?v=SVRiktFlWxI" placeholder><amp-img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" alt="YouTube Poster" layout="fill" object-fit="cover"><noscript><img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" loading="lazy" decoding="async" alt="YouTube Poster"></noscript></amp-img></a></amp-youtube></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="850" height="479" src="https://www.youtube.com/embed/SVRiktFlWxI?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
			'only_height_in_url'      => array(
				'youtube="https://www.youtube.com/watch?v=SVRiktFlWxI&h=550"',
				'<span class="embed-youtube" style="text-align:center; display: block;"><amp-youtube data-videoid="SVRiktFlWxI" data-param-rel="1" data-param-showsearch="0" data-param-showinfo="1" data-param-iv_load_policy="1" data-param-fs="1" data-param-hl="en-US" data-param-autohide="2" data-param-wmode="transparent" width="' . $width . '" height="550" layout="responsive"><a href="https://www.youtube.com/watch?v=SVRiktFlWxI" placeholder><amp-img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" alt="YouTube Poster" layout="fill" object-fit="cover"><noscript><img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" loading="lazy" decoding="async" alt="YouTube Poster"></noscript></amp-img></a></amp-youtube></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="640" height="550" src="https://www.youtube.com/embed/SVRiktFlWxI?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
			'width_and_height_in_url' => array(
				'youtube="https://www.youtube.com/watch?v=SVRiktFlWxI&w=600&h=400"',
				'<span class="embed-youtube" style="text-align:center; display: block;"><amp-youtube data-videoid="SVRiktFlWxI" data-param-rel="1" data-param-showsearch="0" data-param-showinfo="1" data-param-iv_load_policy="1" data-param-fs="1" data-param-hl="en-US" data-param-autohide="2" data-param-wmode="transparent" width="600" height="400" layout="responsive"><a href="https://www.youtube.com/watch?v=SVRiktFlWxI" placeholder><amp-img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" alt="YouTube Poster" layout="fill" object-fit="cover"><noscript><img src="https://i.ytimg.com/vi/SVRiktFlWxI/hqdefault.jpg" loading="lazy" decoding="async" alt="YouTube Poster"></noscript></amp-img></a></amp-youtube></span>',
				'<span class="embed-youtube" style="text-align:center; display: block;"><iframe class="youtube-player" width="600" height="400" src="https://www.youtube.com/embed/SVRiktFlWxI?version=3&#038;rel=1&#038;showsearch=0&#038;showinfo=1&#038;iv_load_policy=1&#038;fs=1&#038;hl=en-US&#038;autohide=2&#038;wmode=transparent" allowfullscreen="true" style="border:0;" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></span>',
			),
		);
	}

	/**
	 * Test youtube_id.
	 *
	 * @dataProvider get_amp_youtube_data
	 * @covers ::youtube_id
	 *
	 * @param string $url             The shortcode URL.
	 * @param string $expected_amp    The expected shortcode returned from the function on AMP pages.
	 * @param string $expected_nonamp The expected shortcode returned from the function on non-AMP pages.
	 */
	public function test_youtube_id( $url, $expected_amp, $expected_nonamp ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$this->assertEquals( $expected_amp, youtube_id( $url ) );

		remove_filter( 'jetpack_is_amp_request', '__return_true' );
		$this->assertEquals( $expected_nonamp, youtube_id( $url ) );
	}

	/**
	 * Gets the test data for get_amp_youtube_shortcode_data().
	 *
	 * @return array[] The test data.
	 */
	public function get_amp_youtube_shortcode_data() {
		return array(
			'empty_argument'  => array(
				array(),
				array( self::CONTENT_WIDTH, 338 ),
			),
			'only_w_present'  => array(
				array( 'w' => 500 ),
				array( 500, 282 ),
			),
			'only_h_present'  => array(
				array( 'h' => 600 ),
				array( self::CONTENT_WIDTH, 600 ),
			),
			'w_and_h_present' => array(
				array(
					'w' => 500,
					'h' => 400,
				),
				array( 500, 400 ),
			),
		);
	}

	/**
	 * Test youtube_id.
	 *
	 * @dataProvider get_amp_youtube_shortcode_data
	 * @covers ::jetpack_shortcode_youtube_dimensions
	 *
	 * @param array  $query_args The query args to pass to the function.
	 * @param string $expected The expected return value.
	 */
	public function test_jetpack_shortcode_youtube_dimensions( $query_args, $expected ) {
		$GLOBALS['content_width'] = self::CONTENT_WIDTH;
		$this->assertEquals( $expected, jetpack_shortcode_youtube_dimensions( $query_args ) );
	}
}
