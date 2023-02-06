<?php
/**
 * Tests for the sitemap constants.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-constants.php';

/**
 * Test class for Jetpack sitemap constants.
 *
 * @since 4.7.0
 */
class WP_Test_Jetpack_Sitemap_Constants extends WP_UnitTestCase {

	/**
	 * The capacity constants SITEMAP_MAX_BYTES, SITEMAP_MAX_ITEMS,
	 * and NEWS_SITEMAP_MAX_ITEMS must be positive integers and are bounded above
	 * according to the sitemap and news sitemap protocols.
	 *
	 * @link http://www.sitemaps.org/ Sitemap protocol.
	 * @link https://support.google.com/news/publisher/answer/74288?hl=en News sitemap extension.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_capacity_constants() {
		// Test range of JP_SITEMAP_MAX_BYTES.
		$this->assertTrue( is_int( JP_SITEMAP_MAX_BYTES ) );
		$this->assertGreaterThan( 0, JP_SITEMAP_MAX_BYTES );
		$this->assertLessThanOrEqual( JP_SITEMAP_MAX_BYTES, 716800 );

		// Test range of JP_SITEMAP_MAX_ITEMS.
		$this->assertTrue( is_int( JP_SITEMAP_MAX_ITEMS ) );
		$this->assertGreaterThan( 0, JP_SITEMAP_MAX_ITEMS );
		$this->assertLessThanOrEqual( 50000, JP_SITEMAP_MAX_ITEMS );

		// Test range of JP_NEWS_SITEMAP_MAX_ITEMS.
		$this->assertTrue( is_int( JP_NEWS_SITEMAP_MAX_ITEMS ) );
		$this->assertGreaterThan( 0, JP_NEWS_SITEMAP_MAX_ITEMS );
		$this->assertLessThanOrEqual( 1000, JP_NEWS_SITEMAP_MAX_ITEMS );
	}

	/**
	 * Sitemap type constants are all distinct.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_librarian_type_constants_distinct() {
		$this->assertNotEquals(
			JP_MASTER_SITEMAP_TYPE,
			JP_PAGE_SITEMAP_TYPE
		);
		$this->assertNotEquals(
			JP_MASTER_SITEMAP_TYPE,
			JP_PAGE_SITEMAP_INDEX_TYPE
		);
		$this->assertNotEquals(
			JP_MASTER_SITEMAP_TYPE,
			JP_IMAGE_SITEMAP_TYPE
		);
		$this->assertNotEquals(
			JP_MASTER_SITEMAP_TYPE,
			JP_IMAGE_SITEMAP_INDEX_TYPE
		);
		$this->assertNotEquals(
			JP_PAGE_SITEMAP_TYPE,
			JP_PAGE_SITEMAP_INDEX_TYPE
		);
		$this->assertNotEquals(
			JP_PAGE_SITEMAP_TYPE,
			JP_IMAGE_SITEMAP_TYPE
		);
		$this->assertNotEquals(
			JP_PAGE_SITEMAP_TYPE,
			JP_IMAGE_SITEMAP_INDEX_TYPE
		);
		$this->assertNotEquals(
			JP_PAGE_SITEMAP_INDEX_TYPE,
			JP_IMAGE_SITEMAP_TYPE
		);
		$this->assertNotEquals(
			JP_PAGE_SITEMAP_INDEX_TYPE,
			JP_IMAGE_SITEMAP_INDEX_TYPE
		);
		$this->assertNotEquals(
			JP_IMAGE_SITEMAP_TYPE,
			JP_IMAGE_SITEMAP_INDEX_TYPE
		);
	}
}
