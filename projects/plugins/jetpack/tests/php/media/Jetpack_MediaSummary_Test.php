<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

if ( ! class_exists( 'Jetpack_Media_Summary' ) ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.media-summary.php';
}

/**
 * @covers \Jetpack_Media_Summary
 */
#[CoversClass( Jetpack_Media_Summary::class )]
class Jetpack_MediaSummary_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @author scotchfield
	 * @since 3.2
	 * @todo find a better way to test this large function
	 */
	public function test_mediasummary_get() {
		$post_id = self::factory()->post->create( array() );

		$get_obj = Jetpack_Media_Summary::get( $post_id );

		$this->assertIsArray( $get_obj );
	}

	/**
	 * @dataProvider provide_video_blocks
	 *
	 * @param string $content  Post content.
	 * @param array  $expected Expected subset of the summary.
	 */
	#[DataProvider( 'provide_video_blocks' )]
	public function test_mediasummary_get_video_blocks( $content, $expected ) {
		set_transient(
			'jetpack_videopress_OcobLTqC',
			(object) array(
				'poster' => 'https://videos.files.wordpress.com/OcobLTqC/poster.jpg',
				'files'  => (object) array( 'std' => (object) array( 'mp4' => 'video.mp4' ) ),
			)
		);
		set_transient( 'jetpack_videopress_NoMp4Gd1', (object) array( 'poster' => '' ) );
		$post_id = self::factory()->post->create( array( 'post_content' => $content ) );

		$summary = Jetpack_Media_Summary::get( $post_id );

		$this->assertEquals( $expected, array_intersect_key( $summary, $expected ) );
	}

	/**
	 * Data provider for test_mediasummary_get_video_blocks.
	 *
	 * @return array[]
	 */
	public static function provide_video_blocks() {
		$videopress        = array(
			'type'  => 'video',
			'video' => 'https://videos.files.wordpress.com/OcobLTqC/video.mp4',
			'image' => 'https://videos.files.wordpress.com/OcobLTqC/poster.jpg',
		);
		$self_hosted_video = '<figure class="wp-block-video"><video controls poster="https://example.com/poster.jpg" src="https://example.com/clip.mp4"></video></figure>';
		$self_hosted       = array(
			'type'       => 'video',
			'video'      => 'https://example.com/clip.mp4',
			'image'      => 'https://example.com/poster.jpg',
			'video_type' => 'video/mp4',
		);

		return array(
			'VideoPress block'                             => array( '<!-- wp:videopress/video {"guid":"OcobLTqC","id":5} /-->', $videopress ),
			'core Video block with VideoPress'             => array( '<!-- wp:video {"guid":"OcobLTqC","id":5} --><figure class="wp-block-video"></figure><!-- /wp:video -->', $videopress ),
			'nested self-hosted Video block'               => array(
				'<!-- wp:group --><div class="wp-block-group"><!-- wp:video {"id":6} -->' . $self_hosted_video . '<!-- /wp:video --></div><!-- /wp:group -->',
				$self_hosted,
			),
			'only the first VideoPress video is looked up' => array(
				'<!-- wp:videopress/video {"guid":"NoMp4Gd1"} /--><!-- wp:videopress/video {"guid":"OcobLTqC"} /--><!-- wp:video {"id":6} -->' . $self_hosted_video . '<!-- /wp:video -->',
				$self_hosted,
			),
			'self-hosted Video without a known video type' => array(
				'<!-- wp:video {"id":6} --><figure class="wp-block-video"><video controls poster="https://example.com/poster.jpg" src="https://example.com/stream"></video></figure><!-- /wp:video -->',
				array( 'type' => 'standard' ),
			),
			'self-hosted Video without poster'             => array(
				'<!-- wp:video {"id":6} --><figure class="wp-block-video"><video controls src="https://example.com/clip.mp4"></video></figure><!-- /wp:video -->',
				array( 'type' => 'standard' ),
			),
		);
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_https() {
		$content  = 'http://' . WP_TESTS_DOMAIN . '/';
		$expected = 'https://' . WP_TESTS_DOMAIN . '/';

		$this->assertEquals( $expected, Jetpack_Media_Summary::https( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_ssl_img() {
		$content  = 'http://' . WP_TESTS_DOMAIN . '/';
		$expected = 'https://' . WP_TESTS_DOMAIN . '/';

		$this->assertEquals( $expected, Jetpack_Media_Summary::ssl_img( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_ssl_img_wordpress_domain() {
		$content  = 'http://files.wordpress.com/';
		$expected = 'https://files.wordpress.com/';

		$this->assertEquals( $expected, Jetpack_Media_Summary::ssl_img( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_clean_text_empty() {
		$content = '';

		$this->assertEmpty( Jetpack_Media_Summary::clean_text( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_clean_text_simple() {
		$shortcode = 'test_mediasummary_shortcode';
		add_shortcode( $shortcode, array( $this, 'shortcode_nop' ) );

		$content = '[' . $shortcode . '] <a href="' . WP_TESTS_DOMAIN . '">test</a>';

		$this->assertEquals( 'test', Jetpack_Media_Summary::clean_text( $content ) );
	}

	public function shortcode_nop() { }

	/**
	 * By default, clean_text() strips http(s) URLs from the text.
	 */
	public function test_mediasummary_clean_text_strips_urls_by_default() {
		$content = 'Check this out https://example.com/page and more.';

		$this->assertEquals( 'Check this out and more.', Jetpack_Media_Summary::clean_text( $content ) );
	}

	/**
	 * When $preserve_urls is true, clean_text() keeps http(s) URLs but still collapses whitespace and trims.
	 */
	public function test_mediasummary_clean_text_preserves_urls_when_requested() {
		$content = 'Check this out https://example.com/page and more.';

		$this->assertEquals( $content, Jetpack_Media_Summary::clean_text( $content, true ) );

		// URL preservation is the only behavior change: whitespace is still collapsed and trimmed.
		$messy = '  Visit   https://example.com/x   now  ';
		$this->assertEquals( 'Visit https://example.com/x now', Jetpack_Media_Summary::clean_text( $messy, true ) );
	}

	/**
	 * The get_excerpt() method strips URLs by default but keeps them when $preserve_urls is true.
	 */
	public function test_mediasummary_get_excerpt_preserve_urls() {
		$post_id = self::factory()->post->create(
			array(
				'post_excerpt' => 'Visit https://example.com today',
			)
		);
		$post    = get_post( $post_id );

		$this->assertEquals(
			'Visit today',
			Jetpack_Media_Summary::get_excerpt( $post->post_content, $post->post_excerpt, 16, 256, $post )
		);

		$this->assertEquals(
			'Visit https://example.com today',
			Jetpack_Media_Summary::get_excerpt( $post->post_content, $post->post_excerpt, 16, 256, $post, true )
		);
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_get_word_count_empty() {
		$content = '';

		$this->assertSame( 0, Jetpack_Media_Summary::get_word_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_get_word_count_sample() {
		$content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

		$this->assertEquals( 19, Jetpack_Media_Summary::get_word_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_get_link_count_empty() {
		$content = '';

		$this->assertSame( 0, Jetpack_Media_Summary::get_link_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_get_link_count_simple() {
		$content = '<a href="' . WP_TESTS_DOMAIN . '"></a>';

		$this->assertSame( 1, Jetpack_Media_Summary::get_link_count( $content ) );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_mediasummary_get_link_count_invalid_tag() {
		$content = '<abbr title="Canada">CA</abbr>';

		$this->assertSame( 0, Jetpack_Media_Summary::get_link_count( $content ) );
	}
}
