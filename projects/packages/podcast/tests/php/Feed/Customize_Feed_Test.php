<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Post;
use WP_Term;

/**
 * @covers \Automattic\Jetpack\Podcast\Feed\Customize_Feed
 */
#[CoversClass( Customize_Feed::class )]
class Customize_Feed_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();
		// WorDBless doesn't run `create_initial_taxonomies`, so register
		// `category` ourselves — `get_term_by()` short-circuits on
		// `! taxonomy_exists( 'category' )`.
		if ( ! taxonomy_exists( 'category' ) ) {
			register_taxonomy( 'category', 'post', array( 'hierarchical' => true ) );
		}
	}

	protected function tearDown(): void {
		delete_option( 'podcasting_explicit' );
		delete_option( 'podcasting_summary' );
		delete_option( 'podcasting_title' );
		delete_option( 'podcasting_category_id' );
		delete_option( 'podcasting_archive' );
		remove_all_filters( 'pre_attachment_url_to_postid' );
		remove_all_filters( 'wpcom_podcasting_enable_play_tracking' );
		remove_all_filters( 'wpcom_podcasting_tracked_blog_id' );
		unset( $GLOBALS['post'] );
		parent::tearDown();
	}

	/**
	 * The bool/string conversion to the iTunes spec's `'true'`/`'false'`
	 * literal — the underlying truthy coercion is covered by `Settings_Test`.
	 */
	public function test_explicit_string_emits_apple_spec_literal() {
		update_option( 'podcasting_explicit', true );
		$this->assertSame( 'true', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', 'yes' ); // Legacy storage.
		$this->assertSame( 'true', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', false );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', 'clean' ); // Legacy → not explicit.
		$this->assertSame( 'false', Customize_Feed::explicit_string() );
	}

	public function test_feed_description_replaces_only_description_field() {
		update_option( 'podcasting_summary', 'Our weekly podcast.' );

		$this->assertSame( 'Our weekly podcast.', Customize_Feed::feed_description( 'Original blog tagline', 'description' ) );
		$this->assertSame( 'Other value', Customize_Feed::feed_description( 'Other value', 'name' ) );
	}

	/**
	 * `bloginfo_rss()` echoes the filter return directly, so any markup in
	 * `podcasting_summary` would land unescaped in `<description>` without this.
	 */
	public function test_feed_description_strips_and_escapes_markup() {
		update_option( 'podcasting_summary', 'A <script>alert(1)</script> & "weekly" show.' );

		$result = Customize_Feed::feed_description( 'irrelevant', 'description' );

		$this->assertStringNotContainsString( '<script>', $result );
		$this->assertStringNotContainsString( '"', $result );
		$this->assertStringContainsString( '&amp;', $result );
	}

	public function test_feed_title_uses_override_when_set() {
		update_option( 'podcasting_title', 'My Podcast Show' );

		$this->assertSame( 'My Podcast Show', Customize_Feed::feed_title( 'Default Title' ) );
	}

	public function test_feed_title_falls_through_when_no_override_and_no_category() {
		update_option( 'podcasting_title', '' );
		update_option( 'podcasting_category_id', 0 );

		$this->assertSame( 'Default Title', Customize_Feed::feed_title( 'Default Title' ) );
	}

	public function test_category_tag_emits_empty_for_unset_value() {
		$this->assertSame( '', Customize_Feed::category_tag( '' ) );
	}

	public function test_category_tag_emits_single_category() {
		$xml = Customize_Feed::category_tag( 'Technology' );

		$this->assertStringContainsString( "<itunes:category text='Technology' />", $xml );
		$this->assertStringNotContainsString( '</itunes:category>', $xml );
	}

	public function test_category_tag_emits_nested_subcategory() {
		$xml = Customize_Feed::category_tag( 'Technology,Tech News' );

		$this->assertStringContainsString( "<itunes:category text='Technology'>", $xml );
		$this->assertStringContainsString( "<itunes:category text='Tech News' />", $xml );
		$this->assertStringContainsString( '</itunes:category>', $xml );
	}

	public function test_category_tag_translates_legacy_aliases() {
		// 'Tech News' on its own was a legacy malformed value; should be promoted to Technology > Tech News.
		$xml = Customize_Feed::category_tag( 'Tech News' );

		$this->assertStringContainsString( "<itunes:category text='Technology'>", $xml );
		$this->assertStringContainsString( "<itunes:category text='Tech News' />", $xml );
	}

	/**
	 * The auto-generated `wp_trim_excerpt` fallback is exactly what we want to
	 * suppress — when `post_excerpt` is blank, return `''` regardless of what
	 * upstream filters built from `post_content`.
	 */
	public function test_pass_through_empty_excerpt_suppresses_auto_generated_fallback() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 1,
				'post_excerpt' => '',
				'post_content' => 'Long body text that wp_trim_excerpt would normally summarize.',
			)
		);

		$this->assertSame( '', Customize_Feed::pass_through_empty_excerpt( 'Auto-generated from content...' ) );
	}

	public function test_pass_through_empty_excerpt_keeps_explicit_excerpt() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 1,
				'post_excerpt' => 'Hand-written summary.',
				'post_content' => 'Body content.',
			)
		);

		$this->assertSame( 'Hand-written summary.', Customize_Feed::pass_through_empty_excerpt( 'Hand-written summary.' ) );
	}

	public function test_pass_through_empty_excerpt_passes_through_when_no_post_global() {
		// Without `$post`, we can't tell if the excerpt was authored or
		// auto-generated, so leave the upstream value alone.
		$this->assertSame( 'something', Customize_Feed::pass_through_empty_excerpt( 'something' ) );
	}

	public function test_resolve_category_id_returns_zero_when_nothing_configured() {
		$this->assertSame( 0, Customize_Feed::resolve_category_id() );
	}

	/**
	 * Sites pre-dating numeric category storage only have `podcasting_archive`
	 * (slug). Failing to fall back here would silently break their feed —
	 * `is_category()` would never match in `maybe_register_feed_hooks()`.
	 */
	public function test_resolve_category_id_falls_back_to_archive_slug() {
		$expected_term_id = 4242;

		// Short-circuit `WP_Term_Query` to return our fake term without
		// touching the DB layer — `get_term_by()` returns the first match
		// from this query.
		$callback = static function ( $terms, $query ) use ( $expected_term_id ) {
			if ( isset( $query->query_vars['slug'] )
				&& 'podcast-archive-test' === $query->query_vars['slug'][0]
			) {
				return array(
					new WP_Term(
						(object) array(
							'term_id'  => $expected_term_id,
							'slug'     => 'podcast-archive-test',
							'name'     => 'Podcast',
							'taxonomy' => 'category',
						)
					),
				);
			}
			return $terms;
		};
		add_filter( 'terms_pre_query', $callback, 10, 2 );

		update_option( 'podcasting_archive', 'podcast-archive-test' );

		$this->assertSame( $expected_term_id, Customize_Feed::resolve_category_id() );

		remove_filter( 'terms_pre_query', $callback, 10 );
	}

	public function test_rewrite_enclosure_replaces_url_with_canonical_stats_endpoint() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'         => 42,
				'post_type'  => 'post',
				'post_title' => 'Test Episode',
			)
		);

		add_filter(
			'wpcom_podcasting_tracked_blog_id',
			static function () {
				return 12345;
			}
		);

		add_filter(
			'pre_attachment_url_to_postid',
			static function ( $pre, $url ) {
				return 'https://example.com/path/episode.M4A?v=1' === $url ? 9001 : $pre;
			},
			10,
			2
		);

		$original = '<enclosure url="https://example.com/path/episode.M4A?v=1" length="123" type="audio/m4a" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString(
			'url="https://public-api.wordpress.com/wpcom/v2/sites/12345/podcast-play/42.m4a"',
			$result
		);
	}

	public function test_rewrite_enclosure_falls_back_to_mp3_for_unknown_extension() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'        => 7,
				'post_type' => 'post',
			)
		);

		add_filter(
			'wpcom_podcasting_tracked_blog_id',
			static function () {
				return 99;
			}
		);

		add_filter(
			'pre_attachment_url_to_postid',
			static function ( $pre, $url ) {
				return 'https://example.com/episode.exe' === $url ? 9002 : $pre;
			},
			10,
			2
		);

		$original = '<enclosure url="https://example.com/episode.exe" length="1" type="audio/mpeg" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString(
			'url="https://public-api.wordpress.com/wpcom/v2/sites/99/podcast-play/7.mp3"',
			$result
		);
	}

	/**
	 * Back-compat: WPCOM's `private-podcasts.php` opts out of URL rewriting
	 * via the legacy filter for token-gated feeds. Renaming the filter without
	 * an alias would silently start serving public stats URLs in proxied
	 * private feeds — security-adjacent, so we keep both filter names hot.
	 */
	public function test_legacy_filter_can_disable_stats_url_rewrite() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'         => 123,
				'post_type'  => 'post',
				'post_title' => 'Test Episode',
			)
		);

		add_filter( 'wpcom_podcasting_enable_play_tracking', '__return_false' );

		$original = '<enclosure url="https://example.com/episode.mp3" length="12345" type="audio/mpeg" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString( 'url="https://example.com/episode.mp3"', $result );
		$this->assertStringNotContainsString( 'public-api.wordpress.com', $result );
	}

	public function test_resolve_category_id_prefers_numeric_id_over_archive_slug() {
		update_option( 'podcasting_category_id', 17 );
		update_option( 'podcasting_archive', 'unrelated-slug' );

		// If the numeric path were skipped, slug lookup would hit the DB,
		// find no term, and return 0 — so the assertion below covers both
		// "right answer" and "took the right code path".
		$this->assertSame( 17, Customize_Feed::resolve_category_id() );
	}

	/**
	 * Invoke a private static method on Customize_Feed via reflection.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Args.
	 * @return mixed
	 */
	private function invoke_private( string $method, array $args ) {
		$ref = new \ReflectionClass( Customize_Feed::class );
		$fn  = $ref->getMethod( $method );
		return $fn->invokeArgs( null, $args );
	}

	/**
	 * Capture stdout from a private static emit_* call.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Args.
	 * @return string
	 */
	private function capture_emit( string $method, array $args ): string {
		ob_start();
		$this->invoke_private( $method, $args );
		return (string) ob_get_clean();
	}

	private function make_episode_post( string $content ): WP_Post {
		return new WP_Post(
			(object) array(
				'ID'           => 1,
				'post_content' => $content,
			)
		);
	}

	public function test_episode_block_attrs_returns_attrs_for_first_block() {
		$post = $this->make_episode_post(
			'<!-- wp:jetpack/podcast-episode {"episodeNumber":7,"seasonNumber":2} /-->'
		);

		$attrs = $this->invoke_private( 'episode_block_attrs', array( $post ) );

		$this->assertSame( 7, $attrs['episodeNumber'] );
		$this->assertSame( 2, $attrs['seasonNumber'] );
	}

	public function test_episode_block_attrs_returns_empty_for_non_podcast_post() {
		$post = $this->make_episode_post( '<p>Just a plain post, no blocks.</p>' );

		$this->assertSame( array(), $this->invoke_private( 'episode_block_attrs', array( $post ) ) );
	}

	public function test_episode_block_attrs_first_wins_when_multiple_blocks() {
		$post = $this->make_episode_post(
			'<!-- wp:jetpack/podcast-episode {"episodeNumber":1} /-->'
			. '<!-- wp:jetpack/podcast-episode {"episodeNumber":99} /-->'
		);

		$attrs = $this->invoke_private( 'episode_block_attrs', array( $post ) );

		$this->assertSame( 1, $attrs['episodeNumber'] );
	}

	public function test_emit_episode_number_emits_both_namespaces() {
		$xml = $this->capture_emit( 'emit_episode_number', array( array( 'episodeNumber' => 12 ) ) );

		$this->assertStringContainsString( '<itunes:episode>12</itunes:episode>', $xml );
		$this->assertStringContainsString( '<podcast:episode>12</podcast:episode>', $xml );
	}

	public function test_emit_episode_number_skips_zero_and_negative() {
		$this->assertSame( '', $this->capture_emit( 'emit_episode_number', array( array( 'episodeNumber' => 0 ) ) ) );
		$this->assertSame( '', $this->capture_emit( 'emit_episode_number', array( array( 'episodeNumber' => -3 ) ) ) );
		$this->assertSame( '', $this->capture_emit( 'emit_episode_number', array( array() ) ) );
	}

	public function test_emit_season_number_emits_both_namespaces() {
		$xml = $this->capture_emit( 'emit_season_number', array( array( 'seasonNumber' => 4 ) ) );

		$this->assertStringContainsString( '<itunes:season>4</itunes:season>', $xml );
		$this->assertStringContainsString( '<podcast:season>4</podcast:season>', $xml );
	}

	public function test_emit_episode_type_emits_only_trailer_and_bonus() {
		$this->assertSame( '', $this->capture_emit( 'emit_episode_type', array( array( 'episodeType' => 'full' ) ) ) );
		$this->assertSame( '', $this->capture_emit( 'emit_episode_type', array( array() ) ) );

		$this->assertStringContainsString(
			'<itunes:episodeType>trailer</itunes:episodeType>',
			$this->capture_emit( 'emit_episode_type', array( array( 'episodeType' => 'trailer' ) ) )
		);
		$this->assertStringContainsString(
			'<itunes:episodeType>bonus</itunes:episodeType>',
			$this->capture_emit( 'emit_episode_type', array( array( 'episodeType' => 'bonus' ) ) )
		);
	}

	public function test_emit_explicit_override_only_emits_on_mismatch() {
		update_option( 'podcasting_explicit', false );

		// Channel says false, item says false → no tag.
		$this->assertSame( '', $this->capture_emit( 'emit_explicit_override', array( array( 'explicit' => false ) ) ) );

		// Channel says false, item says true → emit "true".
		$xml = $this->capture_emit( 'emit_explicit_override', array( array( 'explicit' => true ) ) );
		$this->assertStringContainsString( '<itunes:explicit>true</itunes:explicit>', $xml );

		// Attr missing entirely → no tag.
		$this->assertSame( '', $this->capture_emit( 'emit_explicit_override', array( array() ) ) );
	}

	public function test_emit_transcript_emits_url_and_validated_type() {
		$xml = $this->capture_emit(
			'emit_transcript',
			array(
				array(
					'transcriptUrl'  => 'https://example.com/t.vtt',
					'transcriptType' => 'text/vtt',
				),
			)
		);

		$this->assertStringContainsString( 'url="https://example.com/t.vtt"', $xml );
		$this->assertStringContainsString( 'type="text/vtt"', $xml );
		$this->assertStringContainsString( '<podcast:transcript', $xml );
	}

	public function test_emit_transcript_skips_when_url_blank() {
		$this->assertSame(
			'',
			$this->capture_emit( 'emit_transcript', array( array( 'transcriptUrl' => '   ' ) ) )
		);
	}

	public function test_emit_transcript_falls_back_to_vtt_for_unknown_type() {
		$xml = $this->capture_emit(
			'emit_transcript',
			array(
				array(
					'transcriptUrl'  => 'https://example.com/t.vtt',
					'transcriptType' => 'application/evil',
				),
			)
		);

		$this->assertStringContainsString( 'type="text/vtt"', $xml );
	}

	public function test_emit_location_emits_name_only() {
		$xml = $this->capture_emit( 'emit_location', array( array( 'locationName' => 'Lagos, Nigeria' ) ) );

		$this->assertStringContainsString( '<podcast:location>Lagos, Nigeria</podcast:location>', $xml );
	}

	public function test_emit_location_skips_when_blank() {
		$this->assertSame( '', $this->capture_emit( 'emit_location', array( array( 'locationName' => '' ) ) ) );
		$this->assertSame( '', $this->capture_emit( 'emit_location', array( array() ) ) );
	}

	public function test_emit_license_with_url() {
		$xml = $this->capture_emit(
			'emit_license',
			array(
				array(
					'license'    => 'CC BY 4.0',
					'licenseUrl' => 'https://creativecommons.org/licenses/by/4.0/',
				),
			)
		);

		$this->assertStringContainsString( 'url="https://creativecommons.org/licenses/by/4.0/"', $xml );
		$this->assertStringContainsString( '>CC BY 4.0</podcast:license>', $xml );
	}

	public function test_emit_license_name_only_when_url_blank() {
		$xml = $this->capture_emit(
			'emit_license',
			array( array( 'license' => 'All rights reserved' ) )
		);

		$this->assertStringContainsString( '<podcast:license>All rights reserved</podcast:license>', $xml );
		$this->assertStringNotContainsString( 'url=', $xml );
	}

	public function test_emit_license_skips_when_name_blank() {
		$this->assertSame(
			'',
			$this->capture_emit(
				'emit_license',
				array(
					array(
						'license'    => '',
						'licenseUrl' => 'https://example.com/license',
					),
				)
			)
		);
	}

	public function test_emit_people_one_tag_per_entry() {
		$xml = $this->capture_emit(
			'emit_people',
			array(
				array(
					'people' => array(
						array(
							'name' => 'Ada Lovelace',
							'role' => 'host',
							'href' => 'https://example.com/ada',
						),
						array(
							'name' => 'Grace Hopper',
							'role' => 'guest',
						),
						array( 'name' => '' ), // Skipped.
					),
				),
			)
		);

		$this->assertSame( 2, substr_count( $xml, '<podcast:person' ) );
		$this->assertStringContainsString( 'role="host"', $xml );
		$this->assertStringContainsString( 'href="https://example.com/ada"', $xml );
		$this->assertStringContainsString( '>Ada Lovelace</podcast:person>', $xml );
		$this->assertStringContainsString( '>Grace Hopper</podcast:person>', $xml );
	}

	public function test_emit_soundbites_emits_per_entry() {
		$xml = $this->capture_emit(
			'emit_soundbites',
			array(
				array(
					'soundbites' => array(
						array(
							'startTime' => 30,
							'duration'  => 15,
							'title'     => 'Best moment',
						),
						array(
							'startTime' => 120,
							'duration'  => 5,
						),
						array( 'startTime' => 99 ), // Skipped — no duration.
					),
				),
			)
		);

		$this->assertSame( 2, substr_count( $xml, '<podcast:soundbite' ) );
		$this->assertStringContainsString( 'startTime="30"', $xml );
		$this->assertStringContainsString( 'duration="15"', $xml );
		$this->assertStringContainsString( '>Best moment</podcast:soundbite>', $xml );
		// Title-less entry uses the self-closing form.
		$this->assertMatchesRegularExpression( '/startTime="120" duration="5" \/>/', $xml );
	}

	public function test_emit_alternate_enclosures_wraps_sources() {
		$xml = $this->capture_emit(
			'emit_alternate_enclosures',
			array(
				array(
					'alternateEnclosures' => array(
						array(
							'type'    => 'audio/aac',
							'length'  => 12345,
							'bitrate' => 96000,
							'sources' => array(
								array( 'uri' => 'https://cdn.example.com/ep.aac' ),
								array( 'uri' => 'https://mirror.example.com/ep.aac' ),
							),
						),
						array(
							// Flat shape (block's current schema): single URL, no sources array.
							'type'    => 'audio/mpeg',
							'bitrate' => 128000,
							'url'     => 'https://example.com/ep.mp3',
						),
					),
				),
			)
		);

		$this->assertSame( 2, substr_count( $xml, '<podcast:alternateEnclosure' ) );
		$this->assertSame( 3, substr_count( $xml, '<podcast:source' ) );
		$this->assertStringContainsString( 'type="audio/aac"', $xml );
		$this->assertStringContainsString( 'length="12345"', $xml );
		$this->assertStringContainsString( 'bitrate="96000"', $xml );
		$this->assertStringContainsString( 'uri="https://cdn.example.com/ep.aac"', $xml );
		$this->assertStringContainsString( 'uri="https://example.com/ep.mp3"', $xml );
	}

	public function test_emit_alternate_enclosures_skips_entries_without_sources() {
		$this->assertSame(
			'',
			$this->capture_emit(
				'emit_alternate_enclosures',
				array(
					array(
						'alternateEnclosures' => array(
							array( 'type' => 'audio/aac' ), // No url, no sources.
						),
					),
				)
			)
		);
	}

	public function test_output_namespaces_includes_podcast_namespace() {
		ob_start();
		Customize_Feed::output_namespaces();
		$xml = (string) ob_get_clean();

		$this->assertStringContainsString( 'xmlns:itunes=', $xml );
		$this->assertStringContainsString( 'xmlns:googleplay=', $xml );
		$this->assertStringContainsString( 'xmlns:podcast="https://podcastindex.org/namespace/1.0"', $xml );
	}
}
