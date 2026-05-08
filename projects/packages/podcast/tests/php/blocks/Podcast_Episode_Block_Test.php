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

/**
 * Render-path coverage for Podcast_Episode_Block::render_block.
 *
 * Exercises the key branching paths: non-frontend passthrough, empty/invalid
 * mediaUrl, missing post context, and the cover art fallback chain (episode
 * override vs show-level `podcasting_image` option).
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
	 * Force the is_frontend check to return true for tests that exercise the
	 * render path. Removed in tear_down to keep tests isolated.
	 */
	public function set_up() {
		parent::set_up();
		add_filter( 'jetpack_is_frontend', '__return_true' );
	}

	/**
	 * Remove the frontend filter and reset any global state touched by tests.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_is_frontend', '__return_true' );
		delete_option( 'podcasting_image' );
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
}
