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
		remove_all_filters( 'wpcom_podcasting_enable_play_tracking' );
		remove_all_filters( 'wpcom_podcasting_tracked_blog_id' );
		parent::tearDown();
	}

	public function test_explicit_string_handles_boolean_storage() {
		update_option( 'podcasting_explicit', true );
		$this->assertSame( 'true', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', false );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );
	}

	public function test_explicit_string_handles_legacy_string_storage() {
		update_option( 'podcasting_explicit', 'yes' );
		$this->assertSame( 'true', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', 'no' );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );

		update_option( 'podcasting_explicit', 'clean' );
		$this->assertSame( 'false', Customize_Feed::explicit_string() );
	}

	public function test_feed_description_replaces_only_description_field() {
		update_option( 'podcasting_summary', 'Our weekly podcast.' );

		$this->assertSame( 'Our weekly podcast.', Customize_Feed::feed_description( 'Original blog tagline', 'description' ) );
		$this->assertSame( 'Other value', Customize_Feed::feed_description( 'Other value', 'name' ) );
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

	public function test_pass_through_empty_excerpt_returns_empty_when_post_has_none() {
		// `get_the_excerpt()` returns '' when no global $post is set.
		$this->assertSame( '', Customize_Feed::pass_through_empty_excerpt( 'Some auto-generated excerpt' ) );
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

		$original = '<enclosure url="https://example.com/path/episode.M4A?v=1" length="123" type="audio/m4a" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString(
			'url="https://public-api.wordpress.com/wpcom/v2/sites/12345/podcast-play/42.m4a"',
			$result
		);

		unset( $GLOBALS['post'] );
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

		$original = '<enclosure url="https://example.com/episode.exe" length="1" type="audio/mpeg" />';
		$result   = Customize_Feed::rewrite_enclosure( $original );

		$this->assertStringContainsString(
			'url="https://public-api.wordpress.com/wpcom/v2/sites/99/podcast-play/7.mp3"',
			$result
		);

		unset( $GLOBALS['post'] );
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

		unset( $GLOBALS['post'] );
	}

	public function test_resolve_category_id_prefers_numeric_id_over_archive_slug() {
		update_option( 'podcasting_category_id', 17 );
		update_option( 'podcasting_archive', 'unrelated-slug' );

		// Should NOT trigger any get_term_by call — fail loudly if it does.
		$called = false;
		add_filter(
			'get_term_by',
			static function ( $term ) use ( &$called ) {
				$called = true;
				return $term;
			}
		);

		$this->assertSame( 17, Customize_Feed::resolve_category_id() );
		$this->assertFalse( $called, 'Slug fallback should be skipped when numeric ID is set.' );
	}
}
