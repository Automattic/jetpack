<?php
/**
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use PHPUnit\Framework\Attributes\CoversFunction;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/podcast-feed-credit/podcast-feed-credit.php';

/**
 * @covers ::wpcom_podcast_feed_credit_maybe_hook
 * @covers ::wpcom_podcast_feed_credit_append_to_summary
 * @covers ::wpcom_podcast_feed_credit_append_to_excerpt
 * @covers ::wpcom_podcast_feed_credit_append_to_content
 * @covers ::wpcom_podcast_feed_credit_text
 * @covers ::wpcom_podcast_feed_credit_show_title
 */
#[CoversFunction( 'wpcom_podcast_feed_credit_maybe_hook' )]
#[CoversFunction( 'wpcom_podcast_feed_credit_append_to_summary' )]
#[CoversFunction( 'wpcom_podcast_feed_credit_append_to_excerpt' )]
#[CoversFunction( 'wpcom_podcast_feed_credit_append_to_content' )]
#[CoversFunction( 'wpcom_podcast_feed_credit_text' )]
#[CoversFunction( 'wpcom_podcast_feed_credit_show_title' )]
class Podcast_Feed_Credit_Test extends \WorDBless\BaseTestCase {

	/**
	 * Site name before the test, restored in teardown.
	 *
	 * @var mixed
	 */
	private $blogname;

	/**
	 * A free WordPress.com site, so the gate reports no plan access. Plan
	 * gating itself is covered by the podcast package.
	 */
	public function set_up() {
		parent::set_up();
		Constants::set_constant( 'IS_WPCOM', true );
		$this->blogname = get_option( 'blogname' );
		update_option( 'podcasting_title', 'The Weekly Show' );
	}

	public function tear_down() {
		Constants::clear_constants();
		update_option( 'blogname', $this->blogname );
		delete_option( 'podcasting_title' );
		delete_option( 'podcasting_summary' );
		remove_action( 'rss2_head', array( Customize_Feed::class, 'output_channel_tags' ) );
		remove_filter( 'option_podcasting_summary', 'wpcom_podcast_feed_credit_append_to_summary' );
		remove_filter( 'default_option_podcasting_summary', 'wpcom_podcast_feed_credit_append_to_summary' );
		remove_filter( 'the_excerpt_rss', 'wpcom_podcast_feed_credit_append_to_excerpt', PHP_INT_MAX - 1 );
		remove_filter( 'the_content_feed', 'wpcom_podcast_feed_credit_append_to_content' );
		parent::tear_down();
	}

	/**
	 * The package adds this action only when the request is the podcast feed.
	 */
	private function claim_podcast_feed(): void {
		add_action( 'rss2_head', array( Customize_Feed::class, 'output_channel_tags' ) );
	}

	private function credit(): string {
		return 'The Weekly Show is made with Jetpack Podcast. Full show notes and every episode at ' . home_url( '/' );
	}

	/**
	 * The excerpt credit sits just below the package's `capture_item_summary()`
	 * at PHP_INT_MAX, so the captured `<description>` carries it.
	 */
	public function test_hooks_only_on_the_podcast_feed_and_below_the_summary_capture() {
		wpcom_podcast_feed_credit_maybe_hook();
		$this->assertFalse( has_filter( 'the_excerpt_rss', 'wpcom_podcast_feed_credit_append_to_excerpt' ) );

		$this->claim_podcast_feed();
		wpcom_podcast_feed_credit_maybe_hook();

		$this->assertSame( PHP_INT_MAX - 1, has_filter( 'the_excerpt_rss', 'wpcom_podcast_feed_credit_append_to_excerpt' ) );
		$this->assertSame( 10, has_filter( 'the_content_feed', 'wpcom_podcast_feed_credit_append_to_content' ) );
		$this->assertSame( 10, has_filter( 'option_podcasting_summary', 'wpcom_podcast_feed_credit_append_to_summary' ) );
		$this->assertSame( 10, has_filter( 'default_option_podcasting_summary', 'wpcom_podcast_feed_credit_append_to_summary' ) );
	}

	public function test_channel_summary_carries_the_credit_with_or_without_a_summary() {
		$this->claim_podcast_feed();
		wpcom_podcast_feed_credit_maybe_hook();

		$this->assertSame( $this->credit(), get_option( 'podcasting_summary', '' ) );

		update_option( 'podcasting_summary', 'Our weekly podcast.' );
		$this->assertSame( "Our weekly podcast.\n\n" . $this->credit(), get_option( 'podcasting_summary', '' ) );
	}

	/**
	 * `<description>` is CDATA, so `]]>` in the title gets the escape core
	 * gives generated excerpts.
	 */
	public function test_excerpt_credit_follows_a_blank_line_and_escapes_cdata_terminators() {
		$this->assertSame( "Show notes.\n\n" . $this->credit(), wpcom_podcast_feed_credit_append_to_excerpt( 'Show notes.' ) );
		$this->assertSame( $this->credit(), wpcom_podcast_feed_credit_append_to_excerpt( '' ) );

		update_option( 'podcasting_title', 'The Show]]>' );
		$this->assertStringContainsString( 'The Show]]&gt; is made with', wpcom_podcast_feed_credit_append_to_excerpt( 'Notes' ) );
	}

	public function test_html_credit_links_jetpack_podcast_and_the_site_and_leaves_empty_content_empty() {
		$html = wpcom_podcast_feed_credit_append_to_content( '<p>Notes</p>' );

		$this->assertStringStartsWith( '<p>Notes</p>', $html );
		$this->assertStringContainsString( '<a href="https://wordpress.com/podcast/">Jetpack Podcast</a>', $html );
		$this->assertStringContainsString( '<a href="' . esc_url( home_url( '/' ) ) . '">', $html );
		$this->assertSame( '', wpcom_podcast_feed_credit_append_to_content( '' ) );
	}

	public function test_show_title_falls_back_to_site_name_then_host() {
		update_option( 'podcasting_title', 'The <b>Weekly</b> Show' );
		$this->assertStringStartsWith( 'The Weekly Show is made with', wpcom_podcast_feed_credit_text() );

		delete_option( 'podcasting_title' );
		update_option( 'blogname', 'Example Site' );
		$this->assertStringStartsWith( 'Example Site is made with', wpcom_podcast_feed_credit_text() );

		update_option( 'blogname', '' );
		$this->assertStringStartsWith( wp_parse_url( home_url(), PHP_URL_HOST ) . ' is made with', wpcom_podcast_feed_credit_text() );
	}
}
