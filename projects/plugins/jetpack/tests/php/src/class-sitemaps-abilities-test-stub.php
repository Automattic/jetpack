<?php
/**
 * Test-only subclass of Sitemaps_Abilities that overrides the protected seams
 * (master sitemap URL, raw master sitemap XML, post counts) so the success
 * path can be exercised without a real permalink/rewrite stack, a stored
 * sitemap, or a `wp_count_posts()` factory.
 *
 * Tests for the dispatch / lock / cron logic do NOT need this stub — they
 * exercise the real `Sitemaps_Abilities::request_rebuild()` and assert on
 * real `wp_next_scheduled()` state.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Abilities\Sitemaps_Abilities;

/**
 * Test-only subclass overriding Sitemaps_Abilities's protected seams.
 *
 * - get_master_sitemap_url(): returns the seeded URL.
 * - get_master_sitemap_xml(): returns the seeded raw master-sitemap XML, so
 *   the real `get_sitemap_entries()` parser runs against a known document.
 * - count_published(): returns counts from the seeded map.
 */
class Sitemaps_Abilities_Test_Stub extends Sitemaps_Abilities {

	/**
	 * Seeded master sitemap URL.
	 *
	 * @var string
	 */
	public static $master_sitemap_url = '';

	/**
	 * Seeded raw master-sitemap XML. The real `get_sitemap_entries()` parser
	 * runs against this so parsing logic is covered by the same tests that
	 * cover the status projection.
	 *
	 * @var string
	 */
	public static $master_sitemap_xml = '';

	/**
	 * Seeded post-type → published-count map. Missing keys return 0.
	 *
	 * @var array<string, int>
	 */
	public static $counts = array();

	/**
	 * Reset every seam back to its default. Called from the test's tear_down().
	 */
	public static function reset(): void {
		self::$master_sitemap_url = '';
		self::$master_sitemap_xml = '';
		self::$counts             = array();
	}

	/**
	 * Expose the parent's `get_sitemap_entries()` parser for direct unit tests.
	 *
	 * @return array<int, array{loc:string, lastmod:string|null}>
	 */
	public static function call_get_sitemap_entries(): array {
		return parent::get_sitemap_entries();
	}

	/**
	 * Return the seeded master sitemap URL.
	 */
	protected static function get_master_sitemap_url(): string {
		return self::$master_sitemap_url;
	}

	/**
	 * Return the seeded raw master-sitemap XML instead of reading the librarian.
	 */
	protected static function get_master_sitemap_xml(): string {
		return self::$master_sitemap_xml;
	}

	/**
	 * Return the seeded count for the given post type, defaulting to 0.
	 *
	 * @param string $post_type Post type slug.
	 */
	protected static function count_published( string $post_type ): int {
		return (int) ( self::$counts[ $post_type ] ?? 0 );
	}
}
