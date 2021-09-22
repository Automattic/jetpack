<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Hulu extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Stores the correct server to fetch Hulu embeds from.
	 *
	 * @since 4.4.0
	 *
	 * @var string
	 */
	private $src;

	/**
	 * Stores a Hulu video ID.
	 *
	 * @since 4.4.0
	 *
	 * @var string
	 */
	private $video_id;

	/**
	 * Stores a Hulu direct video eid.
	 *
	 * @since 4.4.0
	 *
	 * @var string
	 */
	private $video_eid;

	/**
	 * Setup environment for Hulu embed.
	 *
	 * @since 4.5.0
	 */
	public function set_up() {
		parent::set_up();

		$this->src = 'https://www.hulu.com/embed.html?eid=';
		$this->video_id = '771496';
		$this->video_eid = '_hHzwnAcj3RrXMJFDDvkuw';

		if ( in_array( 'external-http', $this->getGroups(), true ) ) {
			// Used by WordPress.com - does nothing in Jetpack.
			add_filter( 'tests_allow_http_request', '__return_true' );
		} else {
			/**
			 * We normally make an HTTP request to Hulu's oEmbed endpoint
			 * to translate id (human readable video ID) -> eid (Hulu's internal video ID).
			 * This filter bypasses that HTTP request for these tests.
			 */
			add_filter( "pre_transient_hulu-{$this->video_id}", array( $this, '_video_eid' ) );
		}
	}

	public function _video_eid() {
		return $this->video_eid;
	}

	public function test_shortcodes_hulu_exists() {
		$this->assertEquals( shortcode_exists( 'hulu' ), true );
	}

	public function test_shortcodes_hulu() {
		$content = '[hulu]';
		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	public function test_shortcodes_hulu_id() {
		$content  = "[hulu $this->video_id]";
		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $this->src . $this->video_eid, $shortcode_content );
	}

	public function test_shortcodes_hulu_url() {
		$content  = "[hulu https://www.hulu.com/watch/$this->video_id]";
		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $this->src . $this->video_eid, $shortcode_content );
	}

	public function test_shortcodes_hulu_width_height() {
		$width    = '350';
		$height   = '500';
		$content  = "[hulu $this->video_id width=$width height=$height ]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $this->src . $this->video_eid, $shortcode_content );
		$this->assertContains( 'width="' . $width . '"', $shortcode_content );

		// The height is modified in the shortcode so the video always shows in landscape ratio.
		$this->assertContains( 'height="197"', $shortcode_content );
	}

	public function test_shortcodes_hulu_start_end_time_thumbnail() {
		$start     = '10';
		$end       = '20';
		$thumbnail = '10';
		$content  = "[hulu $this->video_id start_time=$start end_time=$end thumbnail_frame=$thumbnail]";

		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $this->src . $this->video_eid, $shortcode_content );
		$this->assertContains( 'st=' . $start, $shortcode_content );
		$this->assertContains( 'et=' . $end, $shortcode_content );
		$this->assertContains( 'it=i' . $thumbnail, $shortcode_content );
	}


	public function test_hulu_embed_to_shortcode() {
		$embed     = '<iframe width="512" height="288" src="http://www.hulu.com/embed.html?eid=' . $this->video_eid . '&et=20&st=10&it=i11" frameborder="0" scrolling="no" webkitAllowFullScreen mozallowfullscreen allowfullscreen></iframe>';
		$shortcode = apply_filters( 'pre_kses', $embed, 'post', wp_allowed_protocols() );

		$expected_shortcode = "[hulu id=$this->video_eid width=512 height=288 start_time=10 end_time=20 thumbnail_frame=11]";

		$this->assertEquals( $expected_shortcode, $shortcode );
	}

	/**
	 * Uses a real HTTP request to Hulu's oEmbed endpoint to
	 * translate id (human readable video ID) -> eid (Hulu's internal video ID).
	 *
	 * @see ::set_up()
	 * @group external-http
	 */
	public function test_shortcodes_hulu_id_via_oembed_http_request() {
		$this->markTestSkipped('<!-- Hulu Error: Hulu shortcode http error Service Unavailable -->');
		$content  = "[hulu $this->video_id]";
		$shortcode_content = do_shortcode( $content );

		$this->assertContains( $this->src . $this->video_eid, $shortcode_content );
	}
}
