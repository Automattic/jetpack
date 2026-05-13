<?php
/**
 * Test-only subclass of Sitemaps_Abilities that overrides the protected seams
 * (master sitemap URL, post counts) so the success path can be exercised
 * without a real permalink/rewrite stack or `wp_count_posts()` factory data.
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
 * - get_last_build_at(): returns the seeded timestamp or, when null, falls
 *   through to the parent implementation (so tests that set the
 *   `jetpack-sitemap-state` option directly still exercise the real
 *   derivation logic).
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
	 * Seeded last build timestamp. When null, the parent implementation runs
	 * so tests can exercise the real `jetpack-sitemap-state` derivation by
	 * just seeding the option.
	 *
	 * @var string|null
	 */
	public static $last_build_at = null;

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
		self::$last_build_at      = null;
		self::$counts             = array();
	}

	/**
	 * Expose the parent's `get_last_build_at()` for direct unit tests.
	 *
	 * @return string|null
	 */
	public static function call_get_last_build_at() {
		return parent::get_last_build_at();
	}

	/**
	 * Return the seeded master sitemap URL.
	 */
	protected static function get_master_sitemap_url(): string {
		return self::$master_sitemap_url;
	}

	/**
	 * Return the seeded timestamp, or fall through to the real implementation
	 * when no override is set.
	 *
	 * @return string|null
	 */
	protected static function get_last_build_at() {
		if ( null !== self::$last_build_at ) {
			return self::$last_build_at;
		}
		return parent::get_last_build_at();
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
