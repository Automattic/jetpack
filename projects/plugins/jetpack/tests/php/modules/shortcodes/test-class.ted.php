<?php

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * @covers ::shortcode_ted
 */
class WP_Test_Jetpack_Shortcodes_Ted extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

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
		if ( 0 !== strpos( $url, 'https://www.ted.com/services/v1/oembed.json?' ) ) {
			return $response;
		}

		$oembed_query      = wp_parse_url( $url, PHP_URL_QUERY );
		$oembed_query_args = null;
		wp_parse_str( $oembed_query, $oembed_query_args );
		if ( ! isset( $oembed_query_args['maxheight'], $oembed_query_args['maxwidth'], $oembed_query_args['url'], $oembed_query_args['lang'] ) ) {
			return new WP_Error( 'unexpected-http-request', 'Test is making an unexpected HTTP request.' );
		}

		switch ( $oembed_query_args['lang'] ) {
			case 'en':
				$body = <<<BODY
{
  "type": "video",
  "version": "1.0",
  "width": {$oembed_query_args['maxwidth']},
  "height": {$oembed_query_args['maxheight']},
  "title": "Louie Schwartzberg: Hidden miracles of the natural world",
  "description": "We live in a world of unseeable beauty, so subtle and delicate that it is imperceptible to the human eye. To bring this invisible world to light, filmmaker Louie Schwartzberg bends the boundaries of time and space with high-speed cameras, time lapses and microscopes. At TED2014, he shares highlights from his latest project, a 3D film titled \"Mysteries of the Unseen World,\" which slows down, speeds up, and magnifies the astonishing wonders of nature.",
  "url": "https://www.ted.com/talks/louie_schwartzberg_hidden_miracles_of_the_natural_world",
  "author_name": "Louie Schwartzberg",
  "provider_name": "TED",
  "provider_url": "https://www.ted.com",
  "cache_age": 300,
  "thumbnail_url": "https://pi.tedcdn.com/r/pe.tedcdn.com/images/ted/8e9b98419c9ae6d1a42be0e473de30db4017b99d_1600x1200.jpg?h={$oembed_query_args['maxwidth']}&w={$oembed_query_args['maxheight']}",
  "thumbnail_width": {$oembed_query_args['maxwidth']},
  "thumbnail_height": {$oembed_query_args['maxheight']},
  "author_url": "https://www.ted.com/speakers/louie_schwartzberg",
  "html": "<iframe src=\"https://embed.ted.com/talks/louie_schwartzberg_hidden_miracles_of_the_natural_world\" width=\"{$oembed_query_args['maxwidth']}\" height=\"{$oembed_query_args['maxheight']}\" frameborder=\"0\" scrolling=\"no\" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>"
}
BODY;
				break;
			case 'fr':
				$body = <<<BODY
{
  "type": "video",
  "version": "1.0",
  "width": {$oembed_query_args['maxwidth']},
  "height": {$oembed_query_args['maxheight']},
  "title": "Louie Schwartzberg: Les miracles cach\\u00e9s de la nature ",
  "description": "Nous vivons dans un monde de beaut\\u00e9 invisible, si subtil et d\\u00e9licat, qu'il est imperceptible \\u00e0 l'\\u0153il humain. Afin de r\\u00e9v\\u00e9ler ce monde invisible, le cin\\u00e9aste Louie Schwartzberg d\\u00e9fie les fronti\\u00e8res du temps et de l\\u2019espace avec des cam\\u00e9ras \\u00e0 grande vitesse, des prises de vue rapides et des microscopes.\\nA TED2014, il partage les points saillants de son dernier projet, un film en 2D intitul\\u00e9  \\u00ab Les myst\\u00e8res d'un monde inaper\\u00e7u \\u00bb, qui ralentit, acc\\u00e9l\\u00e8re et glorifie les incroyables merveilles de la nature.",
  "url": "https:\/\/www.ted.com\/talks\/louie_schwartzberg_hidden_miracles_of_the_natural_world?language=fr",
  "author_name": "Louie Schwartzberg",
  "provider_name": "TED",
  "provider_url": "https:\/\/www.ted.com",
  "cache_age": 300,
  "thumbnail_url": "https://pi.tedcdn.com/r/pe.tedcdn.com/images/ted/8e9b98419c9ae6d1a42be0e473de30db4017b99d_1600x1200.jpg?h={$oembed_query_args['maxwidth']}&w={$oembed_query_args['maxheight']}",
  "thumbnail_width": {$oembed_query_args['maxwidth']},
  "thumbnail_height": {$oembed_query_args['maxheight']},
  "author_url": "https:\/\/www.ted.com\/speakers\/louie_schwartzberg",
  "html": "<iframe src=\"https:\/\/embed.ted.com\/talks\/lang\/fr\/louie_schwartzberg_hidden_miracles_of_the_natural_world\" width=\"{$oembed_query_args['maxwidth']}\" height=\"{$oembed_query_args['maxheight']}\" frameborder=\"0\" scrolling=\"no\" webkitAllowFullScreen mozallowfullscreen allowFullScreen><\/iframe>"
}
BODY;
				break;
			default:
				return new WP_Error( 'unexpected-http-request', 'Test is making an unexpected HTTP request.' );
		}

		return array(
			'response' => array(
				'code' => 200,
			),
			'body'     => $body,
		);
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_exists() {
		$this->assertEquals( shortcode_exists( 'ted' ), true );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted() {
		$content = '[ted]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_id() {
		$ted_id  = '1969';
		$content = '[ted id=' . $ted_id . ']';

		$post_id = self::factory()->post->create(
			array(
				'post-content' => $content,
			)
		);

		$GLOBALS['post'] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'ted.com/talks/louie_schwartzberg_hidden_miracles_of_the_natural_world', $shortcode_content );
		$this->assertStringContainsString( 'sandbox="allow-popups allow-scripts allow-same-origin"', $shortcode_content );

		unset( $GLOBALS['post'] );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_width_height() {
		$ted_id  = '1969';
		$width   = '560';
		$height  = '315';
		$content = '[ted id=' . $ted_id . ' width=' . $width . ' height=' . $height . ']';

		$post_id         = self::factory()->post->create(
			array(
				'post-content' => $content,
			)
		);
		$GLOBALS['post'] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'width="' . $width . '"', $shortcode_content );
		$this->assertStringContainsString( 'height="' . $height . '"', $shortcode_content );

		unset( $GLOBALS['post'] );
	}

	/**
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @since 3.2
	 */
	public function test_shortcodes_ted_lang() {
		$ted_id  = '1969';
		$lang    = 'fr';
		$content = '[ted id=' . $ted_id . ' lang=' . $lang . ']';

		$post_id         = self::factory()->post->create(
			array(
				'post-content' => $content,
			)
		);
		$GLOBALS['post'] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( '/lang/' . $lang . '/', $shortcode_content );

		unset( $GLOBALS['post'] );
	}

	/**
	 * Uses a real HTTP request to Instagram's oEmbed endpoint.
	 *
	 * @see ::set_up()
	 * @author scotchfield
	 * @covers ::shortcode_ted
	 * @group external-http
	 * @since 7.4.0
	 */
	public function test_shortcodes_ted_id_via_oembed_http_request() {
		$ted_id  = '1969';
		$content = '[ted id=' . $ted_id . ']';

		$post_id = self::factory()->post->create(
			array(
				'post-content' => $content,
			)
		);

		$GLOBALS['post'] = get_post( $post_id );

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString( 'ted.com/talks/louie_schwartzberg_hidden_miracles_of_the_natural_world', $shortcode_content );

		unset( $GLOBALS['post'] );
	}
}
