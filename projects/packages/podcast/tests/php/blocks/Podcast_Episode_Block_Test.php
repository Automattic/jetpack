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
use WP_Block_Supports;

/**
 * Render-path coverage for Podcast_Episode_Block::render_block.
 *
 * Exercises the key branching paths: non-frontend passthrough, empty/invalid
 * mediaUrl, missing post context, the cover art fallback chain, and the
 * happy-path markup (title/author/date, badges, video vs audio, people).
 *
 * @covers \Automattic\Jetpack\Podcast\Podcast_Episode_Block
 */
#[CoversClass( Podcast_Episode_Block::class )]
class Podcast_Episode_Block_Test extends BaseTestCase {

	/**
	 * Default valid attributes used across multiple tests.
	 *
	 * @var array
	 */
	private $default_attrs = array(
		'mediaUrl' => 'https://example.com/episode.mp3',
	);

	/**
	 * Force the is_frontend check to return true and prime WP_Block_Supports so
	 * `get_block_wrapper_attributes()` in the render callback doesn't warn when
	 * tests invoke render_block() directly (outside WP's block render pipeline).
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_is_frontend', '__return_true' );

		// WorDBless leaves `date_format` unset; restore the WP default so
		// `get_the_date( '', $post )` returns a non-empty string.
		update_option( 'date_format', 'F j, Y' );

		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'jetpack/podcast-episode',
			'attrs'     => array(),
		);
	}

	/**
	 * Remove the frontend filter and reset any global state touched by tests.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_is_frontend', '__return_true' );
		delete_option( 'podcasting_image' );
		delete_option( 'date_format' );
		WP_Block_Supports::$block_to_render = null;
		parent::tear_down();
	}

	/**
	 * Create a published post and return its ID for use as episode context.
	 *
	 * @param string $title Optional post title.
	 * @return int
	 */
	private function create_episode_post( $title = 'Test Episode' ) {
		return wp_insert_post(
			array(
				'post_title'  => $title,
				'post_status' => 'publish',
			)
		);
	}

	/**
	 * Build a minimal WP_Block-like object carrying just enough context for the
	 * render callback to resolve the post ID from.
	 *
	 * @param int $post_id Post ID to embed in the context.
	 * @return object
	 */
	private function make_block_context( $post_id ) {
		return (object) array(
			'context' => array( 'postId' => $post_id ),
		);
	}

	/**
	 * When the request is not a frontend request (e.g. REST export, RSS, email),
	 * render_block must return the raw $content unchanged.
	 */
	public function test_non_frontend_returns_content_unchanged() {
		// Override the filter added in set_up to simulate a non-frontend context.
		remove_filter( 'jetpack_is_frontend', '__return_true' );
		add_filter( 'jetpack_is_frontend', '__return_false' );

		$result = Podcast_Episode_Block::render_block(
			array(),
			'<a href="https://example.com/episode.mp3">Listen</a>'
		);

		remove_filter( 'jetpack_is_frontend', '__return_false' );
		add_filter( 'jetpack_is_frontend', '__return_true' );

		$this->assertSame( '<a href="https://example.com/episode.mp3">Listen</a>', $result );
	}

	/**
	 * An empty mediaUrl should short-circuit to an empty string on the frontend.
	 */
	public function test_empty_media_url_returns_empty_string() {
		$result = Podcast_Episode_Block::render_block(
			array( 'mediaUrl' => '' ),
			'fallback'
		);

		$this->assertSame( '', $result );
	}

	/**
	 * A mediaUrl that is not a valid HTTP(S) URL (fails wp_http_validate_url)
	 * should return an empty string even when a post context is available.
	 */
	public function test_invalid_media_url_returns_empty_string() {
		$post_id = $this->create_episode_post();

		$result = Podcast_Episode_Block::render_block(
			array( 'mediaUrl' => 'not-a-valid-url' ),
			'fallback',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );

		$this->assertSame( '', $result );
	}

	/**
	 * Without a block context and without a global post, render_block should
	 * return an empty string rather than crash.
	 */
	public function test_no_post_context_returns_empty_string() {
		$original_post   = $GLOBALS['post'] ?? null;
		$GLOBALS['post'] = null;

		$result = Podcast_Episode_Block::render_block(
			$this->default_attrs,
			'fallback'
		);

		$GLOBALS['post'] = $original_post;

		$this->assertSame( '', $result );
	}

	/**
	 * When coverArt has a URL, that URL should appear in the rendered markup and
	 * the show-level cover should not.
	 */
	public function test_episode_cover_art_takes_precedence_over_show_cover() {
		update_option( 'podcasting_image', 'https://example.com/show-cover.jpg' );

		$post_id = $this->create_episode_post();
		$result  = Podcast_Episode_Block::render_block(
			array_merge(
				$this->default_attrs,
				array(
					'coverArt' => array(
						'id'  => 42,
						'url' => 'https://example.com/episode-cover.jpg',
					),
				)
			),
			'',
			$this->make_block_context( $post_id )
		);
		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'https://example.com/episode-cover.jpg', $result );
		$this->assertStringNotContainsString( 'https://example.com/show-cover.jpg', $result );
	}

	/**
	 * When no episode cover art is set, the show-level podcasting_image option
	 * should be used as the fallback.
	 */
	public function test_show_cover_used_when_no_episode_cover_art() {
		update_option( 'podcasting_image', 'https://example.com/show-cover.jpg' );

		$post_id = $this->create_episode_post();
		$result  = Podcast_Episode_Block::render_block(
			$this->default_attrs,
			'',
			$this->make_block_context( $post_id )
		);
		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'https://example.com/show-cover.jpg', $result );
	}

	/**
	 * A malformed coverArt attribute (e.g. a string from older serialised content
	 * or a manual block edit) must not raise PHP warnings and must fall back to
	 * the show-level cover art.
	 */
	public function test_malformed_cover_art_attribute_falls_back_to_show_cover() {
		update_option( 'podcasting_image', 'https://example.com/show-cover.jpg' );

		$post_id = $this->create_episode_post();
		$result  = Podcast_Episode_Block::render_block(
			array_merge(
				$this->default_attrs,
				array( 'coverArt' => 'malformed-string-value' )
			),
			'',
			$this->make_block_context( $post_id )
		);
		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'https://example.com/show-cover.jpg', $result );
	}

	/**
	 * Happy-path render emits the post title, author display name, and a
	 * machine-readable datetime for the publish date.
	 */
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

		$result = Podcast_Episode_Block::render_block(
			$this->default_attrs,
			'',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );
		wp_delete_user( $user_id );

		$this->assertStringContainsString( 'Episode 7: The Renderer', $result );
		$this->assertStringContainsString( 'Jane Host', $result );
		$this->assertStringContainsString( 'itemprop="author" itemscope itemtype="https://schema.org/Person"', $result );
		$this->assertStringContainsString( 'datetime="2026-04-15', $result );
	}

	/**
	 * Video mediaType renders a <video> element with the source URL,
	 * not the <audio> branch.
	 */
	public function test_video_media_type_renders_video_element() {
		$post_id = $this->create_episode_post();

		$result = Podcast_Episode_Block::render_block(
			array(
				'mediaUrl'  => 'https://example.com/episode.mp4',
				'mediaType' => 'video',
			),
			'',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( '<video', $result );
		$this->assertStringContainsString( 'https://example.com/episode.mp4', $result );
		$this->assertStringNotContainsString( '<audio', $result );
	}

	/**
	 * Default mediaType (or any non-video value) should render an <audio>
	 * element rather than <video>.
	 */
	public function test_audio_media_type_renders_audio_element() {
		$post_id = $this->create_episode_post();

		$result = Podcast_Episode_Block::render_block(
			$this->default_attrs,
			'',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( '<audio', $result );
		$this->assertStringNotContainsString( '<video', $result );
	}

	/**
	 * Trailer/bonus/explicit attributes each surface a badge in the meta line.
	 */
	public function test_renders_trailer_bonus_and_explicit_badges() {
		$post_id = $this->create_episode_post();

		$trailer = Podcast_Episode_Block::render_block(
			array_merge( $this->default_attrs, array( 'episodeType' => 'trailer' ) ),
			'',
			$this->make_block_context( $post_id )
		);
		$bonus   = Podcast_Episode_Block::render_block(
			array_merge( $this->default_attrs, array( 'episodeType' => 'bonus' ) ),
			'',
			$this->make_block_context( $post_id )
		);
		$adult   = Podcast_Episode_Block::render_block(
			array_merge( $this->default_attrs, array( 'explicit' => true ) ),
			'',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'jetpack-podcast-episode__badge--trailer', $trailer );
		$this->assertStringContainsString( 'jetpack-podcast-episode__badge--bonus', $bonus );
		$this->assertStringContainsString( 'jetpack-podcast-episode__badge--explicit', $adult );
	}

	/**
	 * The people array should render one <li> per person with name/role and
	 * skip entries that lack a name (defensive against partial input).
	 */
	public function test_renders_people_and_skips_nameless_entries() {
		$post_id = $this->create_episode_post();

		$result = Podcast_Episode_Block::render_block(
			array_merge(
				$this->default_attrs,
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
			),
			'',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'Alex', $result );
		$this->assertStringContainsString( 'Sam', $result );
		$this->assertStringContainsString( 'host', $result );
		$this->assertStringContainsString( 'producer', $result );
		$this->assertSame( 2, substr_count( $result, 'jetpack-podcast-episode__person"' ) );
	}

	/**
	 * Transcript URL, chapters URL, location, and license each surface a
	 * dedicated link/entry in the links list.
	 */
	public function test_renders_transcript_chapters_location_and_license_links() {
		$post_id = $this->create_episode_post();

		$result = Podcast_Episode_Block::render_block(
			array_merge(
				$this->default_attrs,
				array(
					'transcriptUrl' => 'https://example.com/transcript.vtt',
					'chaptersUrl'   => 'https://example.com/chapters.json',
					'locationName'  => 'Brooklyn, NY',
					'license'       => 'CC-BY-4.0',
					'licenseUrl'    => 'https://creativecommons.org/licenses/by/4.0/',
				)
			),
			'',
			$this->make_block_context( $post_id )
		);

		wp_delete_post( $post_id, true );

		$this->assertStringContainsString( 'https://example.com/transcript.vtt', $result );
		$this->assertStringContainsString( 'https://example.com/chapters.json', $result );
		$this->assertStringContainsString( 'Brooklyn, NY', $result );
		$this->assertStringContainsString( 'CC-BY-4.0', $result );
		$this->assertStringContainsString( 'https://creativecommons.org/licenses/by/4.0/', $result );
	}
}
