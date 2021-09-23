<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Tweet extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertStringContains;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		if ( in_array( 'external-http', $this->getGroups(), true ) ) {
			// Used by WordPress.com - does nothing in Jetpack.
			add_filter( 'tests_allow_http_request', '__return_true' );
		} else {
			/**
			 * We normally make an HTTP request to Instagram's oEmbed endpoint.
			 * This filter bypasses that HTTP request for these tests.
			 */
			add_filter( 'pre_http_request', array( $this, 'pre_http_request' ), 10, 3 );
		}
	}

	public function pre_http_request( $response, $args, $url ) {
		if ( 0 !== strpos( $url, 'https://publish.twitter.com/oembed?' ) ) {
			return $response;
		}

		$oembed_query      = wp_parse_url( $url, PHP_URL_QUERY );
		$oembed_query_args = null;
		wp_parse_str( $oembed_query, $oembed_query_args );
		if ( ! isset( $oembed_query_args['url'] ) ) {
			return new WP_Error( 'unexpected-http-request', 'Test is making an unexpected HTTP request.' );
		}

		if ( 'https://twitter.com/jetpack/status/759034293385502721' !== $oembed_query_args['url'] ) {
			return new WP_Error( 'unexpected-http-request', 'Test is making an unexpected HTTP request.' );
		}

		if ( $oembed_query_args['align'] === 'none' ) {
			$align = '';
		} else {
			$align = "align=\\\"{$oembed_query_args['align']}\\\" ";
		}

		$body = <<<BODY
{
  "url": "https://twitter.com/jetpack/status/759034293385502721",
  "author_name": "Jetpack",
  "author_url": "https://twitter.com/jetpack",
  "html": "<blockquote class=\\"twitter-tweet\\" {$align}data-width=\\"500\\" data-lang=\\"{$oembed_query_args['lang']}\\" data-dnt=\\"true\\" data-partner=\\"jetpack\\"><p lang=\\"en\\" dir=\\"ltr\\">In this month’s Hook of the Month feature, learn how to customize Jetpack Related Posts! <a href=\\"https://t.co/lM6G28QpLS\\">https://t.co/lM6G28QpLS</a> <a href=\\"https://t.co/0Mn5ALQoKT\\">pic.twitter.com/0Mn5ALQoKT</a></p>&mdash; Jetpack (@jetpack) <a href=\\"https://twitter.com/jetpack/status/759034293385502721?ref_src=twsrc%5Etfw\\">July 29, 2016</a></blockquote>\\n",
  "width": 500,
  "height": null,
  "type": "rich",
  "cache_age": "3153600000",
  "provider_name": "Twitter",
  "provider_url": "https://twitter.com",
  "version": "1.0"
}
BODY;

		return array(
			'response' => array(
				'code' => 200,
			),
			'body'     => $body,
		);
	}

	/**
	 * Verify that [tweet] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_tweet_exists() {
		$this->assertEquals( shortcode_exists( 'tweet' ), true );
	}

	/**
	 * Verify that calling do_shortcode with the shortcode doesn't return the same content.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet() {
		$content = '[tweet]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertEquals( '<!-- Invalid tweet id -->', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a tweet card.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet_card() {
		$content = '[tweet https://twitter.com/jetpack/status/759034293385502721]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<blockquote class="twitter-tweet"', $shortcode_content );
		// Not testing here for actual URL because wp_oembed_get might return a shortened Twitter URL with t.co domain
	}

	/**
	 * Verify that rendering the shortcode with custom parameters adds them to the tweet card.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet_card_parameters() {
		$content = '[tweet https://twitter.com/jetpack/status/759034293385502721 align=right lang=es]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'align="right"', $shortcode_content );
		$this->assertStringContainsString( 'data-lang="es"', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode with only the tweet ID produces a correct output.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_tweet_id_only() {
		$content = '[tweet 759034293385502721]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<blockquote class="twitter-tweet"', $shortcode_content );
		// Not testing here for actual URL because wp_oembed_get might return a shortened Twitter URL with t.co domain
	}

	/**
	 * Verify that rendering the shortcode contains Jetpack's partner ID
	 *
	 * @since 4.6.0
	 */
	public function test_shortcode_tweet_partner_id() {
		$content = '[tweet 759034293385502721]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'data-partner="jetpack"', $shortcode_content );
	}

	/**
	 * Verify that rendering the shortcode returns a tweet card.
	 *
	 * @group external-http
	 * @since 7.4.0
	 */
	public function test_shortcodes_tweet_card_via_oembed_http_request() {
		$content = '[tweet https://twitter.com/jetpack/status/759034293385502721]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '<blockquote class="twitter-tweet"', $shortcode_content );
		// Not testing here for actual URL because wp_oembed_get might return a shortened Twitter URL with t.co domain
	}

	/**
	 * Gets the test data for test_shortcodes_tweet_amp().
	 *
	 * @return array The test data.
	 */
	public function get_tweet_amp_data() {
		$tweet_id       = 95234262;
		$default_height = 480;
		$default_width  = 600;

		return array(
			'no_attributes'         => array(
				'[tweet]',
				'<!-- Invalid tweet id -->',
			),
			'id_in_attributes'      => array(
				'[tweet ' . $tweet_id . ']',
				'<amp-twitter data-tweetid="' . $tweet_id . '" layout="responsive" width="' . $default_width . '" height="' . $default_height . '"></amp-twitter>',
			),
			'width_in_attributes'   => array(
				'[tweet ' . $tweet_id . ' width=300]',
				'<amp-twitter data-tweetid="' . $tweet_id . '" layout="responsive" width="300" height="' . $default_height . '"></amp-twitter>',
			),
			'0_width_in_attributes' => array(
				'[tweet ' . $tweet_id . ' width=0]',
				'<amp-twitter data-tweetid="' . $tweet_id . '" layout="responsive" width="' . $default_width . '" height="' . $default_height . '"></amp-twitter>',
			),
			'id_as_part_of_url'     => array(
				'[tweet https://twitter.com/jetpack/status/' . $tweet_id . ']',
				'<amp-twitter data-tweetid="' . $tweet_id . '" layout="responsive" width="' . $default_width . '" height="' . $default_height . '"></amp-twitter>',
			),
			'id_in_tweet_attribute' => array(
				'[tweet tweet=' . $tweet_id . ']',
				'<amp-twitter data-tweetid="' . $tweet_id . '" layout="responsive" width="' . $default_width . '" height="' . $default_height . '"></amp-twitter>',
			),
		);
	}

	/**
	 * Test the AMP-compatible [tweet] shortcode on an AMP endpoint.
	 *
	 * @dataProvider get_tweet_amp_data
	 * @since 8.0.0
	 *
	 * @param string $shortcode_content The shortcode, like [tweet 1234].
	 * @param string $expected The expected return value of the function.
	 */
	public function test_shortcodes_tweet_amp( $shortcode_content, $expected ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$this->assertEquals( $expected, do_shortcode( $shortcode_content ) );
	}

	/**
	 * Test that the AMP [tweet] shortcode logic doesn't run on a non-AMP endpoint.
	 *
	 * @dataProvider get_tweet_amp_data
	 * @since 8.0.0
	 *
	 * @param string $shortcode_content The shortcode as entered in the editor.
	 */
	public function test_shortcodes_tweet_non_amp( $shortcode_content ) {
		add_filter( 'jetpack_is_amp_request', '__return_false' );
		$this->assertStringNotContainsString( 'amp-twitter', do_shortcode( $shortcode_content ) );
	}
}
