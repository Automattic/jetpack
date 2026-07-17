<?php
/**
 * Podcast Episode Block render tests.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Podcast_Episode_Block;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Block;
use WP_Block_Supports;

// Stand in for the optional WooCommerce Email Editor helpers the email
// renderer leans on, so render_email() can run in the package test env.
require_once __DIR__ . '/../mocks/class-mock-podcast-table-wrapper-helper.php';
require_once __DIR__ . '/../mocks/class-mock-podcast-styles-helper.php';

/**
 * Render-path coverage for Podcast_Episode_Block.
 *
 * @covers \Automattic\Jetpack\Podcast\Podcast_Episode_Block
 */
#[CoversClass( Podcast_Episode_Block::class )]
class Podcast_Episode_Block_Test extends BaseTestCase {

	private $default_attrs = array( 'mediaUrl' => 'https://example.com/episode.mp3' );

	/**
	 * Prime WP_Block_Supports so direct render_block calls don't warn from
	 * get_block_wrapper_attributes().
	 */
	public function set_up() {
		parent::set_up();
		update_option( 'date_format', 'F j, Y' );
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'jetpack/podcast-episode',
			'attrs'     => array(),
		);
	}

	/**
	 * Tear down filters/options/block-supports state set in set_up.
	 */
	public function tear_down() {
		delete_option( 'podcasting_image' );
		delete_option( 'date_format' );
		WP_Block_Supports::$block_to_render = null;
		parent::tear_down();
	}

	private function create_episode_post( $title = 'Test Episode' ) {
		return wp_insert_post(
			array(
				'post_title'  => $title,
				'post_status' => 'publish',
			)
		);
	}

	private function block_ctx( $post_id ): WP_Block {
		// Construct a real WP_Block (matches render_block's @param) and
		// assign context post-hoc since the block isn't registered in this
		// test, so WP_Block::__construct skips its uses_context loop.
		$block          = new WP_Block(
			array(
				'blockName' => 'jetpack/podcast-episode',
				'attrs'     => array(),
			)
		);
		$block->context = array( 'postId' => $post_id );
		return $block;
	}

	/**
	 * Render with default_attrs merged with $extra and post context. Cleans up the post.
	 *
	 * @param array $extra Attributes to merge over default_attrs.
	 * @return string
	 */
	private function render( $extra ) {
		$post_id = $this->create_episode_post();
		$result  = Podcast_Episode_Block::render_block(
			array_merge( $this->default_attrs, $extra ),
			'',
			$this->block_ctx( $post_id )
		);
		wp_delete_post( $post_id, true );
		return $result;
	}

	public function test_renders_player_ignoring_saved_fallback_content() {
		$post_id = $this->create_episode_post();
		$result  = Podcast_Episode_Block::render_block(
			$this->default_attrs,
			'<a class="jetpack-podcast-episode__direct-link" href="x">x</a>',
			$this->block_ctx( $post_id )
		);
		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'jetpack-podcast-episode__player', $result );
		$this->assertStringNotContainsString( '__direct-link', $result );
	}

	public function test_empty_media_url_returns_empty_string() {
		$this->assertSame( '', Podcast_Episode_Block::render_block( array( 'mediaUrl' => '' ), 'fallback' ) );
	}

	public function test_invalid_media_url_returns_empty_string() {
		$this->assertSame( '', $this->render( array( 'mediaUrl' => 'not-a-valid-url' ) ) );
	}

	public function test_no_post_context_returns_empty_string() {
		$original        = $GLOBALS['post'] ?? null;
		$GLOBALS['post'] = null;
		$result          = Podcast_Episode_Block::render_block( $this->default_attrs, 'fallback' );
		$GLOBALS['post'] = $original;

		$this->assertSame( '', $result );
	}

	public function test_episode_cover_art_takes_precedence_over_show_cover() {
		update_option( 'podcasting_image', 'https://example.com/show-cover.jpg' );

		$result = $this->render(
			array(
				'coverArt' => array(
					'id'  => 42,
					'url' => 'https://example.com/episode-cover.jpg',
				),
			)
		);

		$this->assertStringContainsString( 'https://example.com/episode-cover.jpg', $result );
		$this->assertStringNotContainsString( 'https://example.com/show-cover.jpg', $result );
	}

	public function test_show_cover_used_when_no_episode_cover_art() {
		update_option( 'podcasting_image', 'https://example.com/show-cover.jpg' );
		$this->assertStringContainsString( 'https://example.com/show-cover.jpg', $this->render( array() ) );
	}

	public function test_malformed_cover_art_attribute_falls_back_to_show_cover() {
		update_option( 'podcasting_image', 'https://example.com/show-cover.jpg' );
		$this->assertStringContainsString(
			'https://example.com/show-cover.jpg',
			$this->render( array( 'coverArt' => 'malformed-string-value' ) )
		);
	}

	public function test_renders_post_title_author_and_date() {
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'episode_author',
				'user_pass'    => 'pass',
				'user_email'   => 'author@example.com',
				'display_name' => 'Jane Host',
			)
		);
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Episode 7: The Renderer',
				'post_status' => 'publish',
				'post_author' => $user_id,
				'post_date'   => '2026-04-15 10:00:00',
			)
		);

		$result    = Podcast_Episode_Block::render_block( $this->default_attrs, '', $this->block_ctx( $post_id ) );
		$permalink = get_permalink( $post_id );

		wp_delete_post( $post_id, true );
		wp_delete_user( $user_id );

		$this->assertStringContainsString( '<a href="' . esc_url( $permalink ) . '">Episode 7: The Renderer</a>', $result );
		$this->assertStringContainsString( 'Jane Host', $result );
		$this->assertStringContainsString( 'itemprop="author" itemscope itemtype="https://schema.org/Person"', $result );
		$this->assertStringContainsString( 'datetime="2026-04-15', $result );
	}

	public function test_video_media_type_renders_video_element() {
		$result = $this->render(
			array(
				'mediaUrl'  => 'https://example.com/episode.mp4',
				'mediaType' => 'video',
			)
		);

		$this->assertStringContainsString( '<video', $result );
		$this->assertStringContainsString( 'https://example.com/episode.mp4', $result );
		$this->assertStringContainsString( 'Watch the episode</a></video>', $result );
		$this->assertStringNotContainsString( '<audio', $result );
	}

	public function test_audio_media_type_renders_audio_element() {
		$result = $this->render( array() );
		$this->assertStringContainsString( '<audio', $result );
		$this->assertStringContainsString( 'Listen to the episode</a></audio>', $result );
		$this->assertStringNotContainsString( '<video', $result );
	}

	public function test_renders_trailer_bonus_and_explicit_badges() {
		$this->assertStringContainsString( '__badge--trailer', $this->render( array( 'episodeType' => 'trailer' ) ) );
		$this->assertStringContainsString( '__badge--bonus', $this->render( array( 'episodeType' => 'bonus' ) ) );
		$this->assertStringContainsString( '__badge--explicit', $this->render( array( 'explicit' => true ) ) );
	}

	public function test_renders_people_and_skips_nameless_entries() {
		$result = $this->render(
			array(
				'people' => array(
					array(
						'name' => 'Alex',
						'role' => 'host',
						'href' => 'https://example.com/alex',
					),
					array( 'role' => 'guest' ),
					array(
						'name' => 'Sam',
						'role' => 'producer',
					),
				),
			)
		);

		$this->assertStringContainsString( 'Alex', $result );
		$this->assertStringContainsString( 'Sam', $result );
		$this->assertStringContainsString( 'host', $result );
		$this->assertStringContainsString( 'producer', $result );
		$this->assertSame( 2, substr_count( $result, 'jetpack-podcast-episode__person"' ) );
	}

	public function test_renders_transcript_location_and_license_links() {
		$result = $this->render(
			array(
				'transcriptUrl' => 'https://example.com/transcript.vtt',
				'locationName'  => 'Brooklyn, NY',
				'license'       => 'CC-BY-4.0',
				'licenseUrl'    => 'https://creativecommons.org/licenses/by/4.0/',
			)
		);

		$this->assertStringContainsString( 'https://example.com/transcript.vtt', $result );
		$this->assertStringContainsString( 'Brooklyn, NY', $result );
		$this->assertStringContainsString( 'CC-BY-4.0', $result );
		$this->assertStringContainsString( 'https://creativecommons.org/licenses/by/4.0/', $result );
	}

	public function test_renders_soundbites_with_timestamp_and_title() {
		$result = $this->render(
			array(
				'soundbites' => array(
					array(
						'startTime' => 73,
						'title'     => 'Best moment',
					),
					array(
						'startTime' => 3661.5,
						'title'     => 'Hour-long mark',
					),
					array( 'title' => 'No timestamp, skipped' ),
				),
			)
		);

		$this->assertStringContainsString( '<time class="jetpack-podcast-episode__soundbite-time">1:13</time>', $result );
		$this->assertStringContainsString( 'Best moment', $result );
		$this->assertStringContainsString( '<time class="jetpack-podcast-episode__soundbite-time">1:01:01</time>', $result );
		$this->assertStringContainsString( 'Hour-long mark', $result );
		$this->assertStringNotContainsString( 'No timestamp, skipped', $result );
	}

	public function test_renders_alternate_enclosures_with_details() {
		$result = $this->render(
			array(
				'alternateEnclosures' => array(
					array(
						'url'     => 'https://example.com/episode-es.mp3',
						'type'    => 'audio/mpeg',
						'bitrate' => 128000,
						'lang'    => 'es',
						'title'   => 'Spanish dub',
					),
					array(
						'url'  => 'not-a-url',
						'type' => 'audio/mpeg',
					),
				),
			)
		);

		$this->assertStringContainsString( 'https://example.com/episode-es.mp3', $result );
		$this->assertStringContainsString( 'Spanish dub (es, 128 kbps, audio/mpeg)', $result );
		$this->assertStringContainsString( 'hreflang="es"', $result );
		$this->assertStringNotContainsString( 'not-a-url', $result );
	}

	public function test_filter_editor_script_src_rewrites_scheme_for_editor_handle() {
		$result = Podcast_Episode_Block::filter_editor_script_src(
			'http://mapped-domain.test/wp-content/plugins/foo/editor.js',
			Podcast_Episode_Block::EDITOR_HANDLE
		);

		$admin_scheme = wp_parse_url( admin_url(), PHP_URL_SCHEME );
		$this->assertSame(
			$admin_scheme . '://mapped-domain.test/wp-content/plugins/foo/editor.js',
			$result
		);
	}

	public function test_filter_editor_script_src_leaves_other_handles_unchanged() {
		$src = 'http://example.com/some-other-script.js';
		$this->assertSame( $src, Podcast_Episode_Block::filter_editor_script_src( $src, 'some-other-handle' ) );
	}

	/**
	 * Minimal email rendering context exposing the layout-width method
	 * render_email() probes via method_exists().
	 */
	private function email_context() {
		return new class() {
			public function get_layout_width_without_padding() {
				return '600px';
			}
		};
	}

	/**
	 * Render the email card for a freshly created episode post. Sets the global
	 * post because render_email() resolves the episode via get_post().
	 *
	 * @param array  $attrs Attributes to merge over default_attrs.
	 * @param string $title Episode post title.
	 * @return string
	 */
	private function render_email( array $attrs, $title = 'Test Episode' ) {
		$post_id         = $this->create_episode_post( $title );
		$GLOBALS['post'] = get_post( $post_id );

		$result = Podcast_Episode_Block::render_email(
			'',
			array( 'attrs' => array_merge( $this->default_attrs, $attrs ) ),
			$this->email_context()
		);

		$GLOBALS['post'] = null;
		wp_delete_post( $post_id, true );
		return $result;
	}

	public function test_render_email_builds_card_with_episode_details() {
		$result = $this->render_email(
			array(
				'seasonNumber'  => 1,
				'episodeNumber' => 9,
			),
			'Episode 9: Email Edition'
		);

		$this->assertStringContainsString( 'Episode 9: Email Edition', $result );
		$this->assertStringContainsString( 'Season 1', $result );
		$this->assertStringContainsString( 'Listen to the episode', $result );
		// Body content sits inside a (mocked) nested table, not loose in the cell.
		$this->assertStringContainsString( '<table', $result );
	}

	public function test_render_email_uses_watch_label_for_video() {
		$result = $this->render_email(
			array(
				'mediaUrl'  => 'https://example.com/episode.mp4',
				'mediaType' => 'video',
			)
		);

		$this->assertStringContainsString( 'Watch the episode', $result );
		$this->assertStringNotContainsString( 'Listen to the episode', $result );
	}

	public function test_render_email_returns_empty_for_invalid_media_url() {
		$this->assertSame( '', $this->render_email( array( 'mediaUrl' => 'not-a-url' ) ) );
	}
}
