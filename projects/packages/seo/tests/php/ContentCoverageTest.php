<?php
/**
 * Tests for the content-coverage counts: the aggregate query, the transient
 * cache in front of it, and the invalidation hooks that keep it honest.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\SEO\Content_Coverage
 */
#[CoversClass( Content_Coverage::class )]
class ContentCoverageTest extends SeoTestCase {

	/**
	 * Clean up custom post types registered by these tests.
	 */
	protected function tearDown(): void {
		if ( post_type_exists( 'seo_book' ) ) {
			unregister_post_type( 'seo_book' );
		}

		parent::tearDown();
	}

	/**
	 * The factual content-coverage counts expose the expected integer shape
	 * (state, not a score).
	 */
	public function test_content_coverage_shape() {
		$coverage = Content_Coverage::get();

		foreach ( array( 'total', 'with_schema', 'with_title', 'with_description', 'with_search_visible' ) as $key ) {
			$this->assertArrayHasKey( $key, $coverage );
			$this->assertIsInt( $coverage[ $key ] );
		}

		// Search-visible can never exceed the total (it's total minus noindexed).
		$this->assertLessThanOrEqual( $coverage['total'], $coverage['with_search_visible'] );
	}

	/**
	 * The coverage query joins `wp_postmeta` on the key list `meta_keys()`
	 * returns, but counts each metric with its own CASE arm naming a `META_*`
	 * constant directly. Those two have to name the same keys: a key dropped from
	 * the join list (or a CASE arm pointing at a key the join never selected) makes
	 * the affected metric silently count zero rather than fail. Pin both lists.
	 */
	public function test_coverage_targets_the_seo_meta_keys_and_post_types() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		$this->assertEqualsCanonicalizing(
			array(
				Content_Coverage::META_SCHEMA_TYPE,
				Content_Coverage::META_TITLE,
				Content_Coverage::META_DESCRIPTION,
				Content_Coverage::META_NOINDEX,
			),
			$this->invoke_private( Content_Coverage::class, 'meta_keys' ),
			'Every meta key a CASE arm counts must also be selected by the join.'
		);

		$post_types = $this->invoke_private( Content_Coverage::class, 'post_types' );
		$this->assertContains( 'post', $post_types );
		$this->assertContains( 'page', $post_types );
		$this->assertContains( 'seo_book', $post_types );
		$this->assertNotContains( 'attachment', $post_types );
	}

	/**
	 * An empty site still gets a well-formed payload. The aggregate has no GROUP BY, so
	 * it returns its row even with nothing to count, and the Overview card destructures
	 * all five counts unconditionally.
	 */
	public function test_content_coverage_is_all_zeros_on_an_empty_site() {
		$this->assertSame(
			array(
				'total'               => 0,
				'with_schema'         => 0,
				'with_title'          => 0,
				'with_description'    => 0,
				'with_search_visible' => 0,
			),
			Content_Coverage::get()
		);
	}

	/**
	 * The counts against real content. Every fixture here is one the query could plausibly
	 * get wrong: a post with two rows for the same meta key must be counted once, not
	 * twice; an empty-string value means "not set"; noindex only counts on an exact '1',
	 * so '0' leaves the post search-visible; and drafts, trashed posts and unsupported
	 * post types are not part of the published set at all.
	 */
	public function test_content_coverage_counts_published_supported_content() {
		register_post_type(
			'seo_book',
			array(
				'label'        => 'Books',
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			)
		);

		// Published, everything set, and hidden from search.
		$this->publish(
			array(
				Content_Coverage::META_SCHEMA_TYPE => 'Article',
				Content_Coverage::META_TITLE       => 'A title',
				Content_Coverage::META_DESCRIPTION => 'A description',
				Content_Coverage::META_NOINDEX     => '1',
			)
		);

		// Published, nothing set.
		$this->publish();

		// Empty strings are not "set".
		$this->publish(
			array(
				Content_Coverage::META_TITLE       => '',
				Content_Coverage::META_DESCRIPTION => '',
			)
		);

		// noindex '0' is not noindexed — the post stays search-visible.
		$this->publish( array( Content_Coverage::META_NOINDEX => '0' ) );

		// Two rows for one key: the post has a title, and counts once.
		$duplicated = $this->publish();
		$this->add_meta_row( $duplicated, Content_Coverage::META_TITLE, 'first' );
		$this->add_meta_row( $duplicated, Content_Coverage::META_TITLE, 'second' );

		// A page counts alongside posts.
		$this->publish( array( Content_Coverage::META_DESCRIPTION => 'Page description' ), 'page' );

		// A supported custom post type counts across every SEO surface.
		$this->publish( array( Content_Coverage::META_TITLE => 'Book title' ), 'seo_book' );

		// None of these are part of the published set.
		$this->publish( array( Content_Coverage::META_TITLE => 'Draft title' ), 'post', 'draft' );
		$this->publish( array( Content_Coverage::META_TITLE => 'Trashed title' ), 'post', 'trash' );
		$this->publish( array( Content_Coverage::META_TITLE => 'Attachment title' ), 'attachment' );

		$this->assertSame(
			array(
				'total'               => 7,
				'with_schema'         => 1,
				'with_title'          => 3,
				'with_description'    => 2,
				'with_search_visible' => 6,
			),
			Content_Coverage::get()
		);
	}

	/**
	 * A warm cache is returned as-is. The seeded numbers can't have been recomputed —
	 * the database is emptied around every test, so a recompute yields zeros — which is
	 * what makes this prove the query was skipped rather than merely that the shape survived.
	 */
	public function test_content_coverage_is_served_from_the_cache() {
		set_transient( Content_Coverage::TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		$this->assertSame( $this->seeded_coverage(), Content_Coverage::get() );
	}

	/**
	 * A miss computes and then writes the counts back, so the next read is a hit.
	 */
	public function test_content_coverage_populates_the_cache_on_a_miss() {
		$this->assertFalse( get_transient( Content_Coverage::TRANSIENT ) );

		$coverage = Content_Coverage::get();

		$this->assertSame( $coverage, get_transient( Content_Coverage::TRANSIENT ) );
	}

	/**
	 * Anything in the transient that isn't a well-formed payload — a truncated write, a
	 * value left by an older version of this code, someone else's data under the key — is
	 * treated as a miss. The Overview card destructures all five counts unconditionally,
	 * so handing it a partial array would be worse than recomputing.
	 *
	 * @param mixed $garbage Value found in the transient.
	 * @dataProvider provide_malformed_cache_values
	 */
	#[DataProvider( 'provide_malformed_cache_values' )]
	public function test_malformed_cache_value_is_recomputed( $garbage ) {
		set_transient( Content_Coverage::TRANSIENT, $garbage, HOUR_IN_SECONDS );

		$coverage = Content_Coverage::get();

		$this->assertSame(
			array(
				'total'               => 0,
				'with_schema'         => 0,
				'with_title'          => 0,
				'with_description'    => 0,
				'with_search_visible' => 0,
			),
			$coverage
		);
	}

	/**
	 * @return array<string, array{mixed}>
	 */
	public static function provide_malformed_cache_values() {
		return array(
			'a string'           => array( 'nonsense' ),
			'a partial payload'  => array( array( 'total' => 5 ) ),
			'non-integer counts' => array(
				array(
					'total'               => '5',
					'with_schema'         => '1',
					'with_title'          => '1',
					'with_description'    => '1',
					'with_search_visible' => '5',
				),
			),
		);
	}

	/**
	 * Writing one of the four SEO fields the Overview counts drops the cache; writing any
	 * other post meta leaves it alone. Without that second half, every meta write on the
	 * site — and plugins write a lot of it — would throw the counts away.
	 */
	public function test_meta_change_invalidates_only_for_the_counted_keys() {
		set_transient( Content_Coverage::TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		Content_Coverage::invalidate_on_meta_change( 1, 123, '_edit_lock' );
		$this->assertSame(
			$this->seeded_coverage(),
			get_transient( Content_Coverage::TRANSIENT ),
			'An unrelated meta key must not invalidate the counts.'
		);

		Content_Coverage::invalidate_on_meta_change( 1, 123, Content_Coverage::META_DESCRIPTION );
		$this->assertFalse( get_transient( Content_Coverage::TRANSIENT ) );
	}

	/**
	 * Publishing and unpublishing move the counts; a transition between two unpublished
	 * states doesn't, and neither does one on a post type the Overview never counts.
	 *
	 * @param string $new_status  Status transitioned to.
	 * @param string $old_status  Status transitioned from.
	 * @param string $post_type   Post type transitioning.
	 * @param bool   $invalidates Whether the cache should be dropped.
	 * @dataProvider provide_status_transitions
	 */
	#[DataProvider( 'provide_status_transitions' )]
	public function test_status_change_invalidates_only_when_the_published_set_changes( $new_status, $old_status, $post_type, $invalidates ) {
		set_transient( Content_Coverage::TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		$post = new \WP_Post( (object) array( 'post_type' => $post_type ) );
		Content_Coverage::invalidate_on_status_change( $new_status, $old_status, $post );

		if ( $invalidates ) {
			$this->assertFalse( get_transient( Content_Coverage::TRANSIENT ) );
		} else {
			$this->assertSame( $this->seeded_coverage(), get_transient( Content_Coverage::TRANSIENT ) );
		}
	}

	/**
	 * @return array<string, array{string, string, string, bool}>
	 */
	public static function provide_status_transitions() {
		return array(
			'post published'         => array( 'publish', 'draft', 'post', true ),
			'page published'         => array( 'publish', 'auto-draft', 'page', true ),
			'post unpublished'       => array( 'draft', 'publish', 'post', true ),
			'post trashed'           => array( 'trash', 'publish', 'post', true ),
			'draft to pending'       => array( 'pending', 'draft', 'post', false ),
			'uncounted post type'    => array( 'publish', 'draft', 'attachment', false ),
			'uncounted type trashed' => array( 'trash', 'publish', 'product', false ),
		);
	}

	/**
	 * A hard delete drops the cache for the counted post types only. Trashing already went
	 * through the status transition; this is the path where an already-trashed post is
	 * deleted for good and transitions nothing.
	 */
	public function test_delete_invalidates_only_for_the_counted_post_types() {
		set_transient( Content_Coverage::TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		Content_Coverage::invalidate_on_delete( 123, new \WP_Post( (object) array( 'post_type' => 'attachment' ) ) );
		$this->assertSame( $this->seeded_coverage(), get_transient( Content_Coverage::TRANSIENT ) );

		Content_Coverage::invalidate_on_delete( 123, new \WP_Post( (object) array( 'post_type' => 'page' ) ) );
		$this->assertFalse( get_transient( Content_Coverage::TRANSIENT ) );
	}

	/**
	 * Every tracked write drops the transient, with no once-per-request guard: a later
	 * write in the same request must clear a cache a concurrent read re-warmed in between,
	 * so an intermediate count can't survive to the end of a bulk update.
	 */
	public function test_every_tracked_write_invalidates_the_cache() {
		set_transient( Content_Coverage::TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );

		Content_Coverage::invalidate_on_meta_change( 1, 123, Content_Coverage::META_TITLE );
		$this->assertFalse( get_transient( Content_Coverage::TRANSIENT ) );

		// A concurrent read re-warms the cache mid-write; the next write must still clear it.
		set_transient( Content_Coverage::TRANSIENT, $this->seeded_coverage(), HOUR_IN_SECONDS );
		Content_Coverage::invalidate_on_meta_change( 2, 124, Content_Coverage::META_TITLE );
		$this->assertFalse( get_transient( Content_Coverage::TRANSIENT ) );
	}
}
