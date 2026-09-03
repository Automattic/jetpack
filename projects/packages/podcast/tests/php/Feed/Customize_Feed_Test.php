<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Automattic\Jetpack\Podcast\Podcast_Gate;
use Jetpack_Options;
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
		delete_option( 'podcasting_feed_limit' );
		delete_option( 'podcasting_credit' );
		delete_option( 'blogname' );
		delete_option( Current_Plan::PLAN_OPTION );
		unset( $GLOBALS['jetpack_podcast_test_blog_details'] );
		Constants::clear_constants();
		self::reset_active_plan_cache();
		remove_all_filters( 'jetpack_podcast_feed_credit' );
		remove_all_filters( 'pre_attachment_url_to_postid' );
		remove_all_filters( 'wpcom_podcasting_enable_play_tracking' );
		remove_all_filters( 'wpcom_podcasting_tracked_blog_id' );
		Jetpack_Options::delete_option( 'id' );
		Customize_Feed::reset_render_state();
		wp_cache_flush();
		unset( $GLOBALS['post'] );
		parent::tearDown();
	}

	/**
	 * Put the gate on its WordPress.com path with a free plan carrying the given
	 * features, and no grandfathered blog details.
	 *
	 * @param string[] $features Active plan features.
	 */
	private function as_wpcom_with_plan_features( array $features ): void {
		$GLOBALS['jetpack_podcast_test_blog_details'] = array();
		Constants::set_constant( 'IS_WPCOM', true );
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = $features;
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		self::reset_active_plan_cache();
	}

	/**
	 * `Current_Plan::get()` memoizes for the request, leaking option writes between tests.
	 */
	private static function reset_active_plan_cache(): void {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * WorDBless lacks term-taxonomy plumbing, so seed the `terms` object cache
	 * with a fully-formed `WP_Term` directly — `get_category()` short-circuits
	 * to that before falling through to its DB query.
	 */
	private function seed_category_term( int $id ): void {
		$term = new WP_Term(
			(object) array(
				'term_id'          => $id,
				'name'             => 'Podcast',
				'slug'             => 'podcast-' . $id,
				'taxonomy'         => 'category',
				'term_taxonomy_id' => $id,
			)
		);
		wp_cache_set( $id, $term, 'terms' );
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

	/**
	 * Off-platform (the test environment) nothing forces the credit, so an
	 * unset option leaves every surface untouched.
	 */
	public function test_credit_is_off_by_default() {
		$this->assertFalse( Customize_Feed::credit_enabled() );
		$this->assertSame( 'Show notes.', Customize_Feed::append_credit( 'Show notes.' ) );
		$this->assertSame( '<p>Notes</p>', Customize_Feed::append_credit_to_content( '<p>Notes</p>' ) );
	}

	public function test_credit_option_appends_the_credit_after_a_blank_line() {
		update_option( 'podcasting_credit', true );
		update_option( 'podcasting_title', 'The Weekly Show' );

		$this->assertTrue( Customize_Feed::credit_enabled() );
		$this->assertSame(
			"Show notes.\n\nThe Weekly Show is made with Jetpack Podcast. Full show notes and every episode at " . home_url( '/' ),
			Customize_Feed::append_credit( 'Show notes.' )
		);
	}

	public function test_credit_stands_alone_when_there_is_no_text_to_append_to() {
		update_option( 'podcasting_credit', true );
		update_option( 'podcasting_title', 'The Weekly Show' );

		$this->assertStringStartsWith( 'The Weekly Show is made with Jetpack Podcast.', Customize_Feed::append_credit( '' ) );
	}

	public function test_credit_falls_back_to_the_site_name_without_a_show_title() {
		update_option( 'podcasting_credit', true );
		update_option( 'blogname', 'Example Site' );

		$this->assertStringStartsWith( 'Example Site is made with Jetpack Podcast.', Customize_Feed::credit_text() );
	}

	public function test_credit_strips_markup_and_cdata_terminators_from_the_show_title() {
		update_option( 'podcasting_credit', true );
		update_option( 'podcasting_title', 'The <b>Weekly</b> Show]]>' );

		$this->assertStringStartsWith( 'The Weekly Show is made with', Customize_Feed::credit_text() );
	}

	/**
	 * Core only falls back to the excerpt for `<content:encoded>` when the
	 * content is empty, so an empty body must stay empty.
	 */
	public function test_html_credit_leaves_empty_content_empty() {
		update_option( 'podcasting_credit', true );

		$this->assertSame( '', Customize_Feed::append_credit_to_content( '' ) );
		$this->assertStringStartsWith( "\n\n<p>", Customize_Feed::append_credit_to_content( "\n" ) );
	}

	public function test_credit_filter_can_force_it_either_way() {
		add_filter( 'jetpack_podcast_feed_credit', '__return_true' );
		$this->assertTrue( Customize_Feed::credit_enabled() );

		Customize_Feed::reset_render_state();
		remove_all_filters( 'jetpack_podcast_feed_credit' );
		update_option( 'podcasting_credit', true );
		add_filter( 'jetpack_podcast_feed_credit', '__return_false' );
		$this->assertFalse( Customize_Feed::credit_enabled() );
	}

	public function test_feed_description_carries_the_credit_when_on() {
		update_option( 'podcasting_credit', true );
		update_option( 'podcasting_summary', 'Our weekly podcast.' );
		update_option( 'podcasting_title', 'The Weekly Show' );

		$description = Customize_Feed::feed_description( 'irrelevant', 'description' );

		$this->assertStringStartsWith( 'Our weekly podcast.', $description );
		$this->assertStringContainsString( 'The Weekly Show is made with Jetpack Podcast.', $description );
	}

	public function test_html_credit_links_jetpack_podcast_and_the_site() {
		update_option( 'podcasting_credit', true );
		update_option( 'podcasting_title', 'The Weekly Show' );

		$html = Customize_Feed::append_credit_to_content( '<p>Notes</p>' );

		$this->assertStringStartsWith( '<p>Notes</p>', $html );
		$this->assertStringContainsString( '<a href="' . esc_url( Customize_Feed::CREDIT_URL ) . '">Jetpack Podcast</a>', $html );
		$this->assertStringContainsString( '<a href="' . esc_url( home_url( '/' ) ) . '">', $html );
	}

	/**
	 * A WordPress.com site without podcast plan access carries the credit with
	 * no option set; a filter can still switch it off.
	 */
	public function test_credit_is_forced_on_wordpress_com_without_plan_access() {
		$this->as_wpcom_with_plan_features( array() );

		$this->assertTrue( Customize_Feed::credit_forced() );
		$this->assertTrue( Customize_Feed::credit_enabled() );

		Customize_Feed::reset_render_state();
		add_filter( 'jetpack_podcast_feed_credit', '__return_false' );
		$this->assertFalse( Customize_Feed::credit_enabled() );
	}

	public function test_credit_follows_the_option_on_wordpress_com_with_plan_access() {
		$this->as_wpcom_with_plan_features( array( Podcast_Gate::FEATURE_SLUG ) );

		$this->assertFalse( Customize_Feed::credit_forced() );
		$this->assertFalse( Customize_Feed::credit_enabled() );

		Customize_Feed::reset_render_state();
		update_option( 'podcasting_credit', true );
		$this->assertTrue( Customize_Feed::credit_enabled() );
	}

	/**
	 * The credit filters sit just below `capture_item_summary()` on
	 * `the_excerpt_rss`, so the captured `<description>` carries the credit.
	 */
	public function test_maybe_register_feed_hooks_wires_the_credit_below_the_summary_capture() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );
		$previous_query      = $GLOBALS['wp_query'] ?? null;
		$GLOBALS['wp_query'] = $this->build_podcast_feed_query_mock( 17 );

		try {
			Customize_Feed::maybe_register_feed_hooks();

			$this->assertSame( PHP_INT_MAX, has_filter( 'the_excerpt_rss', array( Customize_Feed::class, 'capture_item_summary' ) ) );
			$this->assertSame( PHP_INT_MAX - 1, has_filter( 'the_excerpt_rss', array( Customize_Feed::class, 'append_credit_to_excerpt' ) ) );
			$this->assertSame( 10, has_filter( 'the_content_feed', array( Customize_Feed::class, 'append_credit_to_content' ) ) );
		} finally {
			$GLOBALS['wp_query'] = $previous_query;
			self::remove_feed_hooks();
		}
	}

	/**
	 * Undo everything `maybe_register_feed_hooks()` adds so later tests start clean.
	 */
	private static function remove_feed_hooks(): void {
		$class = Customize_Feed::class;
		remove_action( 'rss2_ns', array( $class, 'output_namespaces' ) );
		remove_filter( 'wp_title_rss', array( $class, 'feed_title' ) );
		remove_filter( 'bloginfo_rss', array( $class, 'feed_description' ) );
		remove_action( 'rss2_head', array( $class, 'reset_render_state' ), 0 );
		remove_action( 'rss2_head', array( $class, 'output_channel_tags' ) );
		remove_action( 'rss2_item', array( $class, 'output_item_tags' ) );
		remove_filter( 'rss_enclosure', array( $class, 'rewrite_enclosure' ) );
		remove_filter( 'the_excerpt_rss', array( $class, 'capture_item_summary' ), PHP_INT_MAX );
		remove_filter( 'the_excerpt_rss', array( $class, 'append_credit_to_excerpt' ), PHP_INT_MAX - 1 );
		remove_filter( 'the_content_feed', array( $class, 'append_credit_to_content' ) );
		remove_filter( 'option_rss_use_excerpt', '__return_false' );
		remove_filter( 'pre_render_block', array( $class, 'skip_block_in_feed' ) );
		remove_filter( 'comments_open', '__return_false' );
		remove_filter( 'get_comments_number', '__return_zero' );
		remove_filter( 'the_category_rss', '__return_empty_string' );
	}

	public function test_credit_uses_the_site_host_when_show_and_site_titles_are_empty() {
		update_option( 'podcasting_credit', true );

		$this->assertStringStartsWith(
			wp_parse_url( home_url(), PHP_URL_HOST ) . ' is made with Jetpack Podcast.',
			Customize_Feed::credit_text()
		);
	}

	/**
	 * With the credit on, the channel `<itunes:summary>` carries it after the
	 * summary, and stands in for the summary when none is set.
	 */
	public function test_output_channel_tags_carries_the_credit_in_itunes_summary() {
		update_option( 'podcasting_credit', true );
		update_option( 'podcasting_title', 'The Weekly Show' );
		update_option( 'podcasting_summary', 'Our weekly podcast.' );

		ob_start();
		Customize_Feed::output_channel_tags();
		$with_summary = (string) ob_get_clean();

		$this->assertStringContainsString( '<itunes:summary>Our weekly podcast.', $with_summary );
		$this->assertStringContainsString( 'The Weekly Show is made with Jetpack Podcast.', $with_summary );

		delete_option( 'podcasting_summary' );
		ob_start();
		Customize_Feed::output_channel_tags();
		$without_summary = (string) ob_get_clean();

		$this->assertStringContainsString( '<itunes:summary>The Weekly Show is made with Jetpack Podcast.', $without_summary );
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

		$this->assertStringContainsString( '<itunes:category text="Technology" />', $xml );
		$this->assertStringNotContainsString( '</itunes:category>', $xml );
	}

	public function test_category_tag_emits_nested_subcategory() {
		$xml = Customize_Feed::category_tag( 'Technology,Tech News' );

		$this->assertStringContainsString( '<itunes:category text="Technology">', $xml );
		$this->assertStringContainsString( '<itunes:category text="Tech News" />', $xml );
		$this->assertStringContainsString( '</itunes:category>', $xml );
	}

	public function test_category_tag_translates_legacy_aliases() {
		// 'Tech News' on its own was a legacy malformed value; should be promoted to Technology > Tech News.
		$xml = Customize_Feed::category_tag( 'Tech News' );

		$this->assertStringContainsString( '<itunes:category text="Technology">', $xml );
		$this->assertStringContainsString( '<itunes:category text="Tech News" />', $xml );
	}

	public function test_category_tag_translates_renamed_sports_subcategories() {
		$football = Customize_Feed::category_tag( 'Sports,Football' );
		$this->assertStringContainsString( '<itunes:category text="Sports">', $football );
		$this->assertStringContainsString( '<itunes:category text="American Football" />', $football );

		$soccer = Customize_Feed::category_tag( 'Sports,Soccer' );
		$this->assertStringContainsString( '<itunes:category text="Sports">', $soccer );
		$this->assertStringContainsString( '<itunes:category text="Football (Soccer)" />', $soccer );
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

	public function test_rewrite_enclosure_keeps_original_url_when_blog_id_cannot_be_resolved() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'         => 42,
				'post_type'  => 'post',
				'post_title' => 'Test Episode',
			)
		);

		// No Jetpack_Options 'id' set, no IS_WPCOM, no filter → no blog ID resolvable.
		add_filter(
			'pre_attachment_url_to_postid',
			static function ( $pre, $url ) {
				return 'https://example.com/path/episode.mp3' === $url ? 9001 : $pre;
			},
			10,
			2
		);

		$original = '<enclosure url="https://example.com/path/episode.mp3" length="123" type="audio/mpeg" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString( 'url="https://example.com/path/episode.mp3"', $result );
		$this->assertStringNotContainsString( 'public-api.wordpress.com', $result );
	}

	public function test_rewrite_enclosure_falls_back_to_jetpack_connection_id_when_no_filter_set() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'         => 42,
				'post_type'  => 'post',
				'post_title' => 'Test Episode',
			)
		);

		Jetpack_Options::update_option( 'id', 111139149 );

		add_filter(
			'pre_attachment_url_to_postid',
			static function ( $pre, $url ) {
				return 'https://example.com/path/episode.mp3' === $url ? 9001 : $pre;
			},
			10,
			2
		);

		$original = '<enclosure url="https://example.com/path/episode.mp3" length="123" type="audio/mpeg" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString(
			'url="https://public-api.wordpress.com/wpcom/v2/sites/111139149/podcast-play/42.mp3"',
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

	/**
	 * Core `rss_enclosure()` emits one `<enclosure>` per `enclosure` post-meta
	 * row, and posts accumulate several as the source URL drifts across saves.
	 * All rows rewrite to the same post-ID-keyed stats URL, so the second and
	 * subsequent rows must be dropped — a valid podcast item has exactly one.
	 */
	public function test_rewrite_enclosure_drops_repeated_rows_that_collapse_to_same_stats_url() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'        => 4242,
				'post_type' => 'post',
			)
		);

		add_filter(
			'wpcom_podcasting_tracked_blog_id',
			static function () {
				return 555;
			}
		);

		// Two distinct source URLs — a re-upload / CDN-host drift — both
		// resolve to real attachments and both rewrite to `.../4242.mp3`.
		add_filter(
			'pre_attachment_url_to_postid',
			static function ( $pre, $url ) {
				if ( 'https://i0.wp.com/example.com/episode.mp3' === $url ) {
					return 8001;
				}
				if ( 'https://i1.wp.com/example.com/episode.mp3' === $url ) {
					return 8002;
				}
				return $pre;
			},
			10,
			2
		);

		$first  = Customize_Feed::rewrite_enclosure( '<enclosure url="https://i0.wp.com/example.com/episode.mp3" length="123" type="audio/mpeg" />' );
		$second = Customize_Feed::rewrite_enclosure( '<enclosure url="https://i1.wp.com/example.com/episode.mp3" length="123" type="audio/mpeg" />' );

		$this->assertStringContainsString(
			'url="https://public-api.wordpress.com/wpcom/v2/sites/555/podcast-play/4242.mp3"',
			$first
		);
		$this->assertSame( '', $second );
	}

	/**
	 * The dedup registry is per feed render: `reset_render_state()` (hooked
	 * on `rss2_head`) clears it so re-generating the same feed within one
	 * long-lived process emits enclosures again instead of dropping them all.
	 */
	public function test_reset_render_state_lets_the_same_url_emit_on_a_fresh_render() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'        => 4242,
				'post_type' => 'post',
			)
		);

		add_filter( 'wpcom_podcasting_enable_play_tracking', '__return_false' );

		$markup = '<enclosure url="https://example.com/episode.mp3" length="123" type="audio/mpeg" />';

		$this->assertStringContainsString( 'url="https://example.com/episode.mp3"', Customize_Feed::rewrite_enclosure( $markup ) );
		$this->assertSame( '', Customize_Feed::rewrite_enclosure( $markup ) );

		Customize_Feed::reset_render_state();

		$this->assertStringContainsString( 'url="https://example.com/episode.mp3"', Customize_Feed::rewrite_enclosure( $markup ) );
	}

	public function test_resolve_category_id_prefers_numeric_id_over_archive_slug() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );
		update_option( 'podcasting_archive', 'unrelated-slug' );

		// If the numeric path were skipped, slug lookup would hit the DB,
		// find no term, and return 0 — so the assertion below covers both
		// "right answer" and "took the right code path".
		$this->assertSame( 17, Customize_Feed::resolve_category_id() );
	}

	/**
	 * A numeric ID whose term no longer exists means "not configured" — the
	 * `podcasting_archive` slug must NOT be consulted as a fallback, even
	 * when it would resolve.
	 */
	public function test_resolve_category_id_returns_zero_when_stored_category_deleted() {
		update_option( 'podcasting_category_id', 12345 ); // No such term seeded.

		// A resolvable slug that must be ignored on the deleted-ID path.
		$callback = static function ( $terms, $query ) {
			if ( isset( $query->query_vars['slug'] ) && 'resolvable-slug' === $query->query_vars['slug'][0] ) {
				return array(
					new WP_Term(
						(object) array(
							'term_id'  => 777,
							'slug'     => 'resolvable-slug',
							'name'     => 'Podcast',
							'taxonomy' => 'category',
						)
					),
				);
			}
			return $terms;
		};
		add_filter( 'terms_pre_query', $callback, 10, 2 );

		update_option( 'podcasting_archive', 'resolvable-slug' );

		$this->assertSame( 0, Customize_Feed::resolve_category_id() );

		remove_filter( 'terms_pre_query', $callback, 10 );
	}

	public function test_output_namespaces_declares_itunes_and_podcast() {
		ob_start();
		Customize_Feed::output_namespaces();
		$xml = (string) ob_get_clean();

		$this->assertStringContainsString( 'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"', $xml );
		$this->assertStringContainsString( 'xmlns:podcast="https://podcastindex.org/namespace/1.0"', $xml );
		$this->assertStringNotContainsString( 'googleplay', $xml );
	}

	public function test_filter_posts_with_enclosure_passes_through_non_feed_query() {
		$posts = array( new WP_Post( (object) array( 'ID' => 1 ) ) );
		$query = $this->build_podcast_feed_query_mock( 17, array( 'is_feed' => false ) );

		$this->assertSame( $posts, Customize_Feed::filter_posts_with_enclosure( $posts, $query ) );
	}

	public function test_filter_posts_with_enclosure_passes_through_when_no_podcast_category_configured() {
		// No `podcasting_category_id` option set → `resolve_category_id()` returns 0.
		$posts = array( new WP_Post( (object) array( 'ID' => 1 ) ) );
		$query = $this->build_podcast_feed_query_mock( 17 );

		$this->assertSame( $posts, Customize_Feed::filter_posts_with_enclosure( $posts, $query ) );
	}

	public function test_filter_posts_with_enclosure_passes_through_when_queried_term_does_not_match() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );

		$posts = array( new WP_Post( (object) array( 'ID' => 1 ) ) );
		$query = $this->build_podcast_feed_query_mock( 999 );

		$this->assertSame( $posts, Customize_Feed::filter_posts_with_enclosure( $posts, $query ) );
	}

	public function test_filter_posts_with_enclosure_drops_posts_without_enclosure_meta() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );

		$with_enclosure    = new WP_Post( (object) array( 'ID' => 100 ) );
		$without_enclosure = new WP_Post( (object) array( 'ID' => 200 ) );
		add_post_meta( 100, 'enclosure', "https://example.com/ep.mp3\n12345\naudio/mpeg" );

		$query = $this->build_podcast_feed_query_mock( 17 );

		$result = Customize_Feed::filter_posts_with_enclosure( array( $with_enclosure, $without_enclosure ), $query );

		$this->assertCount( 1, $result );
		$this->assertSame( 100, $result[0]->ID );

		delete_post_meta( 100, 'enclosure' );
	}

	public function test_constrain_feed_query_leaves_where_untouched_for_non_podcast_query() {
		$where = ' AND 1=1';
		$query = $this->build_podcast_feed_query_mock( 17, array( 'is_feed' => false ) );

		$this->assertSame( $where, Customize_Feed::constrain_feed_query( $where, $query ) );
	}

	public function test_constrain_feed_query_leaves_where_untouched_when_queried_term_does_not_match() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );

		$where = ' AND 1=1';
		$query = $this->build_podcast_feed_query_mock( 999 );

		$this->assertSame( $where, Customize_Feed::constrain_feed_query( $where, $query ) );
	}

	public function test_constrain_feed_query_appends_enclosure_exists_subquery_for_podcast_feed() {
		global $wpdb;
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );

		$query  = $this->build_podcast_feed_query_mock( 17 );
		$result = Customize_Feed::constrain_feed_query( ' AND 1=1', $query );

		// Constraint is a correlated EXISTS semi-join, so an episode with
		// several `enclosure` rows still yields exactly one post row — no
		// LIMIT-breaking duplicates.
		$this->assertStringContainsString(
			"EXISTS ( SELECT 1 FROM {$wpdb->postmeta} WHERE {$wpdb->postmeta}.post_id = {$wpdb->posts}.ID AND {$wpdb->postmeta}.meta_key = 'enclosure' )",
			$result
		);
		$this->assertStringStartsWith( ' AND 1=1', $result );
	}

	public function test_apply_feed_limit_sets_posts_per_rss_for_podcast_feed() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );
		update_option( 'podcasting_feed_limit', 25 );

		$query = $this->build_podcast_feed_query_mock( 17, array(), true );
		$query->expects( $this->once() )->method( 'set' )->with( 'posts_per_rss', 25 );

		Customize_Feed::apply_feed_limit( $query );
	}

	/**
	 * `pre_get_posts` runs for every query on the site, so the gate is what keeps
	 * the podcast limit off everyone else's feeds.
	 */
	public function test_apply_feed_limit_ignores_queries_that_are_not_the_podcast_feed() {
		$this->seed_category_term( 17 );
		update_option( 'podcasting_category_id', 17 );
		update_option( 'podcasting_feed_limit', 25 );

		$query = $this->build_podcast_feed_query_mock( 999, array(), true );
		$query->expects( $this->never() )->method( 'set' );

		Customize_Feed::apply_feed_limit( $query );
	}

	/**
	 * Build a `WP_Query` double pre-stubbed for the podcast-feed happy path,
	 * with optional per-method overrides.
	 *
	 * A stub unless `$expects_calls` — only the `apply_feed_limit` tests assert on
	 * a call, and handing every caller a mock makes PHPUnit flag the ones that
	 * configure no expectations.
	 *
	 * @param int   $queried_term_id Term ID returned from `get_queried_object()`.
	 * @param array $overrides       Map of method-name => return value to override defaults.
	 * @param bool  $expects_calls   Whether the caller will set expectations on the double.
	 */
	private function build_podcast_feed_query_mock( int $queried_term_id, array $overrides = array(), bool $expects_calls = false ) {
		$defaults = array(
			'is_main_query' => true,
			'is_feed'       => true,
			'is_category'   => true,
		);
		$stubs    = array_merge( $defaults, $overrides );

		$query = $expects_calls ? $this->createMock( \WP_Query::class ) : $this->createStub( \WP_Query::class );
		foreach ( $stubs as $method => $value ) {
			$query->method( $method )->willReturn( $value );
		}
		$query->method( 'get_queried_object' )->willReturn( (object) array( 'term_id' => $queried_term_id ) );

		return $query;
	}

	public function test_output_item_tags_emits_podcast_chapters_when_url_set() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 88,
				'post_type'    => 'post',
				'post_title'   => 'Chaptered Episode',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3","chaptersUrl":"https://example.com/ep-chapters.json","chaptersType":"application/json+chapters"} /-->',
			)
		);

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		$this->assertStringContainsString(
			'<podcast:chapters url="https://example.com/ep-chapters.json" type="application/json+chapters" />',
			$output
		);
	}

	public function test_output_item_tags_omits_podcast_chapters_when_url_empty() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 89,
				'post_type'    => 'post',
				'post_title'   => 'Unchaptered Episode',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3"} /-->',
			)
		);

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		$this->assertStringNotContainsString( '<podcast:chapters', $output );
	}

	public function test_output_item_tags_uses_block_cover_art_when_set() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 91,
				'post_type'    => 'post',
				'post_title'   => 'Block With Cover',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3","coverArt":{"id":42,"url":"https://example.com/cover.jpg"}} /-->',
			)
		);

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		$this->assertStringContainsString( '<itunes:image href="https://example.com/cover.jpg"', $output );
	}

	public function test_output_item_tags_emits_no_image_when_no_block_and_no_featured() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 92,
				'post_type'    => 'post',
				'post_title'   => 'Legacy Audio Post',
				'post_content' => '<p>Just a regular post with an audio enclosure.</p>',
			)
		);

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		// No block, no featured image → channel-level <itunes:image> applies by default.
		$this->assertStringNotContainsString( '<itunes:image', $output );
		$this->assertStringNotContainsString( '<podcast:', $output );
	}

	public function test_output_item_tags_defaults_chapters_type_when_attribute_missing() {
		global $post;
		$post = new WP_Post(
			(object) array(
				'ID'           => 90,
				'post_type'    => 'post',
				'post_title'   => 'Chaptered Episode',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3","chaptersUrl":"https://example.com/ep-chapters.json"} /-->',
			)
		);

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		$this->assertStringContainsString( 'type="application/json+chapters"', $output );
	}

	public function test_output_item_tags_uses_manual_excerpt_for_itunes_summary() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Episode with Excerpt',
				'post_status'  => 'publish',
				'post_excerpt' => 'Authored summary for this episode.',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3"} /-->',
			)
		);

		global $post;
		$post = get_post( $post_id );
		setup_postdata( $post );

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		wp_reset_postdata();

		$this->assertStringContainsString(
			'<itunes:summary>Authored summary for this episode.</itunes:summary>',
			$output
		);
	}

	/**
	 * No manual excerpt → `<itunes:summary>` mirrors WP's auto excerpt, which drops the player block and keeps only prose.
	 */
	public function test_output_item_tags_uses_auto_excerpt_when_no_manual_excerpt() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Episode without Show notes',
				'post_status'  => 'publish',
				'post_excerpt' => '',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3"} /--><p>Body prose that listeners should see.</p>',
			)
		);

		global $post;
		$post = get_post( $post_id );
		setup_postdata( $post );

		ob_start();
		Customize_Feed::output_item_tags();
		$output = (string) ob_get_clean();

		wp_reset_postdata();

		$this->assertStringContainsString( '<itunes:summary>', $output );
		$this->assertStringContainsString( 'Body prose that listeners should see.', $output );
		$this->assertStringNotContainsString( 'mediaUrl', $output );
		$this->assertStringNotContainsString( 'example.com/ep.mp3', $output );
	}

	/**
	 * `<itunes:summary>` reuses the `<description>` captured for the same item,
	 * and `reset_render_state()` drops it — otherwise a second render in one
	 * long-lived process could match a stale post ID and emit the previous
	 * feed's text instead of falling back to a fresh excerpt.
	 */
	public function test_reset_render_state_drops_the_captured_item_summary() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Episode with Excerpt',
				'post_status'  => 'publish',
				'post_excerpt' => 'Authored summary for this episode.',
				'post_content' => '<!-- wp:jetpack/podcast-episode {"mediaUrl":"https://example.com/ep.mp3"} /-->',
			)
		);

		global $post;
		$post = get_post( $post_id );
		setup_postdata( $post );

		Customize_Feed::capture_item_summary( 'Summary the description actually printed.' );

		ob_start();
		Customize_Feed::output_item_tags();
		$reused = (string) ob_get_clean();

		Customize_Feed::reset_render_state();

		ob_start();
		Customize_Feed::output_item_tags();
		$after_reset = (string) ob_get_clean();

		wp_reset_postdata();

		$this->assertStringContainsString(
			'<itunes:summary>Summary the description actually printed.</itunes:summary>',
			$reused
		);
		$this->assertStringContainsString(
			'<itunes:summary>Authored summary for this episode.</itunes:summary>',
			$after_reset
		);
	}

	public function test_skip_block_in_feed_strips_episode_block() {
		$this->assertSame(
			'',
			Customize_Feed::skip_block_in_feed(
				'<figure class="wp-block-jetpack-podcast-episode">player widget</figure>',
				array( 'blockName' => 'jetpack/podcast-episode' )
			)
		);
	}

	public function test_skip_block_in_feed_strips_player_and_subscribe_blocks() {
		foreach ( array( 'jetpack/podcast-player', 'jetpack/subscriptions' ) as $block_name ) {
			$this->assertSame(
				'',
				Customize_Feed::skip_block_in_feed( 'rendered widget', array( 'blockName' => $block_name ) ),
				"Expected {$block_name} to be stripped from the feed body."
			);
		}
	}

	public function test_skip_block_in_feed_keeps_prose_blocks() {
		$html = '<p>Real show notes prose listeners should see.</p>';
		$this->assertSame(
			$html,
			Customize_Feed::skip_block_in_feed( $html, array( 'blockName' => 'core/paragraph' ) )
		);
	}

	public function test_skip_block_in_feed_keeps_classic_freeform_content() {
		$html = '<p>Classic editor content.</p>';
		$this->assertSame(
			$html,
			Customize_Feed::skip_block_in_feed( $html, array( 'blockName' => null ) )
		);
	}
}
