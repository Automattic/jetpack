<?php
/**
 * Tests for the Canonical URLs module.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/canonical-urls.php';

/**
 * Class Jetpack_Canonical_Urls_Test
 */
class Jetpack_Canonical_Urls_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_action( 'wp_head', 'jetpack_canonical_urls_output_tag' );
		parent::tear_down();
	}

	// -------------------------------------------------------------------------
	// Singular / archive behavior tests
	// -------------------------------------------------------------------------

	/**
	 * Test that output_tag produces no output on singular posts (WP core handles those).
	 */
	public function test_output_tag_skips_singular() {
		$post_id = self::factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );

		ob_start();
		jetpack_canonical_urls_output_tag();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	/**
	 * Test that output_tag produces output on the home page.
	 */
	public function test_output_tag_on_home() {
		$this->go_to( home_url( '/' ) );

		ob_start();
		jetpack_canonical_urls_output_tag();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'rel="canonical"', $output );
	}

	/**
	 * Test that output_tag produces output on a category archive.
	 */
	public function test_output_tag_on_category() {
		$category_id = self::factory()->category->create();
		self::factory()->post->create( array( 'post_category' => array( $category_id ) ) );
		$this->go_to( get_category_link( $category_id ) );

		ob_start();
		jetpack_canonical_urls_output_tag();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'rel="canonical"', $output );
	}

	// -------------------------------------------------------------------------
	// Output tag tests
	// -------------------------------------------------------------------------

	/**
	 * Test that output_tag produces nothing when URL is empty.
	 */
	public function test_output_tag_empty_url() {
		add_filter( 'jetpack_canonical_url', '__return_empty_string' );

		ob_start();
		jetpack_canonical_urls_output_tag();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		remove_filter( 'jetpack_canonical_url', '__return_empty_string' );
	}

	/**
	 * Test that output_tag produces a link element with the canonical URL.
	 */
	public function test_output_tag_renders_link() {
		$category_id = self::factory()->category->create();
		self::factory()->post->create( array( 'post_category' => array( $category_id ) ) );
		$this->go_to( get_category_link( $category_id ) );

		ob_start();
		jetpack_canonical_urls_output_tag();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'rel="canonical"', $output );
		$this->assertStringContainsString( get_category_link( $category_id ), $output );
	}

	/**
	 * Test that the jetpack_canonical_url filter can modify the URL.
	 */
	public function test_jetpack_canonical_url_filter() {
		$this->go_to( home_url( '/' ) );

		add_filter( 'jetpack_canonical_url', array( $this, 'filter_canonical_url_override' ) );

		ob_start();
		jetpack_canonical_urls_output_tag();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'https://example.com/custom/', $output );

		remove_filter( 'jetpack_canonical_url', array( $this, 'filter_canonical_url_override' ) );
	}

	/**
	 * Helper method for the jetpack_canonical_url filter test.
	 *
	 * @return string Custom URL.
	 */
	public function filter_canonical_url_override() {
		return 'https://example.com/custom/';
	}

	// -------------------------------------------------------------------------
	// Resolver: clean archive URLs
	// -------------------------------------------------------------------------

	/**
	 * Test resolver returns home_url for the default homepage.
	 */
	public function test_resolver_home_page() {
		$this->go_to( home_url( '/' ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( home_url( '/' ), $url );
	}

	/**
	 * Test resolver returns blog page permalink when a static front page is set.
	 */
	public function test_resolver_blog_page() {
		$front_page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$blog_page_id  = self::factory()->post->create( array( 'post_type' => 'page' ) );

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front_page_id );
		update_option( 'page_for_posts', $blog_page_id );

		$this->go_to( get_permalink( $blog_page_id ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_permalink( $blog_page_id ), $url );

		// Clean up.
		update_option( 'show_on_front', 'posts' );
		delete_option( 'page_on_front' );
		delete_option( 'page_for_posts' );
	}

	/**
	 * Test resolver returns the category link for a category archive.
	 */
	public function test_resolver_category() {
		$category_id = self::factory()->category->create();
		self::factory()->post->create( array( 'post_category' => array( $category_id ) ) );
		$this->go_to( get_category_link( $category_id ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_category_link( $category_id ), $url );
	}

	/**
	 * Test resolver returns the tag link for a tag archive.
	 */
	public function test_resolver_tag() {
		$tag_id  = self::factory()->tag->create();
		$post_id = self::factory()->post->create();
		wp_set_post_tags( $post_id, array( $tag_id ) );
		$this->go_to( get_tag_link( $tag_id ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_tag_link( $tag_id ), $url );
	}

	/**
	 * Test resolver returns the author posts URL for an author archive.
	 */
	public function test_resolver_author() {
		$user_id = self::factory()->user->create( array( 'role' => 'author' ) );
		self::factory()->post->create( array( 'post_author' => $user_id ) );
		$this->go_to( get_author_posts_url( $user_id ) );
		$this->assertTrue( is_author(), 'Expected is_author() after go_to author archive URL' );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();
		$this->assertSame( get_author_posts_url( $user_id ), $url );
	}

	/**
	 * Test resolver returns the year link for a yearly archive.
	 */
	public function test_resolver_year() {
		$post_id = self::factory()->post->create();
		$year    = (int) get_the_date( 'Y', $post_id );
		$this->go_to( get_year_link( $year ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_year_link( $year ), $url );
	}

	/**
	 * Test resolver returns the month link for a monthly archive.
	 */
	public function test_resolver_month() {
		$post_id = self::factory()->post->create();
		$year    = (int) get_the_date( 'Y', $post_id );
		$month   = (int) get_the_date( 'n', $post_id );
		$this->go_to( get_month_link( $year, $month ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_month_link( $year, $month ), $url );
	}

	/**
	 * Test resolver returns the day link for a daily archive.
	 */
	public function test_resolver_day() {
		$post_id = self::factory()->post->create();
		$year    = (int) get_the_date( 'Y', $post_id );
		$month   = (int) get_the_date( 'n', $post_id );
		$day     = (int) get_the_date( 'j', $post_id );
		$this->go_to( get_day_link( $year, $month, $day ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_day_link( $year, $month, $day ), $url );
	}

	/**
	 * Test resolver returns empty string for search pages.
	 */
	public function test_resolver_search_returns_empty() {
		$this->go_to( home_url( '?s=test' ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( '', $url );
	}

	/**
	 * Test resolver returns empty string for 404 pages.
	 */
	public function test_resolver_404_returns_empty() {
		$this->go_to( home_url( '?p=999999' ) );

		// Confirm we're actually on a 404.
		$this->assertTrue( is_404(), 'Expected a 404 page' );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( '', $url );
	}

	/**
	 * Test resolver returns the post type archive link for a custom post type archive.
	 */
	public function test_resolver_post_type_archive() {
		register_post_type(
			'book',
			array(
				'public'      => true,
				'has_archive' => true,
			)
		);
		self::factory()->post->create( array( 'post_type' => 'book' ) );
		$this->go_to( get_post_type_archive_link( 'book' ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_post_type_archive_link( 'book' ), $url );

		unregister_post_type( 'book' );
	}

	/**
	 * Test resolver appends pagination for paged views without pretty permalinks.
	 */
	public function test_resolver_pagination_plain_permalinks() {
		$category_id = self::factory()->category->create();
		// Create enough posts to trigger pagination.
		for ( $i = 0; $i < 15; $i++ ) {
			self::factory()->post->create( array( 'post_category' => array( $category_id ) ) );
		}

		$this->go_to( add_query_arg( 'paged', 2, get_category_link( $category_id ) ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertStringContainsString( 'paged=2', $url );
	}

	/**
	 * Test resolver uses query-based pagination for query-based archive URLs
	 * even when pretty permalinks are enabled globally.
	 */
	public function test_resolver_pagination_query_based_archive_with_pretty_permalinks() {
		$this->set_permalink_structure( '/%postname%/' );

		register_post_type(
			'no_rewrite_cpt',
			array(
				'public'      => true,
				'has_archive' => true,
				'rewrite'     => false,
			)
		);

		for ( $i = 0; $i < 15; $i++ ) {
			self::factory()->post->create( array( 'post_type' => 'no_rewrite_cpt' ) );
		}

		$archive_url = get_post_type_archive_link( 'no_rewrite_cpt' );
		$this->go_to( add_query_arg( 'paged', 2, $archive_url ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		// Should use query-based pagination since the archive URL contains a query string.
		$this->assertStringContainsString( 'paged=2', $url );
		$this->assertStringNotContainsString( '/page/', $url );

		unregister_post_type( 'no_rewrite_cpt' );
		$this->set_permalink_structure( '' );
	}

	// -------------------------------------------------------------------------
	// Resolver: archive URLs with query arguments
	// -------------------------------------------------------------------------

	/**
	 * Test that visiting the home page with a sorting argument still returns clean home_url.
	 */
	public function test_resolver_home_with_orderby_arg() {
		$this->go_to( home_url( '/?orderby=date' ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( home_url( '/' ), $url );
	}

	/**
	 * Test that visiting a category with UTM tracking params returns clean category link.
	 */
	public function test_resolver_category_with_utm_args() {
		$category_id = self::factory()->category->create();
		self::factory()->post->create( array( 'post_category' => array( $category_id ) ) );
		$this->go_to(
			add_query_arg(
				array(
					'utm_source' => 'google',
					'utm_medium' => 'cpc',
				),
				get_category_link( $category_id )
			)
		);

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_category_link( $category_id ), $url );
		$this->assertStringNotContainsString( 'utm_source', $url );
		$this->assertStringNotContainsString( 'utm_medium', $url );
	}

	/**
	 * Test that visiting a tag archive with fbclid returns clean tag link.
	 */
	public function test_resolver_tag_with_fbclid_arg() {
		$tag_id  = self::factory()->tag->create();
		$post_id = self::factory()->post->create();
		wp_set_post_tags( $post_id, array( $tag_id ) );
		$this->go_to( add_query_arg( 'fbclid', 'abc123', get_tag_link( $tag_id ) ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_tag_link( $tag_id ), $url );
		$this->assertStringNotContainsString( 'fbclid', $url );
	}

	/**
	 * Test that visiting an author archive with multiple tracking args returns clean URL.
	 */
	public function test_resolver_author_with_tracking_args() {
		$user_id = self::factory()->user->create( array( 'role' => 'author' ) );
		self::factory()->post->create( array( 'post_author' => $user_id ) );
		$this->go_to(
			add_query_arg(
				array(
					'gclid'        => 'xyz789',
					'utm_campaign' => 'test',
					'ref'          => 'sidebar',
				),
				get_author_posts_url( $user_id )
			)
		);
		$this->assertTrue( is_author(), 'Expected is_author() after go_to author archive URL' );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();
		$this->assertSame( get_author_posts_url( $user_id ), $url );
	}

	/**
	 * Test that visiting a date archive with a preview arg returns clean date link.
	 */
	public function test_resolver_date_with_preview_arg() {
		$post_id = self::factory()->post->create();
		$year    = (int) get_the_date( 'Y', $post_id );
		$this->go_to( add_query_arg( 'preview', 'true', get_year_link( $year ) ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_year_link( $year ), $url );
		$this->assertStringNotContainsString( 'preview', $url );
	}

	/**
	 * Test that visiting a post type archive with arbitrary unknown args still returns clean URL.
	 */
	public function test_resolver_post_type_archive_with_unknown_args() {
		register_post_type(
			'book',
			array(
				'public'      => true,
				'has_archive' => true,
			)
		);
		self::factory()->post->create( array( 'post_type' => 'book' ) );
		$this->go_to( add_query_arg( 'custom_filter', 'value', get_post_type_archive_link( 'book' ) ) );

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertSame( get_post_type_archive_link( 'book' ), $url );
		$this->assertStringNotContainsString( 'custom_filter', $url );

		unregister_post_type( 'book' );
	}

	/**
	 * Test that paged category with tracking args returns URL with pagination but no tracking.
	 */
	public function test_resolver_paged_category_with_tracking_args() {
		$category_id = self::factory()->category->create();
		for ( $i = 0; $i < 15; $i++ ) {
			self::factory()->post->create( array( 'post_category' => array( $category_id ) ) );
		}

		$this->go_to(
			add_query_arg(
				array(
					'paged'      => 2,
					'utm_source' => 'newsletter',
					'fbclid'     => 'abc',
				),
				get_category_link( $category_id )
			)
		);

		$url = Jetpack_Canonical_Urls_Resolver::get_canonical_url();

		$this->assertStringContainsString( 'paged=2', $url );
		$this->assertStringNotContainsString( 'utm_source', $url );
		$this->assertStringNotContainsString( 'fbclid', $url );
	}
}
